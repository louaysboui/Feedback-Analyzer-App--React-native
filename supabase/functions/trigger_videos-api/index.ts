import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = "AIzaSyB5UjPUmWN-k8kjE49gXtRcwVR1IlTM98s";

Deno.serve(async (req: Request) => {
  try {
    const { channelId, channelHandle, url } = await req.json();
    if (!channelId || !channelHandle) {
      return new Response(JSON.stringify({ status: "error", message: "Missing channelId or channelHandle" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Step 1: Fetch uploads playlist and branding settings
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const uploadsPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ status: "error", message: "Uploads playlist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 2: Fetch channel metadata
    const metaRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const metaData = await metaRes.json();
    const snippet = metaData?.items?.[0]?.snippet;

    // Log banner image URL for debugging
    console.log('Banner image URL:', metaData?.items?.[0]?.brandingSettings?.image?.bannerExternalUrl);

    const channelObject = {
      id: channelId,
      handle: `@${channelHandle}`,
      name: snippet?.title || null,
      description: snippet?.description || null,
      profile_image: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || null,
      banner_img: metaData?.items?.[0]?.brandingSettings?.image?.bannerExternalUrl || null,
      created_date: snippet?.publishedAt || null,
      url: url,
      location: snippet?.country || null,
      subscribers: parseInt(metaData?.items?.[0]?.statistics?.subscriberCount || "0"),
      videos_count: parseInt(metaData?.items?.[0]?.statistics?.videoCount || "0"),
      views: parseInt(metaData?.items?.[0]?.statistics?.viewCount || "0"),
    };

    // Step 3: Insert or update channel in yt_channels
    const { error: chInsertErr } = await supabase
      .from("yt_channels")
      .upsert([channelObject], { onConflict: "id" });

    if (chInsertErr) {
      console.error("Channel insert error:", chInsertErr);
      return new Response(JSON.stringify({ status: "error", message: chInsertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 4: Fetch latest 20 videos
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    // Step 5: Fetch video statistics
    const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(",");
    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    );
    const statsData = await statsRes.json();

    const videoItems = videosData.items.map((item: any, index: number) => {
      const { title, publishedAt, thumbnails, resourceId, description } = item.snippet;
      const stats = statsData.items.find((stat: any) => stat.id === resourceId.videoId)?.statistics || {};
      return {
        id: resourceId.videoId,
        url: `https://www.youtube.com/watch?v=${resourceId.videoId}`,
        youtuber_id: channelId,
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

    // Step 6: Insert videos into yt_videos
    const { error: videoInsertErr } = await supabase
      .from("yt_videos")
      .upsert(videoItems, { onConflict: "id" });

    if (videoInsertErr) {
      console.error("Insert error:", videoInsertErr);
      return new Response(JSON.stringify({ status: "error", message: videoInsertErr.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ status: "success", count: videoItems.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ status: "error", message: err.message || String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});