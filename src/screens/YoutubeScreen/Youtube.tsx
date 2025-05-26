import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createClient } from '@supabase/supabase-js';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

type Props = NativeStackScreenProps<RootStackParamList, 'Youtube'>;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' }
});

export default function Youtube({ route }: Props) {
  const { channelUrl, snapshotId } = route.params;

  // State management
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [channelSummary, setChannelSummary] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch channel info
  useEffect(() => {
    const fetchChannel = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Extract handle from URL
        const handleMatch = channelUrl.match(/youtube\.com\/(@[a-zA-Z0-9_-]+)/);
        const handle = handleMatch ? handleMatch[1] : null;
        
        if (!handle) {
          throw new Error('Invalid YouTube channel URL');
        }

        // Check if channel exists in database
        const { data, error: dbError } = await supabase
          .from('yt_channels')
          .select(`
            id,
            handle,
            name,
            description,
            profile_image,
            banner_img,
            subscribers,
            videos_count,
            views,
            created_date,
            location,
            url
          `)
          .eq('handle', handle)
          .maybeSingle();

        if (dbError) throw dbError;

        console.log('Fetched channel:', data);

        if (data) {
          setChannel(data);
          // Fetch channel summary
          const { data: summaryData, error: summaryError } = await supabase
            .from('yt_channel_summaries')
            .select('summary')
            .eq('youtuber_id', data.id)
            .maybeSingle();

          if (summaryError) console.error('Summary fetch error:', summaryError);
          setChannelSummary(summaryData?.summary || null);
          return;
        }

        // If not found, trigger channel collection
        const response = await fetch(
          `${SUPABASE_URL}/functions/v1/collection_webhook`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ url: channelUrl }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch channel');
        }

        const { channel: newChannel } = await response.json();
        console.log('New channel from webhook:', newChannel);
        setChannel(newChannel);

      } catch (err: any) {
        console.error('Channel fetch error:', err);
        setError(err.message || 'Failed to load channel');
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [channelUrl]);

  // Collect videos handler
  const collectVideos = async () => {
    if (!channel) return;
    
    setLoadingVideos(true);
    setVideosError(null);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/trigger_videos-api`, // Fixed endpoint
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ 
            url: channelUrl,
            channelId: channel.id,
            channelHandle: channel.handle
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Video collection response error:', errorData);
        throw new Error(errorData.message || `Failed to trigger video collection: ${response.status}`);
      }

      const { snapshot_id } = await response.json();
      
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: job } = await supabase
          .from('scrape_jobs')
          .select('status')
          .eq('id', snapshot_id)
          .single();

        if (job?.status === 'ready') break;
        if (job?.status === 'failed') throw new Error('Video collection failed');
        attempts++;
      }

      const { data: videos, error: videosError } = await supabase
        .from('yt_videos')
        .select('*')
        .eq('youtuber_id', channel.id)
        .order('date_posted', { ascending: false });

      if (videosError) throw videosError;
      console.log('Fetched videos:', videos);
      setVideos(videos || []);

    } catch (err: any) {
      console.error('Video collection error:', err);
      setVideosError(err.message || 'Failed to collect videos');
    } finally {
      setLoadingVideos(false);
    }
  };

 // Analyze comments handler
const analyzeComments = async () => {
  if (!channel) return;

  setLoadingAnalysis(true);
  setAnalysisError(null);

  try {
    // Use the correct channel ID that matches yt_comments.youtuber_id
    // Adjust this depending on your channel object fields!
    // Most likely: channel.id is internal DB id, channel.url or channel.youtube_channel_id is YouTube channel ID string
    const youtuberId = channel.youtube_channel_id || channel.url || channel.id;

    console.log('DEBUG: Sending youtuberId for analysis:', youtuberId);

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/analyze_comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          channelId: youtuberId,
          channelHandle: channel.handle,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze comments');
    }

    const { sentiment, summary } = await response.json();
    console.log('Sentiment analysis:', sentiment, 'Summary:', summary);
    setSentiment(sentiment);
    setChannelSummary(summary);

  } catch (err: any) {
    console.error('Analysis error:', err);
    setAnalysisError(err.message || 'Failed to analyze comments');
  } finally {
    setLoadingAnalysis(false);
  }
};


  // Render loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Render no channel state
  if (!channel) {
    return (
      <View style={styles.center}>
        <Text>No channel data available</Text>
      </View>
    );
  }

  // Render video item
  const renderVideoItem = ({ item }: ListRenderItemInfo<any>) => (
    <View style={styles.videoItem}>
      <Image
        source={{ uri: item.preview_image || 'https://placehold.co/120x80' }}
        style={styles.videoThumb}
      />
      <View style={styles.videoMeta}>
        <Text numberOfLines={2} style={styles.videoTitle}>
          {item.title}
        </Text>
        <Text style={styles.videoStats}>
          {item.views ? item.views.toLocaleString() : 'N/A'} views • {item.likes ? item.likes.toLocaleString() : 'N/A'} likes
        </Text>
        <Text style={styles.videoDate}>
          {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </View>
  );

  // Render header
  const renderHeader = () => (
    <>
      <Image
        source={{ uri: channel.banner_img || 'https://placehold.co/600x200' }}
        style={styles.banner}
        resizeMode="cover"
      />
      <View style={styles.profileRow}>
        <Image
          source={{ uri: channel.profile_image }}
          style={styles.avatar}
        />
        <Text style={styles.channelName}>{channel.name}</Text>
        <Text style={styles.channelHandle}>{channel.handle}</Text>
        <Text style={styles.subsText}>
          {channel.subscribers?.toLocaleString()} subscribers • {channel.videos_count} videos
        </Text>
      </View>
      
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>
          {channel.description || 'No description available'}
        </Text>
      </View>
      
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>AI-Generated Channel Summary</Text>
        <Text style={styles.aboutText}>
          {channelSummary || 'No summary available. Click "Analyze Comments" to generate one.'}
        </Text>
      </View>
      
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>Sentiment Analysis</Text>
        {sentiment ? (
          <View>
            <Text style={styles.aboutText}>
              Positive: {sentiment.positive_percentage.toFixed(2)}%
            </Text>
            <Text style={styles.aboutText}>
              Negative: {sentiment.negative_percentage.toFixed(2)}%
            </Text>
            <Text style={styles.aboutText}>
              Average Score: {sentiment.average_score.toFixed(2)}
            </Text>
          </View>
        ) : (
          <Text style={styles.aboutText}>
            No sentiment analysis available. Click "Analyze Comments" to generate.
          </Text>
        )}
        {analysisError && (
          <Text style={styles.errorText}>{analysisError}</Text>
        )}
      </View>
      
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.button}
          onPress={collectVideos}
          disabled={loadingVideos}
        >
          <Text style={styles.buttonText}>
            {loadingVideos ? 'Collecting Videos...' : 'Collect Videos'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={analyzeComments}
          disabled={loadingAnalysis}
        >
          <Text style={styles.buttonText}>
            {loadingAnalysis ? 'Analyzing...' : 'Analyze Comments'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {videosError && (
        <Text style={styles.errorText}>{videosError}</Text>
      )}
    </>
  );

  return (
    <FlatList
      data={videos}
      renderItem={renderVideoItem}
      ListHeaderComponent={renderHeader}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center'
  },
  padding: {
    padding: 16
  },
  errorText: {
    color: 'red', textAlign: 'center', paddingHorizontal: 16
  },
  banner: {
    width: '100%', height: 150
  },
  profileRow: {
    alignItems: 'center', marginTop: -50, paddingHorizontal: 16
  },
  avatar: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3,
    borderColor: 'white'
  },
  channelName: {
    fontSize: 20, fontWeight: 'bold', marginTop: 6
  },
  channelHandle: {
    color: '#333', fontSize: 16
  },
  subsText: {
    color: '#333', marginTop: 5
  },
  sectionPadding: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold'
  },
  aboutText: {
    color: '#333', marginTop: 5, fontSize: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8
  },
  buttonText: {
    color: 'white', fontWeight: '600', fontSize: 16
  },
  videoItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden'
  },
  videoThumb: {
    width: 120,
    height: 80
  },
  videoMeta: {
    flex: 1,
    padding: 10
  },
  videoTitle: {
    fontWeight: '500', fontSize: 16
  },
  videoStats: {
    color: '#333',
    fontSize: 14,
    marginVertical: 4
  },
  videoDate: {
    color: '#333',
    fontSize: 14
  },
});