import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  processColor
} from 'react-native';
import { PieChart, LineChart } from 'react-native-charts-wrapper';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from "../../../lib/supabase";
import { useAuth } from '../../components/AuthContext';
import Colors from '../../constants/Colors';
import styles from './DashboardStyles';

// Function to convert hex color to ARGB integer
const convertHexToArgb = (hex: string) => {
  hex = hex.replace('#', '');
  if (hex.length === 6) hex = 'FF' + hex; // Assume full alpha if 6 chars
  const a = parseInt(hex.substr(0, 2), 16);
  const r = parseInt(hex.substr(2, 2), 16);
  const g = parseInt(hex.substr(4, 2), 16);
  const b = parseInt(hex.substr(6, 2), 16);
  return (a << 24) | (r << 16) | (g << 8) | b;
};

interface Feedback {
  id: number;
  content?: string;
  sentiment?: string;
  created_at: string;
  source: 'user' | 'twitter';
  user_id?: string;
  date?: string;
  user?: string;
  text?: string;
}

const DashboardScreen = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    if (user) {
      fetchFeedbacks();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    if (!user) {
      console.error('No user authenticated');
      return;
    }

    const userId = user.id;

    // Fetch user feedback
    const { data: userFeedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId);

    // Fetch Twitter feedback (both assigned to the user and unassigned)
    const { data: twitterFeedback, error: twitterError } = await supabase
      .from('twitter_feedback')
      .select('id, date, user, text, sentiment, user_id')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('date', { ascending: false });

    if (feedbackError || twitterError) {
      console.error('Errors fetching feedbacks:', feedbackError || twitterError);
    }

    console.log('User Feedback:', userFeedback);
    console.log('Twitter Feedback:', twitterFeedback);

    const combinedFeedbacks: Feedback[] = [
      ...(userFeedback || []).map(fb => ({
        ...fb,
        source: 'user',
        created_at: fb.created_at || new Date().toISOString()
      })),
      ...(twitterFeedback || []).map(fb => ({
        id: fb.id,
        source: 'twitter',
        created_at: fb.date || new Date().toISOString(),
        sentiment: fb.sentiment || 'pending',
        user: fb.user,
        text: fb.text,
        user_id: fb.user_id
      }))
    ];
    setFeedbacks(combinedFeedbacks);
  };

  const totalFeedbacks = feedbacks.length;
  const positiveFeedbacks = feedbacks.filter(f => f.sentiment === 'positive').length;
  const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative').length;
  const pendingFeedbacks = feedbacks.filter(f => f.sentiment === 'pending').length;

  // Pie Chart Data (excluding pending)
  const pieChartData = [
    { value: positiveFeedbacks, label: 'Positive', color: '#4CD964' },
    { value: negativeFeedbacks, label: 'Negative', color: '#FF3B30' },
  ];
  const pieDataSets = [
    {
      values: pieChartData,
      label: 'Sentiment Distribution',
      config: {
        colors: pieChartData.map(item => convertHexToArgb(item.color)),
        drawValues: true,
        valueTextSize: 14,
        valueTextColor: convertHexToArgb('#ffffff'),
        sliceSpace: 2,
      },
    },
  ];
  const pieData = { dataSets: pieDataSets };

  // Sentiment trend calculation (excluding pending)
  const getSentimentTrends = () => {
    const grouped = feedbacks.reduce((acc: Record<string, { positive: number; negative: number }>, fb) => {
      if (fb.sentiment === 'pending') return acc; // Exclude pending
      const date = new Date(fb.created_at).toLocaleDateString();
      if (!acc[date]) acc[date] = { positive: 0, negative: 0 };
      acc[date][fb.sentiment === 'positive' ? 'positive' : 'negative']++;
      return acc;
    }, {});

    const dates = Object.keys(grouped).sort();
    return {
      positive: dates.map((d, i) => ({ x: i, y: grouped[d].positive })),
      negative: dates.map((d, i) => ({ x: i, y: grouped[d].negative })),
      labels: dates,
    };
  };

  const trends = getSentimentTrends();

  // Fallback for empty data
  if (totalFeedbacks === 0) {
    return (
      <View style={styles.containerCentered}>
        <Text style={styles.noDataText}>
          No feedback data available. Add some feedback to see statistics!
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        {/* Stats Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Feedback Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="chatbox" size={30} color={Colors.primary} />
              <Text style={styles.statText}>Total Feedbacks: {totalFeedbacks}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="happy" size={30} color="#4CD964" />
              <Text style={styles.statText}>Positive: {positiveFeedbacks}</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="sad" size={30} color="#FF3B30" />
              <Text style={styles.statText}>Negative: {negativeFeedbacks}</Text>
            </View>
          </View>
        </View>

        {/* Pie Chart Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sentiment Distribution (Analyzed)</Text>
          <PieChart
            style={styles.chart}
            data={pieData}
            chartDescription={{ text: '' }}
            legend={{
              enabled: true,
              textSize: 14,
              form: 'CIRCLE',
              formSize: 14,
              xEntrySpace: 10,
              yEntrySpace: 10,
              wordWrapEnabled: true,
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'BOTTOM',
            }}
            drawEntryLabels={true}
            entryLabelColor={processColor('#000')}   
            entryLabelTextSize={14}
            usePercentValues={false}
            holeRadius={40}
            transparentCircleRadius={45}
            rotationEnabled={false}
          />
        </View>

        {/* Sentiment Trend Line Chart Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Sentiment Trends Over Time (Analyzed)</Text>
          <LineChart
            style={styles.chart}
            data={{
              dataSets: [
                { values: trends.positive, label: 'Positive', config: { color: processColor('#4CD964'), lineWidth: 2 } },
                { values: trends.negative, label: 'Negative', config: { color: processColor('#FF3B30'), lineWidth: 2 } },
              ],
            }}
            xAxis={{
              valueFormatter: trends.labels,
              position: 'BOTTOM',
              granularityEnabled: true,
              granularity: 1,
              drawGridLines: false,
              textSize: 12,
            }}
            chartDescription={{ text: '' }}
            legend={{
              enabled: true,
              textSize: 14,
              form: 'LINE',
              horizontalAlignment: 'CENTER',
              verticalAlignment: 'BOTTOM',
            }}
            drawGridBackground={false}
            drawBorders={false}
            touchEnabled={true}
            dragEnabled={true}
            scaleEnabled={true}
            pinchZoom={true}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;