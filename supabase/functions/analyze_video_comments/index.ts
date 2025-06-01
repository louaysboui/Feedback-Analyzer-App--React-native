import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY") || "";

interface Payload {
  videoId: string;
}

async function fetchWithRetry(url: string, options: RequestInit, delay: number = 1000, retries: number = 3): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      const headers = Object.fromEntries(response.headers.entries());
      console.log(`Attempt ${attempt + 1}: Status: ${response.status}, Headers:`, headers);
      const body = await response.text();

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`Rate limit hit, retrying (${attempt + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
          continue;
        }
        console.error(`Fetch failed: Status ${response.status}, Body: ${body}`);
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      return body;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${attempt + 1} failed:`, errorMsg, error instanceof Error ? error.stack : '');
      if (attempt === retries - 1) throw new Error(`Max retries exceeded: ${errorMsg}`);
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchSentiment(text: string): Promise<number> {
  try {
    console.log("Fetching sentiment for text (first 50 chars):", text.substring(0, 50));
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("Hugging Face API key is missing");
    }

    const responseText = await fetchWithRetry(
      "https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = JSON.parse(responseText);
    if (!data || !Array.isArray(data) || !data[0] || !data[0].length) {
      console.warn("Invalid sentiment data for text:", text.substring(0, 50), "Response:", data);
      return 0;
    }

    const scores = data[0];
    const positive = scores.find((s: any) => s.label === "LABEL_2")?.score || 0;
    const negative = scores.find((s: any) => s.label === "LABEL_0")?.score || 0;
    const sentimentScore = positive - negative;
    console.log("Sentiment score:", sentimentScore, { positive, negative });
    return sentimentScore;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Sentiment error:", errorMsg, err instanceof Error ? err.stack : '');
    return 0;
  }
}

async function generateSummary(comments: string[]): Promise<string> {
  const cleanedComments = comments
    .map(c => c.trim().replace(/[^\x20-\x7E]/g, ''))
    .filter(c => c && c.length >= 5 && c.length <= 500)
    .slice(0, 50);

  try {
    console.log("Generating summary for", comments.length, "comments, cleaned:", cleanedComments.length);
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("Hugging Face API key missing");
    }

    if (cleanedComments.length === 0) {
      console.warn("No valid comments for summary");
      return "No valid comments available.";
    }

    let prompt = `Viewer comments:\n${cleanedComments.join("\n")}\n\nGenerate a concise summary (2-3 sentences) capturing the main themes, sentiments, or topics discussed.`;
    if (prompt.length > 4000) {
      console.warn("Prompt too long, truncating to 4000 chars");
      prompt = prompt.substring(0, 4000);
    }

    const responseText = await fetchWithRetry(
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt, parameters: { max_length: 120, min_length: 40 } }),
      }
    );

    console.log("Raw summary response:", responseText);
    const data = JSON.parse(responseText);
    let summary = data[0]?.summary_text || "";
    if (!summary) {
      console.warn("No summary_text in response:", data);
      throw new Error("Empty summary_text");
    }

    summary = summary
      .replace(/^(Viewer comments|Generate a concise summary).*?(\n|$)/gi, '')
      .replace(/^\s*|\s*$/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ');

    console.log("Generated summary:", summary);
    return summary || "Unable to generate a meaningful summary.";
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Summary error:", errorMsg, err instanceof Error ? err.stack : '');
    try {
      const prompt = `summarize: ${cleanedComments.join("\n").substring(0, 2000)}`;
      const responseText = await fetchWithRetry(
        "https://api-inference.huggingface.co/models/t5-small",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt, parameters: { max_length: 120, min_length: 40 } }),
        }
      );

      console.log("Raw t5-small response:", responseText);
      const data = JSON.parse(responseText);
      let summary = data[0]?.generated_text || "";
      if (!summary) {
        console.warn("No generated_text in t5-small response:", data);
        throw new Error("Empty generated_text");
      }

      summary = summary
        .replace(/^summarize:.*?(\n|$)/gi, '')
        .replace(/^(Viewer comments|Generate a concise summary).*?(\n|$)/gi, '')
        .replace(/^\s*|\s*$/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');

      console.log("Fallback t5-small summary:", summary);
      return summary || "Unable to generate a meaningful summary.";
    } catch (fallbackErr) {
      const fallbackErrorMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      console.error("Fallback t5-small error:", fallbackErrorMsg, fallbackErr instanceof Error ? fallbackErr.stack : '');
      return `Summary generation failed. Sentiment analysis shows ${cleanedComments.length > 0 ? 'mixed' : 'no significant'} feedback.`;
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as Payload;
    console.log("Received payload:", payload);
    const { videoId } = payload;

    if (!videoId) {
      console.error("Missing videoId in payload");
      return new Response(
        JSON.stringify({ status: "error", message: "Missing videoId" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data: video, error: videoError } = await supabase
      .from("yt_videos")
      .select("id, youtuber_id")
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      console.error("Video fetch error:", videoError?.message || "No video found");
      return new Response(
        JSON.stringify({ status: "error", message: `Video not found: ${videoError?.message || 'Unknown error'}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: comments, error: commentsError } = await supabase
      .from("yt_comments")
      .select("text")
      .eq("video_id", videoId)
      .eq("youtuber_id", video.youtuber_id) // Ensure comments match youtuber_id
      .limit(100);

    if (commentsError) {
      console.error("Comments fetch error:", commentsError.message, commentsError.details);
      return new Response(
        JSON.stringify({ status: "error", message: `Failed to fetch comments: ${commentsError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Fetched", comments?.length || 0, "comments for video", videoId);

    if (!comments || comments.length === 0) {
      console.warn("No comments found for video", videoId);
      return new Response(
        JSON.stringify({
          status: "success",
          sentiment: null,
          summary: "No comments available.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const commentTexts = comments
      .map((c: any) => c.text)
      .filter((text: string) => text && text.trim() && text.length >= 5);

    console.log("Valid comments after filtering:", commentTexts.length);

    if (commentTexts.length === 0) {
      console.warn("No valid comments after filtering for video", videoId);
      return new Response(
        JSON.stringify({
          status: "success",
          sentiment: null,
          summary: "No valid comments available.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const summary = await generateSummary(commentTexts);

    const sentimentScores = await Promise.all(
      commentTexts.map(async (text: string, index: number) => {
        try {
          const score = await fetchSentiment(text);
          console.log(`Sentiment score for comment ${index + 1}:`, score);
          return score;
        } catch (err) {
          console.error(`Sentiment error for comment ${index + 1}:`, err instanceof Error ? err.message : String(err));
          return 0;
        }
      })
    );

    const validScores = sentimentScores.filter((score: number) => score !== 0);
    console.log("Valid sentiment scores:", validScores);

    let sentimentResult = null;
    if (validScores.length > 0) {
      const totalScore = validScores.reduce((sum: number, score: number) => sum + score, 0);
      const averageScore = totalScore / validScores.length;
      const positiveCount = validScores.filter((score: number) => score > 0).length;
      const negativeCount = validScores.filter((score: number) => score < 0).length;

      sentimentResult = {
        positive_percentage: (positiveCount / validScores.length) * 100,
        negative_percentage: (negativeCount / validScores.length) * 100,
        average_score: averageScore,
      };
      console.log("Sentiment result:", sentimentResult);
    } else {
      console.warn("No valid sentiment scores computed");
    }

    const { error: summaryError } = await supabase
      .from("yt_video_summaries")
      .upsert(
        [
          {
            video_id: videoId,
            summary,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "video_id" }
      );

    if (summaryError) {
      console.error("Summary upsert error:", summaryError.message, summaryError.details);
      return new Response(
        JSON.stringify({ status: "error", message: `Failed to store summary: ${summaryError.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        sentiment: sentimentResult,
        summary,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error in analyze_video_comments:", errorMsg, err.stack || '');
    return new Response(
      JSON.stringify({ status: "error", message: `Server error: ${errorMsg}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});