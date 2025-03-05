import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Alert,
  TextInput,
  Button,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAuth } from '../components/AuthContext';
import { getUserData } from '../service/userService';
import { RootStackParamList } from '../App';

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeProps> = ({ navigation }) => {
  // 1) Auth and user data
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  // 2) Sentiment analysis states
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState('');

  // Fetch user data and show welcome alert
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const data = await getUserData(user.id);
        setUserData(data);
        if (data?.name) {
          Alert.alert('Welcome', `Welcome, ${data.name}!`);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Simple mock sentiment analysis
  const analyzeSentiment = () => {
    console.log('Analyzing sentiment...');
    const fakeSentiment = Math.random() > 0.5 ? 'Positif' : 'Négatif';
    setSentiment(fakeSentiment);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Notification / Welcome Section */}
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Welcome, {userData?.name || 'User'}!
        </Text>
      </View>

      {/* Sentiment Analyzer UI */}
      <Text style={styles.title}>Feedback Analyzer</Text>
      <TextInput
        style={styles.input}
        placeholder="Entrez votre texte ici"
        value={text}
        onChangeText={setText}
        multiline
      />
      <Button title="Analyser" onPress={analyzeSentiment} />

      {sentiment ? (
        <Text style={styles.result}>
          Sentiment:{' '}
          <Text
            style={[
              styles.sentimentText,
              { color: sentiment === 'Positif' ? 'green' : 'red' },
            ]}
          >
            {sentiment}
          </Text>
        </Text>
      ) : null}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  result: {
    marginTop: 20,
    fontSize: 18,
    textAlign: 'center',
  },
  sentimentText: {
    fontWeight: 'bold',
  },
});
