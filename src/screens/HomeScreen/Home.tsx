import React, { useState } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import axios from 'axios';
import { useAuth } from '../../components/AuthContext';
import CustomButton from '../../components/CustomButton';
import AppTextInput from '../../components/AppTextInput';
import { styles } from './HomeStyles';
import { RootStackParamList } from '../../../App';

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<HomeProps> = () => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'https://louaysboui-sentiment-anlaysis-twitter-improved.hf.space/predict';
  

  const analyze = async () => {
    if (!text.trim()) {
      setError('Please enter some text.');
      return;
    }
    setLoading(true);
    setError(null);
    setSentiment('');
    setConfidence(null);

    try {
      console.log('Sending request to:', API_URL);
      console.log('Payload:', { data: [text] });

      const response = await axios.post(
        API_URL,
        { data: [text] },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('API response:', response.data);

      // Parse the response: { "data": [{ "label": string, "confidences": [...] }] }
      const responseData = response.data.data?.[0];
      if (!responseData || !responseData.label || !responseData.confidences) {
        throw new Error('Unexpected API response format');
      }

      const sentimentValue = responseData.label;
      const confidenceValue = responseData.confidences.find(
        (c: { label: string; confidence: number }) => c.label === sentimentValue
      )?.confidence;

      if (confidenceValue === undefined) {
        throw new Error('Confidence value not found in response');
      }

      setSentiment(sentimentValue === 'POSITIVE' ? 'Positive' : 'Negative');
      setConfidence(confidenceValue);
    } catch (e: any) {
      console.error('API error details:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e.message,
      });
      setError(
        e.response?.data?.error ||
        e.response?.data?.detail ||
        e.message ||
        'Failed to analyze sentiment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.name || 'User'}!
        </Text>
      </View>

      <Text style={styles.title}>Feedback Analyzer</Text>
      <Text style={styles.description}>
        Transform your feedback into clear, actionable sentiment—making every
        opinion count.
      </Text>

      <AppTextInput
        placeholder="Enter your feedback here..."
        value={text}
        onChangeText={setText}
        multiline
        editable={!loading}
      />

      <CustomButton
        title={loading ? 'Analyzing...' : 'Analyze'}
        onPress={analyze}
        disabled={loading}
      />

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}

      {!!sentiment && !loading && (
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
          {confidence !== null && (
            <Text style={styles.result}>
              {' (Confidence: ' + confidence.toFixed(2) + ')'}
            </Text>
          )}
        </Text>
      )}

      {error && (
        <Text style={[styles.result, { color: 'red' }]}>
          Error: {error}
        </Text>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;