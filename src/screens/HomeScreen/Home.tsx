import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Alert,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../components/AuthContext';
import { getUserData } from '../../service/userService';
import { RootStackParamList } from '../../../App';
import { styles } from './HomeStyles.ts';
import CustomButton from '../../components/CustomButton'; // Import the new button component

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeProps> = ({ navigation }) => {
  // 1) Auth and user data
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);

  // 2) Sentiment analysis states
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState('');

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
          Welcome, {user?.name || 'User'}!
        </Text>
      </View>

      {/* Sentiment Analyzer UI */}
      <Text style={styles.title}>Feedback Analyzer</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your feedback here..."
        value={text}
        onChangeText={setText}
        multiline
      />

      {/* Custom Button */}
      <CustomButton title="Analyze" onPress={analyzeSentiment} />

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
