// --- YoutubeHome.tsx ---
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
    const handleMatch = url.match(/youtube\.com\/@([\w\-]+)/);
    const channelHandle = handleMatch ? handleMatch[1] : null;
    if (!channelHandle) throw new Error('Invalid channel URL');

    // Step 1: Search to get channelId
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelHandle}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const searchData = await searchRes.json();
    if (!searchData.items || searchData.items.length === 0) {
      throw new Error('Channel not found during search');
    }

    const channelId = searchData.items[0].snippet.channelId;

    // Step 2: Get channel details using channelId
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
    );
    const data = await res.json();
    if (!res.ok || !data.items || !data.items.length) {
      throw new Error('Channel not found via YouTube API');
    }

    const channel = data.items[0];

    const item: SearchHistoryItem = {
      name: channel.snippet.title,
      subscribers: `${parseInt(channel.statistics.subscriberCount).toLocaleString()} subscribers`,
      profileImage: channel.snippet.thumbnails.default.url,
      url,
    };

    setSearchHistory((prev) => [...prev, item]);

    navigation.navigate('Youtube', {
      channelUrl: url,
      snapshotId: '',
    });
  } catch (err: any) {
    console.error('YouTube API error:', err);
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
      <Text style={styles.subtitle}>Discover insights about any YouTube channel</Text>
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
        <Text style={[styles.errorText, { marginBottom: 12 }]}>{errorMessage}</Text>
      )}

      <Text style={styles.exampleTitle}>Example: https://youtube.com/@mkbhd</Text>

      <Text style={styles.sectionTitle}>Popular Channels</Text>
      <View style={styles.popularChannelsContainer}>
        {popularChannels.map((channel, idx) => (
          <TouchableOpacity key={idx} onPress={() => handlePopularChannelClick(channel)}>
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
              <Image source={{ uri: item.profileImage }} style={styles.searchHistoryAvatar} />
            ) : (
              <View style={styles.avatar} />
            )}
            <View>
              <Text style={styles.searchHistoryName}>{item.name}</Text>
              <Text style={styles.searchHistorySubscribers}>{item.subscribers}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No search history yet.</Text>
      )}
    </ScrollView>
  );
}
