import { Text, View, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../App'; // Adjust the import path as necessary
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';



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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#ff0000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exampleTitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  popularChannelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  popularChannelText: {
    fontSize: 16,
    color: '#333',
    marginRight: 16,
    marginBottom: 8,
  },
  searchHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    marginRight: 12,
  },
  searchHistoryName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchHistorySubscribers: {
    fontSize: 14,
    color: 'gray',
  },
  noHistoryText: {
    fontSize: 16,
    color: 'gray',
  },
});