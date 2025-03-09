import { Text, View, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App'; // Adjust the import path as necessary
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
import { styles } from './YoutubehomeStyles';



export default function YoutubeHome() {
  const [channelUrl, setChannelUrl] = useState('');
  const [searchHistory, setSearchHistory] = useState<{ name: string, subscribers: string }[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const popularChannels = ["MKBHD", "Veritasium", "Fireship", "Kurzgesagt"];

  
const [url ,setUrl]= useState('');

  const startAnalyzing = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/trigger_collection-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      console.log('data :', data);
    } catch (error) {
      console.log('error :', error);
    }
  };

  const handleSearch = () => {
    if (channelUrl) {
      setSearchHistory([...searchHistory, { name: `Channel ${searchHistory.length + 1}`, subscribers: "2.5M subscribers" }]);
      setChannelUrl('');
      navigation.navigate('Youtube', { channelUrl: "https://www.youtube.com/@jaidenanimations/about" });
    }
  };

  const handlePopularChannelClick = (channel: string) => {
    navigation.navigate('Youtube', { channelUrl: `https://www.youtube.com/@${channel.toLowerCase()}` });
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
        <TouchableOpacity style={styles.button} onPress={startAnalyzing}>
          <Text style={styles.buttonText}>Analyze</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.exampleTitle}>Example: https://youtube.com/@mkbhd</Text>

      <Text style={styles.sectionTitle}>Popular Channels</Text>
      <View style={styles.popularChannelsContainer}>
        {popularChannels.map((channel, index) => (
          <TouchableOpacity key={index} onPress={() => handlePopularChannelClick(channel)}>
            <Text style={styles.popularChannelText}>
              {channel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Searches</Text>
      {searchHistory.length > 0 ? (
        searchHistory.map((channel, index) => (
          <View key={index} style={styles.searchHistoryItem}>
            <View style={styles.avatar} />
            <View>
              <Text style={styles.searchHistoryName}>{channel.name}</Text>
              <Text style={styles.searchHistorySubscribers}>{channel.subscribers}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noHistoryText}>No search history yet.</Text>
      )}
    </ScrollView>
  );
}