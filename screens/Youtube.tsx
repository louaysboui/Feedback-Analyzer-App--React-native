import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, Image, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const POPULAR_CHANNELS = [
  { id: 'mkbhd', name: 'MKBHD' },
  { id: 'veritasium', name: 'Veritasium' },
  { id: 'mrbeast', name: 'MrBeast' },
];

const RECENT_SEARCHES = [
  { id: 'linustechtips', name: 'Linus Tech Tips', subscribers: '15M', profile_image: 'https://yt3.ggpht.com/ytc/AMLnZu_...' },
  { id: 'teded', name: 'TED-Ed', subscribers: '10M', profile_image: 'https://yt3.ggpht.com/ytc/AMLnZu_...' },
];

const YouTubeScreen = () => {
  const [url, setUrl] = useState('');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="youtube" size={32} color="red" />
        <Text style={styles.headerTitle}>YouTube Analyzer</Text>
      </View>

      <ScrollView>
        {/* Search Input */}
        <View style={styles.searchBox}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="Paste YouTube channel URL"
            placeholderTextColor="#6B7280"
            style={styles.input}
          />
          <Pressable style={styles.analyzeButton}>
            <Text style={styles.analyzeText}>Analyze</Text>
          </Pressable>
        </View>
        <Text style={styles.exampleText}>Example: https://youtube.com/@mkbhd</Text>

        {/* Popular Channels */}
        <Text style={styles.sectionTitle}>Popular Channels</Text>
        <FlatList
          data={POPULAR_CHANNELS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.popularChannel}>
              <Text style={styles.popularText}>{item.name}</Text>
            </Pressable>
          )}
        />

        {/* Recent Searches */}
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        <FlatList
          data={RECENT_SEARCHES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.recentItem}>
              <Image source={{ uri: item.profile_image }} style={styles.profileImage} />
              <View>
                <Text style={styles.channelName}>{item.name}</Text>
                <Text style={styles.subscribers}>{item.subscribers} subscribers</Text>
              </View>
            </Pressable>
          )}
        />
      </ScrollView>
    </View>
  );
};

export default YouTubeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: 'black',
  },
  analyzeButton: {
    backgroundColor: 'red',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  analyzeText: {
    color: 'white',
    fontWeight: 'bold',
  },
  exampleText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  popularChannel: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  popularText: {
    color: '#333',
    fontWeight: 'bold',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  channelName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subscribers: {
    fontSize: 12,
    color: '#6B7280',
  },
});
