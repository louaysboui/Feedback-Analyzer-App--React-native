
/*import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const App = () => {
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
      <Text style={styles.title}>Analyse des Sentiments</Text>
      
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

export default App;*/

import * as React from 'react';



//navigationimports
import {NavigationContainer}from "@react-navigation/native";
import {createNativeStackNavigator}from "@react-navigation/native-stack";
import Home from './screens/Home';
import details from './screens/details';
import Explore from './screens/Explore';
import Dashboard from './screens/Dashboard';
import Login from './screens/Login';
import Bottombar from './components/Bottombar';
import Register from './screens/Register';

export type RootStackParamList ={
Home:undefined;
details:{productId:string};
Explore:undefined;
Dashboard:undefined;
Login:undefined;
Register:undefined;
Tabs: undefined;
Bottombar:undefined;
}
const Stack = createNativeStackNavigator<RootStackParamList>()

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Explore">
      {/* ✅ First, show Explore Screen */}
      <Stack.Screen 
          name="Explore" 
          component={Explore} 
          options={({ }) => ({
            headerShown: false, 
            title: "Explore",
          })}
        />
        {/* ✅ Then, show Bottom Tabs (Main Navigation) */}
        <Stack.Screen name="Tabs" component={Bottombar} />
        <Stack.Screen   name="Home"  component={Home} />
        <Stack.Screen   name="details"  component={details} options={{title:"products details"}}/>
        
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
    

    </Stack.Navigator>

      
    </NavigationContainer>
  );
};

export default App;


