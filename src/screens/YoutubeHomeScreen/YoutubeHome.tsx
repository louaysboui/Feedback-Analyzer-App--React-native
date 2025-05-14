import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from './YoutubehomeStyles';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type SearchHistoryItem = {
  name: string;
  subscribers: string;
  profileImage?: string;
  url: string;
};

export default function YoutubeHome() {
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const popularChannels = ['MKBHD', 'Veritasium', 'Fireship', 'Kurzgesagt'];

  // Load search history from AsyncStorage on mount
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await AsyncStorage.getItem('searchHistory');
        if (history) {
          setSearchHistory(JSON.parse(history));
        }
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };
    loadSearchHistory();
  }, []);

  // Save search history to AsyncStorage whenever it changes
  useEffect(() => {
    const saveSearchHistory = async () => {
      try {
        await AsyncStorage.setItem('searchHistory', JSON.stringify(searchHistory));
      } catch (error) {
        console.error('Error saving search history:', error);
      }
    };
    saveSearchHistory();
  }, [searchHistory]);

  const startAnalyzing = async () => {
  setErrorMessage(null);

  try {
    // Extract channel handle from URL
    const channelHandleMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    const channelHandle = channelHandleMatch ? channelHandleMatch[1] : null;
    if (!channelHandle) {
      throw new Error('Invalid channel URL');
    }

    // Check if channel already exists in yt_channels
    const { data: existingChannel, error: chErr } = await supabase
      .from('yt_channels')
      .select('id, name, subscribers, profile_image')
      .eq('handle', `@${channelHandle}`)
      .single();

    if (chErr && chErr.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(chErr.message);
    }

    if (existingChannel) {
      // Channel exists, add to search history and navigate
      setSearchHistory((prev) => [
        ...prev,
        {
          name: existingChannel.name,
          subscribers: `${existingChannel.subscribers.toLocaleString()} subscribers`,
          profileImage: existingChannel.profile_image || undefined,
          url,
        },
      ]);
      navigation.navigate('Youtube', {
        channelUrl: url,
        snapshotId: '',
      });
      return;
    }

    // Trigger new scrape if channel doesn't exist
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
    const channelHandleFromResponse: string = triggerJson.channelHandle;

    let channelId: string | null = null;
    for (let i = 0; i < 30; i++) { // Reduce to 1 minute
      await new Promise((r) => setTimeout(r, 2000));
      const { data: job, error: jobErr } = await supabase
        .from('scrape_jobs')
        .select('status, channel_id')
        .eq('id', snapshotId)
        .single();
      if (jobErr) {
        console.error('Job query error:', jobErr.message);
        throw jobErr;
      }
      if (job.status === 'ready') {
        channelId = job.channel_id;
        break;
      }
      if (job.status === 'failed') {
        throw new Error('Scrape job failed');
      }
    }
    if (!channelId) {
      const { data: channel, error: chErr } = await supabase
        .from('yt_channels')
        .select('id')
        .eq('handle', `@${channelHandleFromResponse}`)
        .single();
      if (chErr || !channel) {
        throw new Error('Timed out fetching channel data');
      }
      channelId = channel.id;
    }

    const { data: ch, error: fetchErr } = await supabase // Renamed chErr to fetchErr
      .from('yt_channels')
      .select('name, subscribers, profile_image')
      .eq('id', channelId)
      .single();
    if (fetchErr || !ch) {
      throw new Error(fetchErr?.message ?? 'Channel not found');
    }

    setSearchHistory((prev) => [
      ...prev,
      {
        name: ch.name,
        subscribers: `${ch.subscribers.toLocaleString()} subscribers`,
        profileImage: ch.profile_image || undefined,
        url,
      },
    ]);

    navigation.navigate('Youtube', {
      channelUrl: url,
      snapshotId,
    });
  } catch (err: any) {
    console.error('Start analyzing error:', err);
    setErrorMessage(err.message || 'Unexpected error');
  }
};

  const handleHistoryClick = (item: SearchHistoryItem) => {
    navigation.navigate('Youtube', {
      channelUrl: item.url,
      snapshotId: '',
    });
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
          <TouchableOpacity
            key={idx}
            style={styles.searchHistoryItem}
            onPress={() => handleHistoryClick(item)}
          >
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
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No search history yet.</Text>
      )}
    </ScrollView>
  );
}