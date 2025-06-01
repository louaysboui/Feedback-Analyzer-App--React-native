import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY")!;

Deno.serve(async (req: Request) => {
  try {
    const { channelId, channelHandle } = await req.json();
    if (!channelId || !channelHandle) {
      return new Response(JSON.stringify({ status: "error", message: "Missing channelId or channelHandle" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // ─── Step 1: Fetch uploads playlist ─────────────────────────────
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const uploadsPlaylistId =
      channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ status: "error", message: "Uploads playlist not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Step 2: Fetch channel metadata ─────────────────────────────
    const metaRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const metaData = await metaRes.json();
    const snippet = metaData?.items?.[0]?.snippet;

    const channelObject = {
      id: channelId,
      handle: `@${channelHandle}`,
      name: snippet?.title || null,
      Description: snippet?.description || null,
      avatar: snippet?.thumbnails?.high?.url || snippet?.thumbnails?.default?.url || null,
      created_at: new Date().toISOString(),
    };

    // ─── Step 3: Insert or update channel in yt_channels ────────────
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

    // ─── Step 4: Fetch latest 20 videos ─────────────────────────────
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${YOUTUBE_API_KEY}`
    );
    const videosData = await videosRes.json();

    const videoItems = videosData.items.map((item: any) => {
      const { title, publishedAt, thumbnails, resourceId, Description } = item.snippet;
      return {
        id: resourceId.videoId,
        url: `https://www.youtube.com/watch?v=${resourceId.videoId}`,
        channel_id: channelId,
        channel_handle: `@${channelHandle}`,
        title,
        Description,
        published_at: publishedAt,
        thumbnail: thumbnails?.high?.url || thumbnails?.default?.url,
        created_at: new Date().toISOString(),
      };
    });

    // ─── Step 5: Insert videos into yt_videos ───────────────────────
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