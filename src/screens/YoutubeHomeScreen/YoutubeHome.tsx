import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import { styles } from './YoutubehomeStyles';

type SearchHistoryItem = {
  id: string;
  channel_handle: string;
  channel_url: string;
};

export default function YoutubeHome() {
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const popularChannels = ['MKBHD', 'Veritasium', 'Fireship', 'Kurzgesagt'];

  const addToSearchHistory = (handle: string, channelUrl: string) => {
    console.log('Adding to search history:', { handle, channelUrl });
    const newItem: SearchHistoryItem = {
      id: Date.now().toString(), // Simple unique ID
      channel_handle: handle,
      channel_url: channelUrl,
    };
    setSearchHistory((prev) => {
      // Avoid duplicates
      const filtered = prev.filter(
        (item) => item.channel_url !== channelUrl
      );
      return [newItem, ...filtered].slice(0, 10); // Limit to 10 items
    });
  };

  const deleteSelectedChannels = () => {
    console.log('Deleting channels:', selectedChannels);
    setSearchHistory((prev) =>
      prev.filter((item) => !selectedChannels.includes(item.id))
    );
    setSelectedChannels([]);
    Alert.alert('Success', 'Selected channels deleted');
  };

  const startAnalyzing = async () => {
    setErrorMessage(null);
    try {
      const handleMatch = url.match(/youtube\.com\/@([\w\-]+)/);
      const channelHandle = handleMatch ? handleMatch[1] : null;
      if (!channelHandle) throw new Error('Invalid channel URL');

      console.log('Starting analysis for:', channelHandle);
      // Step 1: Search to get channelId
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${channelHandle}&key=${process.env.YOUTUBE_API_KEY}`
      );
      const searchData = await searchRes.json();
      if (!searchData.items || searchData.items.length === 0) {
        throw new Error('Channel not found during search');
      }

      const channelId = searchData.items[0].snippet.channelId;
      console.log('Found channel ID:', channelId);

      // Step 2: Get channel details using channelId
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      if (!res.ok || !data.items || !data.items.length) {
        throw new Error('Channel not found via YouTube API');
      }

      addToSearchHistory(`@${channelHandle}`, url);
      console.log('Navigating to Youtube screen with URL:', url);
      navigation.navigate('Youtube', { channelUrl: url });
    } catch (err: any) {
      console.error('YouTube API error:', err.message);
      setErrorMessage(err.message || 'Unexpected error');
      Alert.alert('Error', err.message || 'Failed to analyze channel');
    }
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    console.log('History item clicked:', item.channel_handle);
    navigation.navigate('Youtube', { channelUrl: item.channel_url });
  };

  const handlePopularChannelClick = (channel: string) => {
    const channelUrl = `https://www.youtube.com/@${channel}`;
    console.log('Popular channel clicked:', channel);
    setUrl(channelUrl);
  };

  const toggleSelectChannel = (id: string) => {
    console.log('Toggling channel selection:', id);
    setSelectedChannels((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
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
          <TouchableOpacity
            key={idx}
            onPress={() => handlePopularChannelClick(channel)}
          >
            <Text style={styles.popularChannelText}>{channel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Channels</Text>
        {selectedChannels.length > 0 && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deleteSelectedChannels}
          >
            <Text style={styles.deleteButtonText}>Delete Selected</Text>
          </TouchableOpacity>
        )}
        {searchHistory.length > 0 ? (
          searchHistory.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.searchHistoryItem,
                selectedChannels.includes(item.id) && styles.selectedHistoryItem,
              ]}
              onPress={() => handleHistoryClick(item)}
              onLongPress={() => toggleSelectChannel(item.id)}
            >
              <View style={styles.avatarPlaceholder} />
              <View>
                <Text style={styles.searchHistoryName}>{item.channel_handle}</Text>
              </View>
              {selectedChannels.includes(item.id) && (
                <Text style={styles.selectedIcon}>✓</Text>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noHistoryText}>No recent channels.</Text>
        )}
      </View>
    </ScrollView>
  );
}