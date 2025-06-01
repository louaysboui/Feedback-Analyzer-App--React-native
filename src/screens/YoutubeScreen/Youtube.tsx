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
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createClient } from '@supabase/supabase-js';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

type Props = NativeStackScreenProps<RootStackParamList, 'Youtube'>;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
});

export default function Youtube({ route, navigation }: Props) {
  const { channelUrl } = route.params;

  // State management
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosError, setVideosError] = useState<string | null>(null);

  // Reset state when channelUrl changes
  useEffect(() => {
    console.log('Channel URL changed:', channelUrl);
    setChannel(null);
    setVideos([]);
    setError(null);
    setVideosError(null);
    fetchChannel();
  }, [channelUrl]);

  // Fetch channel info
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

      const channelHandle = handle.replace('@', '');
      console.log('Fetching channel for handle:', handle);

      // Check if channel exists in database
      const { data, error: dbError } = await supabase
        .from('yt_channels')
        .select(`
          id,
          youtube_channel_id,
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

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Fetched channel from database:', data);

      if (data) {
        setChannel(data);
        console.log('Channel loaded from database, buttons should be enabled:', data.youtube_channel_id);
        return;
      }

      // If not found, trigger channel collection
      console.log('Triggering channel collection via trigger_videos-api');
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/trigger_videos-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            url: channelUrl,
            channelHandle,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Webhook error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch channel');
      }

      const responseData = await response.json();
      console.log('Webhook response:', responseData);
      const newChannel = responseData.channel;
      if (!newChannel || !newChannel.youtube_channel_id) {
        console.error('Invalid webhook response: No channel or youtube_channel_id');
        throw new Error('Failed to fetch channel: Invalid response');
      }

      setChannel(newChannel);
      console.log('Channel loaded from webhook, buttons should be enabled:', newChannel.youtube_channel_id);

    } catch (err: any) {
      console.error('Channel fetch error:', err);
      setError(
        err.message.includes('not-null constraint')
          ? 'Server error: Invalid data format. Please try again later.'
          : err.message.includes('Failed to generate UUID')
          ? 'Server error: Failed to generate channel ID. Please try again later.'
          : err.message || 'Failed to load channel'
      );
    } finally {
      setLoading(false);
    }
  };

  // Collect videos handler
  const collectVideos = async () => {
    if (!channel || !channel.youtube_channel_id) {
      setVideosError('Channel ID not available. Please try again.');
      console.log('Collect Videos blocked: No channel or youtube_channel_id');
      Alert.alert('Error', 'Channel not loaded. Please try again.');
      return;
    }

    setLoadingVideos(true);
    setVideosError(null);

    try {
      console.log('Triggering video collection for channel:', channel.youtube_channel_id, 'Handle:', channel.handle);
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/trigger_videos-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            url: channelUrl,
            channelId: channel.youtube_channel_id,
            channelHandle: channel.handle.replace('@', ''),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Video collection response error:', errorData);
        throw new Error(errorData.message || `Failed to trigger video collection: ${response.status}`);
      }

      const { snapshot_id, count } = await response.json();
      console.log('Video collection snapshot ID:', snapshot_id, 'Videos collected:', count);

      if (!snapshot_id) {
        throw new Error('No snapshot ID returned. Video collection failed.');
      }

      let attempts = 0;
      const maxAttempts = 10; // 20 seconds max
      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: job, error: jobError } = await supabase
          .from('scrape_jobs')
          .select('status')
          .eq('id', snapshot_id)
          .single();

        if (jobError) {
          console.error('Scrape job error:', jobError);
          throw jobError;
        }

        if (job?.status === 'ready') {
          console.log('Scrape job completed');
          break;
        }
        if (job?.status === 'failed') {
          throw new Error('Video collection job failed');
        }
        attempts++;
        console.log('Polling scrape job, attempt:', attempts);
      }

      if (attempts >= maxAttempts) {
        throw new Error('Video collection timed out');
      }

      const { data: videos, error: videosError } = await supabase
        .from('yt_videos')
        .select('*')
        .eq('youtuber_id', channel.youtube_channel_id)
        .order('date_posted', { ascending: false });

      if (videosError) throw videosError;
      console.log('Fetched videos:', videos);
      setVideos(videos || []);

    } catch (err: any) {
      console.error('Video collection error:', err);
      setVideosError(
        err.message.includes('not-null constraint')
          ? 'Server error: Invalid video data. Please try again later.'
          : err.message.includes('Failed to generate UUID')
          ? 'Server error: Failed to generate channel ID. Please try again later.'
          : err.message.includes('Channel not found')
          ? 'Channel not found on YouTube. Please check the URL.'
          : err.message || 'Failed to collect videos'
      );
      Alert.alert('Error', videosError || 'Failed to collect videos. Please try again.');
    } finally {
      setLoadingVideos(false);
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
        <Text>Invalid YouTube channel handle. Please try again with a valid YouTube channel handle.</Text>
      </View>
    );
  }

  // Render video item
  const renderVideoItem = ({ item }: ListRenderItemInfo<any>) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() =>
        navigation.navigate('VideoDetails', {
          video: item,
          channel: {
            handle: channel.handle,
            name: channel.name,
            youtube_channel_id: channel.youtube_channel_id,
          },
        })
      }
    >
      <Image
        source={{ uri: item.preview_image || 'https://placehold.co/120x80' }}
        style={styles.videoThumb}
      />
      <View style={styles.videoMeta}>
        <Text numberOfLines={2} style={styles.videoTitle}>
          {item.title}
        </Text>
        <Text style={styles.videoStats}>
          {item.views ? item.views.toLocaleString() : 'N/A'} views •{' '}
          {item.likes ? item.likes.toLocaleString() : 'N/A'} likes
        </Text>
        <Text style={styles.videoDate}>
          {item.date_posted ? new Date(item.date_posted).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </TouchableOpacity>
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
        <TouchableOpacity
          style={[styles.button, !channel.youtube_channel_id && styles.buttonDisabled]}
          onPress={collectVideos}
          disabled={loadingVideos || !channel.youtube_channel_id}
        >
          <Text style={styles.buttonText}>
            {loadingVideos ? 'Collecting Videos...' : 'Collect Videos'}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  padding: {
    padding: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    width: '100%',
    height: 150,
  },
  profileRow: {
    alignItems: 'center',
    marginTop: -50,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
  },
  channelName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 6,
  },
  channelHandle: {
    color: '#333',
    fontSize: 16,
  },
  subsText: {
    color: '#333',
    marginTop: 5,
  },
  sectionPadding: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  aboutText: {
    color: '#333',
    marginTop: 5,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  button: {
    backgroundColor: '#6200EE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  videoItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumb: {
    width: 120,
    height: 80,
  },
  videoMeta: {
    flex: 1,
    padding: 10,
  },
  videoTitle: {
    fontWeight: '500',
    fontSize: 16,
  },
  videoStats: {
    color: '#333',
    fontSize: 14,
    marginVertical: 4,
  },
  videoDate: {
    color: '#333',
    fontSize: 14,
  },
});