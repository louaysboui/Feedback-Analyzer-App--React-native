import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;

interface RequestPayload {
  channelId?: string;
  channelHandle: string;
  url: string;
}

async function fetchWithRetry(url: string, retries = 3, delay = 1000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok && res.status === 429) {
        console.warn(`Rate limit hit, retrying (${i + 1}/${retries})...`);
        await new Promise(r => setTimeout(r, delay * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Fetch error, retrying (${i + 1}/${retries}):`, err);
      await new Promise(r => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

async function generateUUID(supabase: any): Promise<string> {
  try {
    console.log("Attempting to call public.uuid_generate_v4");
    const { data, error } = await supabase.rpc('uuid_generate_v4');
    if (error) {
      console.error("UUID generation error:", error);
      throw new Error(`Failed to generate UUID: ${error.message}`);
    }
    if (!data) {
      console.error("UUID generation returned no data");
      throw new Error("Failed to generate UUID: No data returned");
    }
    console.log("Generated UUID:", data);
    return data;
  } catch (err) {
    const errMsg = (err instanceof Error && err.message) ? err.message : String(err);
    console.warn("Falling back to crypto UUID due to error:", errMsg);
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    console.log("Generated fallback UUID:", uuid);
    return uuid;
  }
}

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json() as RequestPayload;
    console.log("Received payload:", payload);
    const { channelId, channelHandle, url } = payload;

    if (!channelHandle || !url) {
      console.error("Missing required fields", { channelId, channelHandle, url });
      return new Response(JSON.stringify({ status: "error", message: "Missing channelHandle or url" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let validatedChannelId = channelId;

    if (!validatedChannelId) {
      console.log("Fetching channel ID from YouTube API for handle:", channelHandle);
      const youtubeResponse = await fetchWithRetry(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${channelHandle}&key=${YOUTUBE_API_KEY}`
      );
      const youtubeData = await youtubeResponse.json();
      if (!youtubeData.items?.length) {
        console.error("YouTube API: Channel not found", { channelHandle });
        throw new Error(`Channel not found on YouTube: ${channelHandle}`);
      }
      validatedChannelId = youtubeData.items[0].id;
      console.log("Fetched YouTube channel ID:", validatedChannelId);
    }

    if (
      !validatedChannelId ||
      !validatedChannelId.startsWith('UC') ||
      validatedChannelId.length < 20
    ) {
      console.error("Invalid channelId format:", validatedChannelId);
      return new Response(JSON.stringify({ status: "error", message: "Invalid channelId format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check for existing channel
    const { data: existingChannel, error: fetchError } = await supabase
      .from("yt_channels")
      .select("id")
      .eq("youtube_channel_id", validatedChannelId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching existing channel:", fetchError);
      throw fetchError;
    }

    if (existingChannel) {
      // Delete related scrape_jobs to avoid foreign key issues
      const { error: deleteError } = await supabase
        .from("scrape_jobs")
        .delete()
        .eq("channel_id", existingChannel.id);

      if (deleteError) {
        console.error("Error deleting scrape_jobs:", deleteError);
        throw deleteError;
      }
      console.log("Deleted existing scrape_jobs for channel:", existingChannel.id);
    }

    // Get upload playlist ID
    const channelRes = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,brandingSettings&id=${validatedChannelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    if (!channelData.items?.length) {
      console.error("YouTube API: Channel not found", { channelId: validatedChannelId });
      throw new Error(`Channel not found on YouTube: ${validatedChannelId}`);
    }
    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    if (!uploadsPlaylistId) {
      console.error("YouTube API: Uploads playlist not found", { channelId: validatedChannelId });
      return new Response(JSON.stringify({ status: "error", message: "Uploads playlist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get metadata
    const metaRes = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${validatedChannelId}&key=${YOUTUBE_API_KEY}`
    );
    const metaData = await metaRes.json();
    const snippet = metaData.items[0].snippet;

    // Generate UUID for new channel
    const channelIdUUID = existingChannel ? existingChannel.id : await generateUUID(supabase);

    const channelObject = {
      id: channelIdUUID,
      youtube_channel_id: validatedChannelId,
      handle: `@${channelHandle}`,
      name: snippet.title || '',
      description: snippet.description || null,
      profile_image: snippet.thumbnails?.default?.url || null,
      banner_img: metaData.items[0].brandingSettings?.image?.bannerExternalUrl || null,
      created_date: snippet.publishedAt || null,
      url,
      location: snippet.country || null,
      subscribers: parseInt(metaData.items[0].statistics.subscriberCount || "0"),
      videos_count: parseInt(metaData.items[0].statistics.videoCount || "0"),
      views: parseInt(metaData.items[0].statistics.viewCount || "0"),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Inserting/updating channel:", channelObject);

    // Insert/update channel
    const { error: chInsertErr } = await supabase
      .from("yt_channels")
      .upsert([channelObject], { onConflict: "youtube_channel_id", ignoreDuplicates: false });

    if (chInsertErr) {
      console.error("Channel insert error:", chInsertErr.message);
      throw chInsertErr;
    }

    // Get latest 20 videos
    const videosRes = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId?.videoId).join(",");

    const statsRes = await fetchWithRetry(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    const statsData = await statsRes.json();

    const videoItems = videosData.items.map((item: any) => {
      const videoId = item.snippet.resourceId.videoId;
      const stats = statsData.items.find((stat: any) => stat.id === videoId)?.statistics || {};
      const { title, publishedAt, thumbnails, description } = item.snippet;

      return {
        id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        youtuber_id: channelObject.id,
        title,
        description: description || null,
        date_posted: publishedAt || null,
        preview_image: thumbnails?.high?.url || thumbnails?.default?.url || null,
        views: parseInt(stats.viewCount || "0"),
        likes: parseInt(stats.likeCount || "0"),
        num_comments: parseInt(stats.commentCount || "0"),
        created_at: new Date().toISOString(),
      };
    });

    console.log("Inserting videos:", videoItems.length);

    // Insert videos
    const { error: videoInsertErr } = await supabase
      .from("yt_videos")
      .upsert(videoItems, { onConflict: "id" });

    if (videoInsertErr) {
      console.error("Video insert error:", videoInsertErr.message);
      throw videoInsertErr;
    }

    // Fetch comments for each video
    let commentCount = 0;
    for (const video of videoItems) {
      try {
        const commentRes = await fetchWithRetry(
          `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${video.id}&maxResults=50&textFormat=plainText&key=${YOUTUBE_API_KEY}`
        );
        const commentData = await commentRes.json();

        if (!commentData.items?.length) {
          console.log(`No comments for video ${video.id}`);
          continue;
        }

        const commentItems = commentData.items.map((c: any) => {
          const snippet = c.snippet.topLevelComment.snippet;
          return {
            id: c.id,
            video_id: video.id,
            youtuber_id: channelObject.id,
            text: snippet.textDisplay,
            created_at: new Date(snippet.publishedAt).toISOString(),
            updated_at: new Date(snippet.updatedAt || snippet.publishedAt).toISOString(),
          };
        });

        const { error: commentInsertErr } = await supabase
          .from("yt_comments")
          .upsert(commentItems, { onConflict: "id" });

        if (commentInsertErr) {
          console.error(`Comment insert error for video ${video.id}:`, commentInsertErr.message);
          continue;
        }

        commentCount += commentItems.length;
        console.log(`Inserted ${commentItems.length} comments for video ${video.id}`);
      } catch (err) {
        console.error(`Error fetching comments for video ${video.id}:`, err);
      }
    }

    // Create scrape job
    const { data: jobData, error: jobError } = await supabase
      .from("scrape_jobs")
      .insert([{ status: commentCount > 0 ? "ready" : "no_comments", channel_id: channelObject.id }])
      .select("id")
      .single();

    if (jobError) {
      console.error("Scrape job insert error:", jobError.message);
      throw jobError;
    }

    return new Response(JSON.stringify({
      status: "success",
      count: videoItems.length,
      comment_count: commentCount,
      snapshot_id: jobData.id,
      channel: channelObject,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error in trigger_videos-api:", {
      message: err.message,
      stack: err.stack,
      payload: await req.json().catch(() => ({})),
    });
    return new Response(JSON.stringify({ status: "error", message: err.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});