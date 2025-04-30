// src/screens/YoutubeScreen/Youtube.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createClient } from '@supabase/supabase-js';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

type YoutubeScreenProps = NativeStackScreenProps<RootStackParamList, 'Youtube'>;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Youtube: React.FC<YoutubeScreenProps> = ({ route }) => {
  const { channelUrl, snapshotId } = route.params;

  const [channel, setChannel]     = useState<any>(null);
  const [loading, setLoading]     = useState<boolean>(true);
  const [longWait, setLongWait]   = useState<boolean>(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    if (!snapshotId) {
      setError('No snapshotId provided');
      setLoading(false);
      return;
    }

    // 1) Reset state on new snapshotId
    setChannel(null);
    setError(null);
    setLoading(true);
    setLongWait(false);

    let isMounted = true;

    (async () => {
      try {
        let channelId: string | null = null;

        // After 1 minute, show the “still fetching…” message
        setTimeout(() => {
          if (isMounted) setLongWait(true);
        }, 60_000);

        // Poll up to 120 times (2s interval → ~4 min)
        for (let i = 0; i < 120; i++) {
          if (i > 0) {
            await new Promise((r) => setTimeout(r, 2000));
          }

          const { data: job, error: jobErr } = await supabase
            .from('scrape_jobs')
            .select('status, channel_id')
            .eq('id', snapshotId)
            .single();

          console.log(`Poll #${i + 1} for ${snapshotId}:`, jobErr ?? job);

          if (jobErr) throw jobErr;
          if (job.status === 'ready') {
            channelId = job.channel_id;
            break;
          }
          if (job.status === 'failed') {
            throw new Error('Scrape job failed');
          }
        }

        if (!channelId) {
          throw new Error('Scrape job timed out');
        }

        // Fetch the channel record
        const { data: ch, error: chErr } = await supabase
          .from('yt_channels')
          .select('*')
          .eq('id', channelId)
          .single();
        if (chErr) throw chErr;

        if (isMounted) {
          setChannel(ch);
        }
      } catch (err: any) {
        console.error(err);
        if (isMounted) setError(err.message || 'Unexpected error');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [snapshotId]);

  // 2) Show full-screen loader while loading
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        {longWait && (
          <Text style={{ marginTop: 12, color: 'gray', textAlign: 'center' }}>
            Still fetching… sometimes big channels take a few minutes to scrape.
          </Text>
        )}
      </View>
    );
  }

  // 3) Error state
  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  // 4) No data
  if (!channel) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No channel data found.</Text>
      </View>
    );
  }

  // 5) Render your UI with the fresh `channel` object
  const totalViews = `${(channel.views / 1_000_000).toFixed(1)}M`;
  const joinedYear = new Date(channel.created_date).getFullYear();
  const location   = channel.location ?? 'Unknown';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Banner */}
      <Image
        source={{ uri: channel.banner_img }}
        style={{ width: '100%', height: 150 }}
        resizeMode="cover"
      />

      {/* Avatar & Basic Info */}
      <View style={{ alignItems: 'center', marginTop: -50 }}>
        <Image
          source={{ uri: channel.profile_image }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderWidth: 3,
            borderColor: 'white',
          }}
        />
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>
          {channel.name}
        </Text>
        <Text style={{ color: 'gray' }}>{channel.handle}</Text>
        <Text style={{ color: 'gray', marginTop: 5 }}>
          {channel.subscribers.toLocaleString()} subscribers •{' '}
          {channel.videos_count} videos
        </Text>
      </View>

      {/* About Section */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>About</Text>
        <Text style={{ color: 'gray', marginTop: 5 }}>
          {channel.Description}
        </Text>
      </View>

      {/* Stats Row */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: '#eee',
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{totalViews}</Text>
          <Text style={{ color: 'gray' }}>Total Views</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{joinedYear}</Text>
          <Text style={{ color: 'gray' }}>Joined</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{location}</Text>
          <Text style={{ color: 'gray' }}>Location</Text>
        </View>
      </View>

      {/* Links */}
      {Array.isArray(channel.Links) && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Links</Text>
          {channel.Links.map((link: string, idx: number) => (
            <TouchableOpacity key={idx} onPress={() => Linking.openURL(link)}>
              <Text style={{ color: 'blue', marginTop: 5 }}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default Youtube;
