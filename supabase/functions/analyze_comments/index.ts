import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from '../shared/cors.ts';

interface Comment {
  id: string;
  text: string;
}

interface Sentiment {
  positive_percentage: number;
  negative_percentage: number;
  average_score: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoId, youtuberId } = await req.json();
    if (!videoId || !youtuberId) {
      return new Response(JSON.stringify({ error: 'videoId and youtuberId are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('Analyzing video:', videoId, 'youtuberId:', youtuberId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: comments, error: commentsError } = await supabase
      .from('yt_comments')
      .select('id, text')
      .eq('video_id', videoId)
      .eq('youtuber_id', youtuberId)
      .limit(50);

    if (commentsError) {
      console.error('Comments fetch error:', commentsError);
      throw new Error(`Failed to fetch comments: ${commentsError.message}`);
    }

    if (!comments || comments.length === 0) {
      throw new Error('No comments found for this video');
    }

    let positiveCount = 0;
    let negativeCount = 0;
    let totalScore = 0;

    for (const comment of comments) {
      const score = comment.text.toLowerCase().includes('great') ? 1 : comment.text.toLowerCase().includes('bad') ? -1 : 0;
      const label = score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
      if (score > 0) positiveCount++;
      if (score < 0) negativeCount++;
      totalScore += score;

      await supabase
        .from('yt_comments')
        .update({ sentiment_score: score, sentiment_label: label })
        .eq('id', comment.id);
    }

    const totalComments = comments.length;
    const sentiment: Sentiment = {
      positive_percentage: (positiveCount / totalComments) * 100,
      negative_percentage: (negativeCount / totalComments) * 100,
      average_score: totalScore / totalComments,
    };

    const summary = `Analyzed ${totalComments} comments. ${sentiment.positive_percentage.toFixed(2)}% positive, ${sentiment.negative_percentage.toFixed(2)}% negative.`;

    const { error: summaryError } = await supabase
      .from('yt_video_summaries')
      .upsert(
        { video_id: videoId, summary, updated_at: new Date().toISOString() },
        { onConflict: 'video_id' }
      );

    if (summaryError) {
      console.error('Summary upsert error:', summaryError);
      throw new Error(`Failed to store summary: ${summaryError.message}`);
    }

    return new Response(
      JSON.stringify({ sentiment, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: typeof error === 'object' && error !== null && 'message' in error ? (error as { message: string }).message : 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});