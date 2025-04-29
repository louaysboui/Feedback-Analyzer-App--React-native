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
  const [channel, setChannel] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [longWait, setLongWait] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!snapshotId) {
      setError('No snapshotId provided');
      setLoading(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        let channelId: string | null = null;

        // After 1 minute, show long-wait message
        setTimeout(() => {
          if (isMounted) setLongWait(true);
        }, 60_000);

        // Poll up to 120 times (2 s interval → 4 min)
        for (let i = 0; i < 120; i++) {
          // Wait 2s between polls, but skip delay on first iteration
          if (i > 0) await new Promise((r) => setTimeout(r, 2000));

          const { data: job, error: jobErr } = await supabase
            .from('scrape_jobs')
            .select('status, channel_id')
            .eq('id', snapshotId)
            .single();

          console.log(
            `Poll #${i + 1} for ${snapshotId}:`,
            jobErr ? jobErr : job
          );

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
          throw new Error('Scrape job timed out (no ready state)');
        }

        // Finally fetch the channel record
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        {longWait && (
          <Text style={{ marginTop: 12, color: 'gray' }}>
            Still fetching… sometimes big channels take a few minutes to scrape.
          </Text>
        )}
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View style={{ padding: 16 }}>
        <Text>No channel data found.</Text>
      </View>
    );
  }

  // — Your original UI, unchanged —

  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Banner Image */}
      <Image
        source={{ uri: channel.banner_img }}
        style={{ width: '100%', height: 150 }}
        resizeMode="cover"
      />

      {/* Profile Section */}
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
          {channel.subscribers?.toLocaleString()} subscribers •{' '}
          {channel.videos_count} videos
        </Text>
        {channel.Details?.location && (
          <Text style={{ color: 'gray', fontSize: 12 }}>
            Location: {channel.Details.location}
          </Text>
        )}
      </View>

      {/* Description */}
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>About</Text>
        <Text style={{ color: 'gray', marginTop: 5 }}>
          {channel.Description}
        </Text>
      </View>

      {/* Social Links */}
      {Array.isArray(channel.Links) && (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Links</Text>
          {channel.Links.map((link: string, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={() => Linking.openURL(link)}
            >
              <Text style={{ color: 'blue', marginTop: 5 }}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default Youtube;
