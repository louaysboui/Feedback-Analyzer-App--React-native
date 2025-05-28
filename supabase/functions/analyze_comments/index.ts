import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY") || "";

interface Payload {
  channelId: string;
  channelHandle: string;
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

      if (!response.ok && response.status === 429) {
        console.warn(`Rate limit hit, retrying (${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        console.error(`Fetch failed: Status ${response.status}, Body: ${body}`);
        throw new Error(`HTTP ${response.status}: ${body}`);
      }

      return body;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Attempt ${attempt + 1} failed:`, error.message, error.stack);
      } else {
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }
      if (attempt === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

async function fetchSentiment(text: string): Promise<number> {
  try {
    console.log("Fetching sentiment for text (first 50 chars):", text.substring(0, 50));
    console.log("Hugging Face API key present:", !!HUGGINGFACE_API_KEY, "Length:", HUGGINGFACE_API_KEY.length);
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

    console.log("Sentiment API response:", responseText);

    const data = JSON.parse(responseText);
    if (!data || !data[0] || !data[0].length) {
      console.warn("No sentiment data for text:", text.substring(0, 50));
      return 0;
    }

    const scores = data[0];
    const positive = scores.find((s: any) => s.label === "LABEL_2")?.score || 0;
    const negative = scores.find((s: any) => s.label === "LABEL_0")?.score || 0;
    const neutral = scores.find((s: any) => s.label === "LABEL_1")?.score || 0;

    const sentimentScore = positive - negative;
    console.log("Sentiment score:", sentimentScore, { positive, negative, neutral });
    return sentimentScore;
  } catch (err) {
    if (err instanceof Error) {
      console.error("Sentiment error:", err.message, err.stack);
    } else {
      console.error("Sentiment error:", String(err));
    }
    return 0;
  }
}

async function generateSummary(comments: string[]): Promise<string> {
  const cleanedComments = comments
    .map(c => c.trim().replace(/[^\x20-\x7E]/g, ''))
    .filter(c => c && c.length >= 5 && c.length <= 500)
    .slice(0, 50);

  try {
    console.log("Generating summary for", comments.length, "comments");
    console.log("First 3 comments (50 chars):", comments.slice(0, 3).map(c => c.substring(0, 50)));
    console.log("Hugging Face API key present:", !!HUGGINGFACE_API_KEY, "Length:", HUGGINGFACE_API_KEY.length);
    if (!HUGGINGFACE_API_KEY) {
      throw new Error("Hugging Face API key missing");
    }

    if (comments.length === 0) {
      console.warn("No comments for summary");
      return "No comments available.";
    }

    const totalLength = cleanedComments.join("\n").length;
    console.log("Input length:", totalLength, "Cleaned count:", cleanedComments.length);
    console.log("Prompt preview (50 chars):", cleanedComments.join("\n").substring(0, 50));

    if (cleanedComments.length === 0) {
      console.warn("No valid comments");
      return "No valid comments available.";
    }

    let prompt = `Below are viewer comments from a YouTube channel. Generate a concise summary (2-3 sentences) capturing the main themes, sentiments, or topics discussed. Focus on key ideas and avoid repeating the prompt or including unrelated text:\n\n${cleanedComments.join("\n")}`;

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
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e instanceof Error ? e.message : String(e), "Response:", responseText);
      throw new Error("Invalid API response format");
    }

    let summary = data[0]?.summary_text || "";
    if (!summary) {
      console.warn("No summary_text in response:", data);
      throw new Error("Empty summary_text");
    }

    summary = summary
      .replace(/^(Below are viewer comments|Generate a concise summary).*?(\n|$)/gi, '')
      .replace(/^\s*|\s*$/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ');

    console.log("Generated summary:", summary);
    return summary || "Unable to generate a meaningful summary.";
  } catch (err) {
    if (err instanceof Error) {
      console.error("Summary error:", err.message, err.stack);
    } else {
      console.error("Summary error:", String(err));
    }
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
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("t5-small JSON parse error:", e instanceof Error ? e.message : String(e), "Response:", responseText);
        throw new Error("Invalid t5-small response format");
      }

      let summary = data[0]?.generated_text || "";
      if (!summary) {
        console.warn("No generated_text in t5-small response:", data);
        throw new Error("Empty generated_text");
      }

      summary = summary
        .replace(/^summarize:.*?(\n|$)/gi, '')
        .replace(/^(Below are viewer comments|Generate a concise summary).*?(\n|$)/gi, '')
        .replace(/^\s*|\s*$/g, '')
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ');

      console.log("Fallback t5-small summary:", summary);
      return summary || "Unable to generate a meaningful summary.";
    } catch (fallbackErr) {
      if (fallbackErr instanceof Error) {
        console.error("Fallback t5-small error:", fallbackErr.message, fallbackErr.stack);
      } else {
        console.error("Fallback t5-small error:", String(fallbackErr));
      }
      return `Summary generation failed. Sentiment analysis shows ${cleanedComments.length > 0 ? 'mostly positive' : 'no significant'} feedback.`;
    }
  }
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as Payload;
    console.log("Received payload:", payload);
    const { channelId, channelHandle } = payload;

    if (!channelId || !channelHandle) {
      console.error("Missing fields:", { channelId, channelHandle });
      return new Response(
        JSON.stringify({ status: "error", message: "Missing channelId or channelHandle" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch channel
    const { data: channel, error: channelError } = await supabase
      .from("yt_channels")
      .select("id")
      .eq("youtube_channel_id", channelId)
      .single();

    if (channelError || !channel) {
      console.error("Channel error:", channelError?.message || "No channel");
      return new Response(
        JSON.stringify({ status: "error", message: "Channel not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch comments
    const { data: comments, error: commentsError } = await supabase
      .from("yt_comments")
      .select("text")
      .eq("youtuber_id", channel.id)
      .limit(100);

    if (commentsError) {
      console.error("Comments error:", commentsError.message);
      return new Response(
        JSON.stringify({ status: "error", message: `Failed to fetch comments: ${commentsError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetched", comments?.length || 0, "comments for", channelId);

    if (!comments || comments.length === 0) {
      console.warn("No comments for", channelId);
      return new Response(
        JSON.stringify({
          status: "success",
          sentiment: null,
          summary: "No comments available.",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const commentTexts = comments.map((c: any) => c.text).filter((text: string) => text && text.trim());
    console.log("Valid comments:", commentTexts.length, "First 3 (50 chars):", commentTexts.slice(0, 3).map((t: string) => t.substring(0, 50)));

    if (commentTexts.length === 0) {
      console.warn("No valid comments for", channelId);
      return new Response(
        JSON.stringify({
          status: "success",
          sentiment: null,
          summary: "No valid comments available.",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate summary
    const summary = await generateSummary(commentTexts);

    // Calculate sentiment
    const sentimentScores = await Promise.all(commentTexts.map(fetchSentiment));
    const validScores = sentimentScores.filter((score: number) => score !== 0);
    console.log("Sentiment scores:", validScores);

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
      console.warn("No valid sentiment scores");
    }

    // Store summary
    const { error: summaryError } = await supabase
      .from("yt_channel_summaries")
      .upsert(
        [
          {
            youtuber_id: channel.id,
            summary,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "youtuber_id" }
      );

    if (summaryError) {
      console.error("Summary store error:", summaryError.message);
      return new Response(
        JSON.stringify({ status: "error", message: `Failed to store summary: ${summaryError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: "success",
        sentiment: sentimentResult,
        summary,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error in analyze_comments:", err.message, err.stack);
    return new Response(
      JSON.stringify({ status: "error", message: `Server error: ${err.message || 'Unknown error'}` }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});