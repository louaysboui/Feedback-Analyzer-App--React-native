import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

const HUGGING_FACE_API_URL =
  "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment";
const HF_API_TOKEN = Deno.env.get("HUGGINGFACE_API_TOKEN")!;

serve(async (req: Request) => {
  try {
    const { channel_id } = await req.json();

    if (!channel_id) {
      return new Response(JSON.stringify({ error: "Missing channel_id" }), { status: 400 });
    }

    const { data: comments, error } = await supabase
      .from("yt_comments")
      .select("id, text")
      .eq("youtuber_id", channel_id)
      .limit(1000);

    if (error) {
      console.error("❌ Supabase fetch error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch comments" }), { status: 500 });
    }

    if (!comments || comments.length === 0) {
      console.warn("⚠️ No comments found for this channel_id");
      return new Response(JSON.stringify({ error: "No comments found" }), { status: 404 });
    }

    for (const comment of comments) {
      try {
        const hfResponse = await fetch(HUGGING_FACE_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: comment.text }),
        });

        if (!hfResponse.ok) {
          const errorText = await hfResponse.text();
          console.error("🧠 Hugging Face API error:", errorText);
          continue; // Skip this comment
        }

        const result = await hfResponse.json();
        if (!Array.isArray(result) || !result[0]) {
          console.error("Invalid HF result format:", result);
          continue;
        }

        const top = result[0][0];
        console.log(`✅ Analyzed comment ${comment.id} ->`, top);

        await supabase
          .from("yt_comments")
          .update({
            sentiment_label: top.label,
            sentiment_score: top.score,
            updated_at: new Date().toISOString(),
          })
          .eq("id", comment.id);
      } catch (apiError) {
        console.error("🔥 Error analyzing single comment:", apiError);
      }
    }

    return new Response(JSON.stringify({ message: "Sentiment analysis complete" }), { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("🔥 Function crashed:", errorMessage);
    return new Response(JSON.stringify({ error: "Function crashed", detail: errorMessage }), {
      status: 500,
    });
  }
});
