// supabase/functions/collection_webhook/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ───────────────────────────────────────────────────────────
// Configure these env vars in Supabase settings:
// ───────────────────────────────────────────────────────────
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YT_CHANNELS_DATASET_ID = "gd_lk538t2k2p1k3oos71";
const YT_VIDEOS_DATASET_ID   = "gd_lk56epmy2i5g7lzu0k";

// ───────────────────────────────────────────────────────────
// Typed payloads
// ───────────────────────────────────────────────────────────
interface ChannelItem {
  id: string;
  url: string;
  handle?: string;
  banner_img?: string;
  profile_image?: string;
  name?: string;
  subscribers?: number;
  videos_count?: number;
  created_date?: string;
  views?: number;
  Description?: string;
  Details?: { location?: string };
}

interface VideoItem {
  video_id: string;
  url: string;
  title: string;
  likes?: number;
  views?: number;
  date_posted?: string;
  description?: string;
  num_comments?: number;
  preview_image?: string;
  youtuber_id?: string;
  transcript?: string;
}

// ───────────────────────────────────────────────────────────
// Save channel data and mark job ready
// ───────────────────────────────────────────────────────────
async function saveChannel(
  supabase: SupabaseClient,
  items: ChannelItem[],
  snapshot_id: string
) {
  const rows = items.map(item => ({
    id: item.id,
    updated_at: new Date().toISOString(),
    url: item.url.replace("/about", ""),
    handle: item.handle,
    banner_img: item.banner_img,
    profile_image: item.profile_image,
    name: item.name,
    subscribers: item.subscribers  ?? null,
    videos_count: item.videos_count ?? null,
    created_date: item.created_date ?? null,
    views: item.views ?? null,
    Description: item.Description,
    location: item.Details?.location ?? null,
  }));

  const { error: upsertErr } = await supabase
    .from("yt_channels")
    .upsert(rows);

  if (upsertErr) {
    console.error("Channel upsert error:", upsertErr);
  }

  const { error: jobErr } = await supabase
    .from("scrape_jobs")
    .update({ status: "ready", channel_id: rows[0].id })
    .eq("id", snapshot_id);

  if (jobErr) {
    console.error("Job update error:", jobErr);
  }
}

// ───────────────────────────────────────────────────────────
// Save videos (stub)
// ───────────────────────────────────────────────────────────
async function saveVideos(
  supabase: SupabaseClient,
  items: VideoItem[],
  snapshot_id: string
) {
  // TODO: upsert items into your yt_videos table, then:
  // await supabase.from("scrape_jobs").update({ status: "ready" }).eq("id", snapshot_id);
  console.log("saveVideos not implemented yet:", items.length, "videos");
}

// ───────────────────────────────────────────────────────────
// Webhook entry point
// ───────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // 1) Read snapshot-id header (Deno lowercases all headers)
  const snapshot_id = req.headers.get("snapshot-id");
  if (!snapshot_id) {
    console.error("Missing snapshot-id header");
    // STILL return 200 so Bright Data considers the webhook delivered
    return new Response(null, { status: 200 });
  }

  // 2) Parse body
  let payload: unknown;
  try {
    payload = await req.json();
  } catch (e) {
    console.error("Invalid JSON payload", e);
    return new Response(null, { status: 200 });
  }

  // 3) Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

  // 4) Handle Bright Data parse errors
  if (Array.isArray(payload) && payload[0]?.error_code) {
    console.error("Bright Data parse error:", payload[0].error);
    await supabase
      .from("scrape_jobs")
      .update({ status: "failed" })
      .eq("id", snapshot_id);
    return new Response(null, { status: 200 });
  }

  // 5) Fetch the job to know which dataset to use
  const { data: job, error: jobFetchErr } = await supabase
    .from("scrape_jobs")
    .select("dataset_id")
    .eq("id", snapshot_id)
    .single();

  if (jobFetchErr || !job) {
    console.error("Could not fetch scrape_job", jobFetchErr);
    return new Response(null, { status: 200 });
  }

  // 6) Dispatch based on dataset
  if (job.dataset_id === YT_CHANNELS_DATASET_ID) {
    console.log("Webhook: saving channel data");
    await saveChannel(supabase, payload as ChannelItem[], snapshot_id);
  } else if (job.dataset_id === YT_VIDEOS_DATASET_ID) {
    console.log("Webhook: saving video data");
    await saveVideos(supabase, payload as VideoItem[], snapshot_id);
  } else {
    console.warn("Webhook: unknown dataset_id", job.dataset_id);
  }

  // 7) Always return 200 OK to Bright Data
  return new Response(null, { status: 200 });
});
