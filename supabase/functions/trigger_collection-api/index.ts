import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const BRIGHT_DATA_API_KEY = Deno.env.get("BRIGHT_DATA_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const YT_CHANNELS_DATASET_ID = "gd_lk538t2k2p1k3oos71";

Deno.serve(async (req: Request) => {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ status: "error", message: "Missing or invalid `url` in body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract channel handle for later use (e.g., @cristiano)
    const channelHandleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    const channelHandle = channelHandleMatch ? channelHandleMatch[1] : null;
    if (!channelHandle) {
      return new Response(
        JSON.stringify({ status: "error", message: "Invalid YouTube channel URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const webhookEndpoint = `${SUPABASE_URL}/functions/v1/collection_webhook`;
    const triggerUrl = [
      "https://api.brightdata.com/datasets/v3/trigger",
      `dataset_id=${YT_CHANNELS_DATASET_ID}`,
      `endpoint=${encodeURIComponent(webhookEndpoint)}`,
      "format=json",
      "uncompressed_webhook=true",
      "include_errors=true",
    ].join("&").replace("datasets/v3/trigger&", "datasets/v3/trigger?");

    const brightRes = await fetch(triggerUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${BRIGHT_DATA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ url }]),
    });
    const brightData = await brightRes.json();

    if (!brightRes.ok) {
      const msg = brightData.error || brightData.message || brightRes.statusText;
      return new Response(
        JSON.stringify({ status: "error", message: `Bright Data error: ${msg}` }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const snapshot_id: string = brightData.snapshot_id;
    if (!snapshot_id) {
      return new Response(
        JSON.stringify({ status: "error", message: "No snapshot_id in Bright Data response" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { error: dbErr } = await supabase
      .from("scrape_jobs")
      .insert({
        id: snapshot_id,
        status: "running",
        dataset_id: YT_CHANNELS_DATASET_ID,
      });
    if (dbErr) {
      console.error("DB insert error:", dbErr);
      return new Response(
        JSON.stringify({ status: "error", message: dbErr.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ snapshot_id, channelHandle }), // Return channelHandle for app to use
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ status: "error", message: err.message || String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});