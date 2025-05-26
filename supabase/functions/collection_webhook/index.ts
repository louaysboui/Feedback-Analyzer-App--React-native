import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YOUTUBE_API_KEY = "AIzaSyB5UjPUmWN-k8kjE49gXtRcwVR1IlTM98s";

Deno.serve(async (req: Request) => {
  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract channel handle from URL
    const channelHandleMatch = url.match(/youtube\.com\/(@[a-zA-Z0-9_-]+)/);
    const channelHandle = channelHandleMatch ? channelHandleMatch[1] : null;
    if (!channelHandle) {
      throw new Error("Could not extract channel handle from URL");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 1. Search for channel by handle
    const { data: existingChannel } = await supabase
      .from("yt_channels")
      .select("*")
      .eq("handle", channelHandle)
      .maybeSingle();

    if (existingChannel) {
      return new Response(
        JSON.stringify({ 
          status: "success", 
          channel: existingChannel,
          message: "Channel already exists" 
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch channel data from YouTube API
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&key=${YOUTUBE_API_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.items || searchData.items.length === 0) {
      throw new Error("Channel not found via YouTube API");
    }

    const channelId = searchData.items[0].id.channelId;
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`
    );
    const channelData = await channelRes.json();
    const channelInfo = channelData.items[0];

    // Log banner image URL for debugging
    console.log('Banner image URL:', channelInfo.brandingSettings?.image?.bannerExternalUrl);

    // 3. Prepare channel data for insertion
    const channelToInsert = {
      id: channelId,
      handle: channelHandle,
      name: channelInfo.snippet.title,
      description: channelInfo.snippet.description || null,
      profile_image: channelInfo.snippet.thumbnails.high.url || null,
      banner_img: channelInfo.brandingSettings?.image?.bannerExternalUrl || null,
      subscribers: parseInt(channelInfo.statistics.subscriberCount || "0"),
      videos_count: parseInt(channelInfo.statistics.videoCount || "0"),
      views: parseInt(channelInfo.statistics.viewCount || "0"),
      created_date: channelInfo.snippet.publishedAt || null,
      location: channelInfo.snippet.country || null,
      url: url,
    };

    // 4. Insert channel data
    const { error: insertError } = await supabase
      .from("yt_channels")
      .upsert([channelToInsert]);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        status: "success", 
        channel: channelToInsert 
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("Error in collection_webhook:", err);
    return new Response(
      JSON.stringify({ 
        status: "error", 
        message: err.message || "Unknown error" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});