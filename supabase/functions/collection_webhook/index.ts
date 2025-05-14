import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
  throw new Error("Missing required environment variables");
}

interface ChannelItemRaw {
  id?: string;
  identifier?: string;
  url?: string;
  handle?: string;
  banner_img?: string;
  profile_image?: string;
  name?: string;
  subscribers?: number;
  Description?: string;
  videos_count?: number;
  created_date?: string;
  views?: number;
  Details?: { location?: string };
}

interface VideoItemRaw {
  video_id?: string;
  youtuber_id?: string;
  url?: string;
  title?: string;
  views?: number;
  likes?: number;
  date_posted?: string;
  num_comments?: number;
  preview_image?: string;
  transcript?: string;
}

async function getSnapshotIdFromScrapeJobs(supabase: SupabaseClient, identifier: string, dataset_id?: string): Promise<string | null> {
  console.log(`Attempting to retrieve snapshot_id for identifier ${identifier} from scrape_jobs`);
  let query = supabase
    .from("scrape_jobs")
    .select("id, dataset_id")
    .eq("status", "running")
    .order("created_at", { ascending: false })
    .limit(1);

  if (dataset_id) {
    query = query.eq("dataset_id", dataset_id);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error retrieving snapshot_id from scrape_jobs:", error.message, error.details);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn("No running scrape_jobs found");
    return null;
  }

  const snapshot_id = data[0].id;
  console.log(`Found snapshot_id ${snapshot_id} in scrape_jobs with dataset_id ${data[0].dataset_id}`);
  return snapshot_id;
}

async function saveChannels(supabase: SupabaseClient, channels: ChannelItemRaw[], snapshot_id?: string) {
  console.log(`Processing ${channels.length} channel items${snapshot_id ? ` for snapshot ${snapshot_id}` : ""}`);
  if (!channels || !Array.isArray(channels)) {
    console.error("Invalid channels: expected an array", channels);
    return false;
  }

  const rows = channels
    .map((c, index) => {
      const cid = c.id ?? c.identifier ?? (c.handle ? c.handle.replace('@', '') : null);
      if (!cid) {
        console.warn(`Skipping channel at index ${index}: missing id, identifier, or handle`, c);
        return null;
      }

      return {
        id: cid.toString(),
        url: c.url ?? "",
        handle: c.handle ?? "",
        banner_img: c.banner_img ?? null,
        profile_image: c.profile_image ?? null,
        name: c.name ?? "",
        subscribers: c.subscribers ?? null,
        videos_count: c.videos_count ?? null,
        created_date: c.created_date ? new Date(c.created_date).toISOString().split("T")[0] : null,
        views: c.views ?? null,
        Description: c.Description ?? null,
        location: c.Details?.location ?? null,
        updated_at: new Date().toISOString(),
      };
    })
    .filter((r): r is {
      id: string;
      url: string;
      handle: string;
      banner_img: string | null;
      profile_image: string | null;
      name: string;
      subscribers: number | null;
      videos_count: number | null;
      created_date: string | null;
      views: number | null;
      Description: string | null;
      location: string | null;
      updated_at: string;
    } => r !== null);

  if (rows.length) {
    console.log(`Upserting ${rows.length} valid channel rows to yt_channels`);
    const { error: upsertErr, data } = await supabase
      .from("yt_channels")
      .upsert(rows, { onConflict: "id" })
      .select();
    if (upsertErr) {
      console.error("Channel upsert error:", upsertErr.message, upsertErr.details);
      return false;
    }
    console.log("Upsert successful, inserted/updated channels:", data);

    if (snapshot_id && rows[0]?.id) {
      console.log(`Updating scrape_jobs ${snapshot_id} with channel_id ${rows[0].id}`);
      const { error: jobUpdateErr } = await supabase
        .from("scrape_jobs")
        .update({ channel_id: rows[0].id, status: "ready" })
        .eq("id", snapshot_id);
      if (jobUpdateErr) {
        console.error("Job update error:", jobUpdateErr.message, jobUpdateErr.details);
        return false;
      }
      console.log("Scrape job updated with channel_id");
    } else {
      console.warn("No snapshot_id or channel_id to update scrape_jobs");
    }
  } else {
    console.warn("No valid channel rows to upsert after filtering");
    if (snapshot_id) {
      console.log(`Marking scrape job ${snapshot_id} as failed`);
      await supabase
        .from("scrape_jobs")
        .update({ status: "failed" })
        .eq("id", snapshot_id);
    }
    return false;
  }

  return true;
}

async function saveVideos(supabase: SupabaseClient, videos: VideoItemRaw[], snapshot_id?: string) {
  console.log(`Processing ${videos.length} video items${snapshot_id ? ` for snapshot ${snapshot_id}` : ""}`);
  if (!videos || !Array.isArray(videos)) {
    console.error("Invalid videos: expected an array", videos);
    return false;
  }

  const rows = videos
    .map((v, index) => {
      const vid = v.video_id;
      if (!vid) {
        console.warn(`Skipping video at index ${index}: missing video_id`, v);
        return null;
      }
      if (!v.youtuber_id) {
        console.warn(`Skipping video at index ${index}: missing youtuber_id`, v);
        return null;
      }

      return {
        id: vid.toString(),
        youtuber_id: v.youtuber_id.toString(),
        url: v.url ?? "",
        title: v.title ?? "",
        views: v.views ?? null,
        likes: v.likes ?? null,
        date_posted: v.date_posted ? new Date(v.date_posted).toISOString() : null,
        description: v.transcript ?? null,
        num_comments: v.num_comments ?? null,
        preview_image: v.preview_image ?? null,
        transcript: v.transcript ?? null,
        updated_at: new Date().toISOString(),
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
      description: string | null;
      num_comments: number | null;
      preview_image: string | null;
      transcript: string | null;
      updated_at: string;
    } => r !== null);

  if (rows.length) {
    console.log(`Upserting ${rows.length} valid video rows to yt_videos`);
    const { error: upsertErr, data } = await supabase
      .from("yt_videos")
      .upsert(rows, { onConflict: "id" })
      .select();
    if (upsertErr) {
      console.error("Video upsert error:", upsertErr.message, upsertErr.details);
      return false;
    }
    console.log("Upsert successful, inserted/updated videos:", data);
  } else {
    console.warn("No valid video rows to upsert after filtering");
    if (snapshot_id) {
      console.log(`Marking scrape job ${snapshot_id} as failed`);
      await supabase
        .from("scrape_jobs")
        .update({ status: "failed" })
        .eq("id", snapshot_id);
    }
    return false;
  }

  if (snapshot_id) {
    console.log(`Updating scrape job ${snapshot_id} to status 'ready'`);
    const { error: jobErr, data: jobData } = await supabase
      .from("scrape_jobs")
      .update({ status: "ready" })
      .eq("id", snapshot_id)
      .select();
    if (jobErr) {
      console.error("Job update error:", jobErr.message, jobErr.details);
      return false;
    }
    console.log("Scrape job updated:", jobData);
  } else {
    console.warn("No snapshot_id provided; skipping scrape_jobs update");
  }

  return true;
}

Deno.serve(async (req: Request) => {
  try {
    console.log("Webhook invoked at", new Date().toISOString());
    console.log("SUPABASE_URL:", SUPABASE_URL);
    console.log("SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE ? "[REDACTED]" : "NOT SET");

    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log("Request headers:", JSON.stringify(headers, null, 2));

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    const payload = await req.json();
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2));

    let channels: ChannelItemRaw[] = [];
    let videos: VideoItemRaw[] = [];
    let snapshot_id: string | undefined;

    if (Array.isArray(payload)) {
      const firstItem = payload[0];
      if (firstItem && "video_id" in firstItem) {
        videos = payload as VideoItemRaw[];
      } else {
        channels = payload as ChannelItemRaw[];
      }
      snapshot_id =
        req.headers.get("x-snapshot-id") ||
        req.headers.get("X-Snapshot-Id") ||
        req.headers.get("snapshot-id") ||
        req.headers.get("Snapshot-Id") ||
        req.headers.get("brightdata-snapshot-id") ||
        undefined;
    } else if (payload.items && Array.isArray(payload.items)) {
      const firstItem = payload.items[0];
      if (firstItem && "video_id" in firstItem) {
        videos = payload.items as VideoItemRaw[];
      } else {
        channels = payload.items as ChannelItemRaw[];
      }
      snapshot_id = payload.snapshot_id || payload.snapshotId || payload.SnapshotId || undefined;
    } else if (payload.data && Array.isArray(payload.data)) {
      const firstItem = payload.data[0];
      if (firstItem && "video_id" in firstItem) {
        videos = payload.data as VideoItemRaw[];
      } else {
        channels = payload.data as ChannelItemRaw[];
      }
      snapshot_id = payload.snapshot_id || payload.snapshotId || payload.SnapshotId || undefined;
    } else {
      console.error("Invalid payload structure: expected array, or object with items or data", payload);
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid payload structure" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!snapshot_id) {
      let identifier: string | undefined;
      let dataset_id: string | undefined;

      if (channels.length > 0) {
        identifier = channels[0].id ?? channels[0].identifier;
        dataset_id = "gd_lk538t2k2p1k3oos71";
      } else if (videos.length > 0) {
        identifier = videos[0].video_id;
        dataset_id = "gd_lk56epmy2i5g7lzu0k";
      }

      if (identifier) {
        snapshot_id = (await getSnapshotIdFromScrapeJobs(supabase, identifier, dataset_id)) ?? undefined;
      }
    }

    if (!snapshot_id) {
      console.warn("Snapshot ID missing in payload or headers, and could not retrieve from scrape_jobs; proceeding without updating scrape_jobs");
    }

    let success: boolean;
    if (channels.length > 0) {
      success = await saveChannels(supabase, channels, snapshot_id);
    } else if (videos.length > 0) {
      success = await saveVideos(supabase, videos, snapshot_id);
    } else {
      console.error("No valid channels or videos to process");
      return new Response(
        JSON.stringify({ status: "error", message: "No valid data to process" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!success) {
      console.error("Failed to process data", snapshot_id ? `for snapshot ${snapshot_id}` : "");
      return new Response(
        JSON.stringify({ status: "error", message: "Failed to process data" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully processed data", snapshot_id ? `for snapshot ${snapshot_id}` : "");
    return new Response(
      JSON.stringify({ status: "success", snapshot_id: snapshot_id || "unknown" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Webhook error:", err.message || String(err), err.stack);
    return new Response(
      JSON.stringify({ status: "error", message: err.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});