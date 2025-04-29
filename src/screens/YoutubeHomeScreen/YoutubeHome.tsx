import React, { useState } from 'react';
import {
  Text,
  View,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { styles } from './YoutubehomeStyles';

export default function YoutubeHome() {
  const [url, setUrl] = useState('');  
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<
    { name: string; subscribers: string }[]
  >([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const popularChannels = ['MKBHD', 'Veritasium', 'Fireship', 'Kurzgesagt'];

  const startAnalyzing = async () => {
    setErrorMessage(null);
    try {
      const response = await fetch(
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

      const data = await response.json();
      console.log('trigger response:', data);

      // BrightData trigger returns { snapshot_id } on success,
      // or { status: 'error', message: '…' } if something went wrong.
      if (!response.ok || data.status === 'error' || data.error) {
        const msg =
          data.message ??
          data.error ??
          response.statusText ??
          'Unknown error';
        console.log('Trigger error:', msg);
        setErrorMessage(msg);
        return;
      }

      const snapshotId: string = data.snapshot_id;
      console.log('snapshot_id:', snapshotId);

      // Add to search history
      setSearchHistory((prev) => [
        ...prev,
        { name: url, subscribers: '' },
      ]);

      // Navigate to Youtube screen—pass both URL & snapshotId
      navigation.navigate('Youtube', {
        channelUrl: url,
        snapshotId,
      });
    } catch (err: any) {
      console.log('Network or parsing error:', err);
      setErrorMessage(err.message || 'Request failed');
    }
  };

  const handlePopularChannelClick = (channel: string) => {
    const aboutUrl = `https://www.youtube.com/@${channel.toLowerCase()}/about`;
    setUrl(aboutUrl);
    // you could auto-start analyzing here, or let user tap Analyze
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
            <View style={styles.avatar} />
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
