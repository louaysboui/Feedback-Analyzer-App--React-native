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
  db: { schema: 'public' } // Explicitly specify schema
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

        console.log('Fetched channel:', data); // Debug channel data

        if (data) {
          setChannel(data);
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
        console.log('New channel from webhook:', newChannel); // Debug webhook response
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
        `${SUPABASE_URL}/functions/v1/trigger_videos-api`,
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
        throw new Error(errorData.message || 'Failed to trigger video collection');
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
      console.log('Fetched videos:', videos); // Debug video data
      setVideos(videos || []);

    } catch (err: any) {
      console.error('Video collection error:', err);
      setVideosError(err.message || 'Failed to collect videos');
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
        resizeMode="cover" // Ensure banner covers the area
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
      
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {channel.views ? `${(channel.views / 1000000).toFixed(1)}M` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {channel.created_date ? new Date(channel.created_date).getFullYear() : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {channel.location || 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.collectBtn}
        onPress={collectVideos}
        disabled={loadingVideos}
      >
        <Text style={styles.collectBtnText}>
          {loadingVideos ? 'Collecting Videos...' : 'Collect Videos'}
        </Text>
      </TouchableOpacity>
      
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

// Styles remain unchanged
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
  longWaitText: {
    marginTop: 12, color: 'gray', textAlign: 'center'
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
    fontSize: 20, fontWeight: 'bold', marginTop: 10
  },
  channelHandle: {
    color: 'gray'
  },
  subsText: {
    color: 'gray', marginTop: 5
  },
  sectionPadding: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16, fontWeight: 'bold'
  },
  aboutText: {
    color: 'gray', marginTop: 5
  },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#eee'
  },
  stat: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 16, fontWeight: 'bold'
  },
  statLabel: {
    color: 'gray'
  },
  collectBtn: {
    backgroundColor: '#6C63FF',
    margin: 16,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center'
  },
  collectBtnText: {
    color: 'white', fontWeight: '600'
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
    padding: 8
  },
  videoTitle: {
    fontWeight: '500'
  },
  videoStats: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4
  },
  videoDate: {
    color: 'gray',
    fontSize: 12,
    marginTop: 2
  },
});