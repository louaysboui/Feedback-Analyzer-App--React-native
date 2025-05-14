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
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Youtube({ route }: Props) {
  const { channelUrl, snapshotId } = route.params;

  // ─── Channel State ─────────────────────────────────────────────
  const [channel, setChannel]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [longWait, setLongWait] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ─── Videos State ──────────────────────────────────────────────
  const [videos, setVideos]         = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videosError, setVideosError]     = useState<string | null>(null);

  // ─── Fetch Channel Info ────────────────────────────────────────
  useEffect(() => {
  setChannel(null);
  setError(null);
  setLoading(true);
  setLongWait(false);

  let isMounted = true;
  (async () => {
    try {
      // Extract channel handle from URL
      const channelHandleMatch = channelUrl.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
      const channelHandle = channelHandleMatch ? channelHandleMatch[1] : null;
      if (!channelHandle) {
        throw new Error('Invalid channel URL');
      }

      // Fetch channel directly by handle
      let attempt = 0;
      const maxAttempts = 3;
      let ch = null;
      let chErr = null;

      while (attempt < maxAttempts) {
        const { data, error } = await supabase
          .from('yt_channels')
          .select('*')
          .eq('handle', `@${channelHandle}`)
          .single();
        ch = data;
        chErr = error;
        if (!chErr || ch) break;
        attempt++;
        await new Promise((r) => setTimeout(r, 2000 * attempt)); // Exponential backoff
        console.log(`Retry attempt ${attempt} for handle @${channelHandle}`);
      }

      if (chErr) throw chErr;
      if (!ch) throw new Error('Channel not found after retries');

      if (isMounted) setChannel(ch);
    } catch (e: any) {
      console.error('Channel fetch error:', e);
      if (isMounted) setError(e.message || 'Unexpected error');
    } finally {
      if (isMounted) setLoading(false);
    }
  })();
  return () => { isMounted = false; };
}, [channelUrl]);

  // ─── Collect Videos Handler ────────────────────────────────────
  const collectVideos = async () => {
    setVideos([]);
    setVideosError(null);
    setLoadingVideos(true);

    try {
      const triggerRes = await fetch(
        `${SUPABASE_URL}/functions/v1/trigger_videos-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url: channelUrl.replace(/\/about$/, '') }),
        }
      );
      const { snapshot_id: vidSnapshot } = await triggerRes.json();
      if (!vidSnapshot) throw new Error('Failed to trigger video job');

      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { data: job } = await supabase
          .from('scrape_jobs')
          .select('status')
          .eq('id', vidSnapshot)
          .single();
        if (job?.status === 'ready') break;
        if (job?.status === 'failed') throw new Error('Video scrape failed');
      }

      const { data: vids, error: vidsErr } = await supabase
        .from('yt_videos')
        .select('id, title, preview_image, views, likes, date_posted')
        .eq('youtuber_id', channel.id)
        .order('date_posted', { ascending: false });
      if (vidsErr) throw vidsErr;
      setVideos(vids || []);
    } catch (e: any) {
      console.error(e);
      setVideosError(e.message);
    } finally {
      setLoadingVideos(false);
    }
  };

  // ─── Render Loading / Error ─────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        {longWait && (
          <Text style={styles.longWaitText}>
            Still fetching channel… this can take up to a minute.
          </Text>
        )}
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.padding}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  if (!channel) {
    return (
      <View style={styles.padding}>
        <Text>No channel data found.</Text>
      </View>
    );
  }

  // ─── Compute Stats ─────────────────────────────────────────────
  const totalViews = `${(channel.views / 1_000_000).toFixed(1)}M`;
  const joinedYear = new Date(channel.created_date).getFullYear();
  const location   = channel.location ?? 'Unknown';

  // ─── List Header ──────────────────────────────────────────────
  const renderHeader = () => (
    <>
      <Image
        source={{ uri: channel.banner_img }}
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
          {channel.subscribers.toLocaleString()} subscribers • {channel.videos_count} videos
        </Text>
      </View>
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.aboutText}>{channel.Description}</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{totalViews}</Text>
          <Text style={styles.statLabel}>Total Views</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{joinedYear}</Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{location}</Text>
          <Text style={styles.statLabel}>Location</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.collectBtn}
        onPress={collectVideos}
        disabled={loadingVideos}
      >
        <Text style={styles.collectBtnText}>
          {loadingVideos ? 'Collecting…' : 'Collect Videos'}
        </Text>
      </TouchableOpacity>
      {videosError && (
        <Text style={styles.errorText}>{videosError}</Text>
      )}
    </>
  );

  // ─── Render Video Item ────────────────────────────────────────
  const renderVideo = ({ item }: ListRenderItemInfo<any>) => (
    <View style={styles.videoItem}>
      <Image
        source={{ uri: item.preview_image }}
        style={styles.videoThumb}
      />
      <View style={styles.videoMeta}>
        <Text numberOfLines={2} style={styles.videoTitle}>
          {item.title}
        </Text>
        <Text style={styles.videoStats}>
          {item.views.toLocaleString()} views • {item.likes.toLocaleString()} likes
        </Text>
        <Text style={styles.videoDate}>
          {new Date(item.date_posted).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={videos}
      keyExtractor={(v) => v.id}
      ListHeaderComponent={renderHeader}
      renderItem={renderVideo}
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

const { width } = Dimensions.get('screen');
const styles = StyleSheet.create({
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