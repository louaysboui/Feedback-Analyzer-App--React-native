// src/screens/YoutubeHomeScreen/YoutubeHome.tsx

import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { createClient } from '@supabase/supabase-js';
import { styles } from './YoutubehomeStyles';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type SearchHistoryItem = {
  name: string;
  subscribers: string;
  profileImage?: string;
};

export default function YoutubeHome() {
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const popularChannels = ['MKBHD', 'Veritasium', 'Fireship', 'Kurzgesagt'];

  const startAnalyzing = async () => {
    setErrorMessage(null);

    try {
      // 1) Trigger the scrape job
      const triggerRes = await fetch(
        `${SUPABASE_URL}/functions/v1/trigger_collection-api`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ url }),
        }
      );
      const triggerJson = await triggerRes.json();
      if (!triggerRes.ok || !triggerJson.snapshot_id) {
        throw new Error(triggerJson.message ?? 'Failed to trigger job');
      }
      const snapshotId: string = triggerJson.snapshot_id;

      // 2) Poll until ready
      let channelId: string | null = null;
      for (let i = 0; i < 60; i++) { // ~2 minutes max
        await new Promise((r) => setTimeout(r, 2000));
        const { data: job, error: jobErr } = await supabase
          .from('scrape_jobs')
          .select('status, channel_id')
          .eq('id', snapshotId)
          .single();
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
        throw new Error('Timed out fetching channel data');
      }

      // 3) Fetch the channel record
      const { data: ch, error: chErr } = await supabase
        .from('yt_channels')
        .select('name, subscribers, profile_image')
        .eq('id', channelId)
        .single();
      if (chErr || !ch) {
        throw new Error(chErr?.message ?? 'Channel not found');
      }

      // 4) Update Recent Searches
      setSearchHistory((prev) => [
        ...prev,
        {
          name: ch.name,
          subscribers: `${ch.subscribers.toLocaleString()} subscribers`,
          profileImage: ch.profile_image || undefined,
        },
      ]);

      // 5) Navigate as before
      navigation.navigate('Youtube', {
        channelUrl: url,
        snapshotId,
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Unexpected error');
    }
  };

  const handlePopularChannelClick = (channel: string) => {
    const aboutUrl = `https://www.youtube.com/@${channel.toLowerCase()}/about`;
    setUrl(aboutUrl);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>YouTube Channel Analyzer</Text>
      <Text style={styles.subtitle}>
        Discover insights about any YouTube channel
      </Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Paste YouTube channel URL"
          placeholderTextColor="#A0A0A0"
          value={url}
          onChangeText={setUrl}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={startAnalyzing}
          disabled={!url.trim()}
        >
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>

      {errorMessage && (
        <Text style={[styles.errorText, { marginBottom: 12 }]}>
          {errorMessage}
        </Text>
      )}

      <Text style={styles.exampleTitle}>
        Example: https://youtube.com/@mkbhd
      </Text>

      <Text style={styles.sectionTitle}>Popular Channels</Text>
      <View style={styles.popularChannelsContainer}>
        {popularChannels.map((channel, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handlePopularChannelClick(channel)}
          >
            <Text style={styles.popularChannelText}>{channel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Searches</Text>
      {searchHistory.length > 0 ? (
        searchHistory.map((item, idx) => (
          <View key={idx} style={styles.searchHistoryItem}>
            {item.profileImage ? (
              <Image
                source={{ uri: item.profileImage }}
                style={styles.searchHistoryAvatar}
              />
            ) : (
              <View style={styles.avatar} />
            )}
            <View>
              <Text style={styles.searchHistoryName}>{item.name}</Text>
              <Text style={styles.searchHistorySubscribers}>
                {item.subscribers}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No search history yet.</Text>
      )}
    </ScrollView>
  );
}
