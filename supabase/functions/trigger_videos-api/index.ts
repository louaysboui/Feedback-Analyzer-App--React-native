import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;

async function fetchWithRetry(url: string, retries: number = 3, delay: number = 1000): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      console.log(`Attempt ${attempt + 1} for ${url}: Status ${response.status}`);
      if (response.ok) return response;
      if (response.status === 429) {
        console.warn(`Rate limit hit, retrying (${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        continue;
      }
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    } catch (err) {
      console.error(`Attempt ${attempt + 1} failed for ${url}:`, err);
      if (attempt === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

Deno.serve(async (req: Request) => {
  try {
    const { url, channelId, channelHandle } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Extract channel handle from URL if not provided
    const channelHandleMatch = url.match(/youtube\.com\/(@[a-zA-Z0-9_-]+)/);
    const handle = channelHandle || (channelHandleMatch ? channelHandleMatch[1] : null);
    if (!handle) {
      throw new Error("Could not extract channel handle from URL");
    }

    // 1. Check if channel exists
    const { data: existingChannel } = await supabase
      .from("yt_channels")
      .select("*")
      .eq("handle", handle)
      .maybeSingle();

    if (existingChannel && !channelId) {
      return new Response(
        JSON.stringify({ 
          status: "success", 
          channel: existingChannel,
          message: "Channel already exists" 
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch channel data from YouTube API if channelId is not provided
    let finalChannelId = channelId;
    let channelToInsert = null;

    if (!channelId) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`;
      const searchRes = await fetchWithRetry(searchUrl);
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) {
        throw new Error("Channel not found via YouTube API");
      }
      finalChannelId = searchData.items[0].id.channelId;

      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${finalChannelId}&key=${YOUTUBE_API_KEY}`;
      const channelRes = await fetchWithRetry(channelUrl);
      const channelData = await channelRes.json();
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel details not found");
      }
      const channelInfo = channelData.items[0];

      const bannerUrl = channelInfo.brandingSettings?.image?.bannerExternalUrl
        ? `${channelInfo.brandingSettings.image.bannerExternalUrl}=w2120-fcrop64=1,00005a57ffffa5a1`
        : null;

      channelToInsert = {
        id: finalChannelId,
        youtube_channel_id: finalChannelId,
        handle: handle,
        name: channelInfo.snippet.title,
        description: channelInfo.snippet.description || null,
        profile_image: channelInfo.snippet.thumbnails.high.url || null,
        banner_img: bannerUrl,
        subscribers: parseInt(channelInfo.statistics.subscriberCount || "0"),
        videos_count: parseInt(channelInfo.statistics.videoCount || "0"),
        views: parseInt(channelInfo.statistics.viewCount || "0"),
        created_date: channelInfo.snippet.publishedAt || null,
        location: channelInfo.snippet.country || null,
        url: url,
      };

      const { error: insertError } = await supabase
  .from("yt_channels")
  .upsert([channelToInsert], { onConflict: "id" })// or "youtube_channel_id" if that’s more appropriate
      if (insertError) throw insertError;
    }

    // 3. Collect videos if channelId is provided
    if (channelId || finalChannelId) {
      const scrapeJobId = crypto.randomUUID();
      const { error: jobError } = await supabase
        .from("scrape_jobs")
        .insert([{ id: scrapeJobId, status: "pending", channel_id: channelId || finalChannelId }]);
      if (jobError) throw jobError;

      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId || finalChannelId}&maxResults=50&type=video&key=${YOUTUBE_API_KEY}`;
      const videosRes = await fetchWithRetry(videosUrl);
      const videosData = await videosRes.json();
      if (!videosData.items || videosData.items.length === 0) {
        await supabase.from("scrape_jobs").update({ status: "ready" }).eq("id", scrapeJobId);
        return new Response(
          JSON.stringify({ 
            status: "success", 
            channel: channelToInsert || existingChannel,
            snapshot_id: scrapeJobId,
            count: 0
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      // Fetch video statistics
      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
      const statsRes = await fetchWithRetry(statsUrl);
      const statsData = await statsRes.json();
      if (!statsData.items) {
        console.error("No statistics data returned for video IDs:", videoIds);
      }

      const videos = videosData.items.map((item: any) => {
        const stats = statsData.items ? statsData.items.find((stat: any) => stat.id === item.id.videoId) : null;
        return {
          id: item.id.videoId,
          youtuber_id: channelId || finalChannelId,
          title: item.snippet.title,
          description: item.snippet.description || null,
          preview_image: item.snippet.thumbnails.high.url || null,
          date_posted: item.snippet.publishedAt || null,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          views: stats ? parseInt(stats.statistics.viewCount || "0") : 0,
          likes: stats ? parseInt(stats.statistics.likeCount || "0") : 0,
        };
      });

      const { error: videosError } = await supabase
        .from("yt_videos")
        .upsert(videos, { onConflict: "id" });
      if (videosError) {
        console.error("Video upsert error:", videosError);
        throw videosError;
      }

      // Collect comments for each video (limit to first 5 videos to manage quota)
      let totalComments = 0;
      for (const video of videos.slice(0, 5)) {
        try {
          console.log(`Fetching comments for video ${video.id} (youtuber_id: ${video.youtuber_id})`);
          const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id}&maxResults=50&key=${YOUTUBE_API_KEY}`;
          const commentsRes = await fetchWithRetry(commentsUrl);
          const commentsData = await commentsRes.json();

          if (commentsData.error) {
            console.error(`YouTube API error for video ${video.id}:`, commentsData.error.message);
            continue;
          }

          if (commentsData.items && commentsData.items.length > 0) {
            const comments = commentsData.items.map((item: any) => ({
              id: item.id,
              video_id: video.id,
              youtuber_id: video.youtuber_id,
              text: item.snippet.topLevelComment.snippet.textDisplay,
              author: item.snippet.topLevelComment.snippet.authorDisplayName,
              // Only include published_at if column exists
              published_at: item.snippet.topLevelComment.snippet.publishedAt || null,
            }));

            const { error: commentsError } = await supabase
              .from("yt_comments")
              .upsert(comments, { onConflict: "id" });
            if (commentsError) {
              console.error(`Failed to insert comments for video ${video.id}:`, commentsError.message, commentsError.details);
            } else {
              console.log(`Inserted ${comments.length} comments for video ${video.id}`);
              totalComments += comments.length;
            }
          } else {
            console.log(`No comments found for video ${video.id}`);
          }
        } catch (err: any) {
          console.error(`Error fetching comments for video ${video.id}:`, err.message);
        }
      }

      await supabase.from("scrape_jobs").update({ status: "ready" }).eq("id", scrapeJobId);

      return new Response(
        JSON.stringify({ 
          status: "success", 
          channel: channelToInsert || existingChannel,
          snapshot_id: scrapeJobId,
          count: videos.length,
          comments_count: totalComments
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: "success", 
        channel: channelToInsert || existingChannel 
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Error in trigger_videos-api:", err.message, err.stack);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: err.message || "Unknown error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});