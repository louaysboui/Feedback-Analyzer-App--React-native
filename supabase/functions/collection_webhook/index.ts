// supabase/functions/collection_webhook/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const YT_VIDEOS_DATASET_ID  = "gd_lk56epmy2i5g7lzu0k";

interface VideoItemRaw {
  video_id?: string;
  id?: string;
  youtuber_id?: string;
  // alternate fields:
  video_url?: string;
  url?: string;
  title?: string;
  views?: number;
  likes?: number;
  date_posted?: string;
  posted_time?: string;
  description?: string;
  num_comments?: number;
  comment_count?: number;
  preview_image?: string;
  Image_url?: string;
  transcript?: string;
}

async function saveVideos(
  supabase: SupabaseClient,
  items: VideoItemRaw[],
  snapshot_id: string
) {
  // Normalize & filter out any items lacking an ID or channel ID
  const rows = items
    .map((v) => {
      const vid = v.video_id ?? v.id;
      const yid = v.youtuber_id;
      if (!vid || !yid) return null;

      return {
        id:            vid.toString(),
        youtuber_id:   yid.toString(),
        url:           v.url ?? v.video_url ?? "",
        title:         v.title ?? "",
        views:         v.views ?? null,
        likes:         v.likes ?? null,
        date_posted:   v.date_posted ?? v.posted_time ?? null,
        description:   v.description ?? "",
        num_comments:  v.num_comments ?? v.comment_count ?? null,
        preview_image: v.preview_image ?? v.Image_url ?? null,
        transcript:    v.transcript ?? null,
      };
    })
    .filter((r): r is {
      id: string;
      youtuber_id: string;
      url: string;
      title: string;
      views: number | null;
      likes: number | null;
      date_posted: string | null;
      description: string;
      num_comments: number | null;
      preview_image: string | null;
      transcript: string | null;
    } => r !== null);

  if (rows.length) {
    const { error: upsertErr } = await supabase
      .from("yt_videos")
      .upsert(rows);
    if (upsertErr) console.error("Video upsert error:", upsertErr);
  } else {
    console.warn("saveVideos: no valid rows to upsert");
  }

  // Mark the scrape job as ready (even if rows was empty)
  const { error: jobErr } = await supabase
    .from("scrape_jobs")
    .update({ status: "ready" })
    .eq("id", snapshot_id);

  if (jobErr) console.error("Job update error:", jobErr);
}

// … rest of your collection_webhook dispatch logic unchanged …
