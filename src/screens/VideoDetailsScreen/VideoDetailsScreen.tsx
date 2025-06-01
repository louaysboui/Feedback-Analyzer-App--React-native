import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createClient } from '@supabase/supabase-js';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoDetails'>;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function VideoDetailsScreen({ route, navigation }: Props) {
  const { video, channel } = route.params;
  const [comments, setComments] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState<number>(0);

  useEffect(() => {
    fetchChannelId();
  }, [channel.handle]);

  const fetchChannelId = async () => {
    try {
      console.log('Fetching channel ID for handle:', channel.handle);
      const { data, error } = await supabase
        .from('yt_channels')
        .select('id')
        .eq('handle', channel.handle)
        .single();
      if (error || !data) {
        console.error('Channel ID fetch error:', error);
        throw new Error('Channel not found');
      }
      setChannelId(data.id);
      fetchComments(data.id);
      fetchAnalysis();
    } catch (err: any) {
      console.error('Channel ID fetch error:', err);
      setError(err.message || 'Failed to load channel');
    }
  };

  const fetchComments = async (youtuberId: string) => {
  try {
    console.log('Fetching comments for video_id:', video.id, 'youtuber_id:', youtuberId);
    const { data, error, count } = await supabase
      .from('yt_comments')
      .select('id, text, author', { count: 'exact' })
      .eq('video_id', video.id)
      .eq('youtuber_id', youtuberId)
      .limit(50);
    if (error) {
      console.error('Supabase comment error:', error.message, error.details);
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }
    console.log('Fetched comments:', data?.length || 0, 'Total count:', count);
    setComments(data || []);
    setCommentCount(count || 0);
    if (count === 0) {
      setError('No comments available for this video. Comments may be disabled.');
    }
  } catch (err: any) {
    console.error('Comments fetch error:', err.message, err.stack);
    setError(err.message || 'Failed to load comments');
  }
};

  const fetchAnalysis = async () => {
    try {
      console.log('Fetching summary for video_id:', video.id);
      const { data, error } = await supabase
        .from('yt_video_summaries')
        .select('summary')
        .eq('video_id', video.id)
        .maybeSingle();
      if (error) {
        console.error('Supabase summary error:', error.message, error.details);
        throw new Error(`Failed to fetch summary: ${error.message}`);
      }
      console.log('Fetched summary:', data?.summary || 'None');
      setSummary(data?.summary || null);
    } catch (err: any) {
      console.error('Summary fetch error:', err);
      setError(err.message || 'Failed to load summary');
    }
  };

  const analyzeComments = async () => {
    if (!channelId) {
      setError('Channel ID not loaded');
      Alert.alert('Error', 'Channel ID not loaded. Please try again.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Analyze comments
      console.log('Analyzing comments for video_id:', video.id);
      const analyzeResponse = await fetch(`${SUPABASE_URL}/functions/v1/analyze_video_comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ videoId: video.id }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        console.error('Analysis response error:', errorData);
        throw new Error(errorData.message || 'Analysis failed');
      }

      const { sentiment, summary } = await analyzeResponse.json();
      console.log('Analysis result:', { sentiment, summary });
      setSentiment(sentiment);
      setSummary(summary);
      await fetchComments(channelId); // Update comment count

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Failed to analyze comments');
      Alert.alert('Error', err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentAuthor}>{item.author || 'Anonymous'}</Text>
      <Text style={styles.commentText}>{item.text}</Text>
    </View>
  );

  return (
    <FlatList
      data={comments}
      renderItem={renderComment}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => (
        <View style={styles.container}>
          <Image
            source={{
              uri: video.preview_image && video.preview_image.startsWith('http')
                ? video.preview_image
                : 'https://placehold.co/600x400',
            }}
            style={styles.previewImage}
            onError={(e) => console.error('Video preview image error:', e.nativeEvent.error)}
          />
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoStats}>
            {video.views ? video.views.toLocaleString() : 'N/A'} views • {video.likes ? video.likes.toLocaleString() : 'N/A'} likes •{' '}
            {new Date(video.date_posted).toLocaleDateString()}
          </Text>
          <View style={styles.channelSection}>
            <Text style={styles.sectionTitle}>Channel</Text>
            <Text style={styles.channelInfo}>{channel.name} ({channel.handle})</Text>
          </View>
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{summary || 'No summary available. Click Analyze.'}</Text>
          </View>
          <View style={styles.sentimentSection}>
            <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
            {sentiment ? (
              <>
                <Text style={styles.sentimentText}>Positive: {sentiment.positive_percentage.toFixed(2)}%</Text>
                <Text style={styles.sentimentText}>Negative: {sentiment.negative_percentage.toFixed(2)}%</Text>
                <Text style={styles.sentimentText}>Average Score: {sentiment.average_score.toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.sentimentText}>No sentiment analysis available.</Text>
            )}
            <Text style={styles.sentimentText}>Comments Analyzed: {commentCount}</Text>
          </View>
          <TouchableOpacity
            style={[styles.analyzeButton, loading && styles.analyzeButtonDisabled]}
            onPress={analyzeComments}
            disabled={loading}
          >
            <Text style={styles.analyzeButtonText}>
              {loading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  Analyzing...
                </>
              ) : (
                'Analyze Comments'
              )}
            </Text>
          </TouchableOpacity>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.sectionTitle}>Comments</Text>
        </View>
      )}
      contentContainerStyle={styles.flatListContent}
    />
  );
}

const styles = StyleSheet.create({
  sentimentText: {
    fontSize: 14,
    color: '#1F2937',
    marginTop: 4,
  },
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  previewImage: {
    width: '100%',
    height: 192,
    borderRadius: 8,
  },
  videoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  videoStats: {
    fontSize: 14,
    color: '#4B5563',
  },
  channelSection: {
    marginTop: 16,
  },
  summarySection: {
    marginTop: 16,
  },
  sentimentSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  channelInfo: {
    fontSize: 14,
    color: '#1F2937',
  },
  summaryText: {
    fontSize: 14,
    color: '#1F2937',
  },
  analyzeButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  commentContainer: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 16,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    color: '#1F2937',
  },
  flatListContent: {
    paddingBottom: 16,
  },
});