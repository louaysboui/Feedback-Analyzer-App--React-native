// supabase/functions/trigger_videos-api/index.ts

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const BRIGHT_DATA_API_KEY    = Deno.env.get("BRIGHT_DATA_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY      = Deno.env.get("SUPABASE_ANON_KEY")!;
const YT_VIDEOS_DATASET_ID   = "gd_lk56epmy2i5g7lzu0k";

Deno.serve(async (req: Request) => {
  try {
    const { url } = await req.json();
    if (!url) throw new Error("Missing `url` in request body");

    // Build trigger URL with discover_new + discover_by=url
    const webhook = encodeURIComponent(
      `${SUPABASE_URL}/functions/v1/collection_webhook`
    );
    const triggerUrl =
      `https://api.brightdata.com/datasets/v3/trigger?` +
      `dataset_id=${YT_VIDEOS_DATASET_ID}` +
      `&include_errors=true` +
      `&type=discover_new` +
      `&discover_by=url` +
      `&endpoint=${webhook}` +
      `&format=json` +
      `&uncompressed_webhook=true`;

    // Fire the trigger
    const bdRes = await fetch(triggerUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BRIGHT_DATA_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify([{ url }]),
    });
    const bdJson = await bdRes.json();

    if (!bdRes.ok) {
      throw new Error(bdJson.error || JSON.stringify(bdJson));
    }
    const snapshot_id = bdJson.snapshot_id as string;

    // Insert into scrape_jobs
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: dbErr } = await sb
      .from("scrape_jobs")
      .insert({
        id: snapshot_id,
        status: "running",
        dataset_id: YT_VIDEOS_DATASET_ID,
      });
    if (dbErr) throw dbErr;

    return new Response(JSON.stringify({ snapshot_id }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("trigger_videos-api error:", e);
    return new Response(
      JSON.stringify({ status: "error", message: e.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});
