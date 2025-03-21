import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { styles } from './AboutStyles';

const AboutScreen = () => {
  const [totalFeedbacks, setTotalFeedbacks] = useState(0);

  useEffect(() => {
    const fetchTotalFeedbacks = async () => {
      const { data, error } = await supabase
        .from('feedbacks')
        .select('id', { count: 'exact' });
      if (error) {
        console.error(error);
        return;
      }
      setTotalFeedbacks(data.length);
    };
    fetchTotalFeedbacks();
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/logo1.png')} 
          style={styles.logo} 
        />
      </View>
      {/* About Information */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>About Our Application</Text>
        <Text style={styles.text}>
          This application collects and analyzes user feedback from social media platforms such as X, Facebook, Instagram, and YouTube.
        </Text>
        <Text style={styles.text}>
          It uses advanced NLP and AI techniques to classify sentiments and provide real-time insights.
        </Text>
        <Text style={styles.text}>Version: 1.0.0</Text>
        <Text style={styles.text}>Developed by Louay Sboui</Text>
        <Text style={styles.text}>Total Feedbacks: {totalFeedbacks}</Text>
      </View>
    </View>
  );
};

export default AboutScreen;
