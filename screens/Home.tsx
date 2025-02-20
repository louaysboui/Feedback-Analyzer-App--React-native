import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import React, { useState } from 'react';
// Navigation
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type HomeProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function Home({ navigation }: HomeProps) {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState('');

  // Function to analyze sentiment
  const analyzeSentiment = () => {
    console.log("Analyzing sentiment..."); // Add a log to check if this function is being triggered
    const fakeSentiment = Math.random() > 0.5 ? 'Positif' : 'Négatif';
    setSentiment(fakeSentiment);
  };

  console.log("Rendering..."); // Check if this is printed
  return (
<View style={styles.container}>
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
          Sentiment: <Text style={{ ...styles.sentimentText, color: sentiment === 'Positif' ? 'green' : 'red' }}>
            {sentiment}
          </Text>
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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
