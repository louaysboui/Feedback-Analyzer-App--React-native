import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  processColor,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { PieChart, LineChart } from 'react-native-charts-wrapper';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from "../../../lib/supabase";
import { useAuth } from '../../components/AuthContext';
import Colors from '../../constants/Colors';

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

// Convert colors for line chart
const primaryColorInt = convertHexToArgb(Colors.primary);
const fillColorHex = Colors.primary + '66'; // semi-transparent fill
const fillColorInt = convertHexToArgb(fillColorHex);

interface Feedback {
  id: number;
  content: string;
  sentiment: string;
  is_favorite: boolean;
  created_at: string;
}

const DashboardScreen = () => {
  const { user } = useAuth();
  const [feedbacksData, setFeedbacksData] = useState<Feedback[]>([]);

  useEffect(() => {
    if (user) {
      fetchFeedbacks(user);
    }
  }, [user]);

  const fetchFeedbacks = async (user: any) => {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      setFeedbacksData(data || []);
    }
  };

  const totalFeedbacks = feedbacksData.length;
  const positiveFeedbacks = feedbacksData.filter(f => f.sentiment === 'positive').length;
  const negativeFeedbacks = totalFeedbacks - positiveFeedbacks;

  // Pie Chart Data
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
        valueTextColor: convertHexToArgb('#ffffff'), // text color on slice
        sliceSpace: 2,
      },
    },
  ];
  const pieData = { dataSets: pieDataSets };

  // Line Chart Data
  const getMonthYear = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const getMonthYearLabel = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const feedbacksGroupedByMonth = feedbacksData.reduce(
    (acc: { [key: string]: { count: number; label: string } }, feedback) => {
      const monthYear = getMonthYear(feedback.created_at);
      const label = getMonthYearLabel(feedback.created_at);
      if (!acc[monthYear]) acc[monthYear] = { count: 0, label };
      acc[monthYear].count++;
      return acc;
    },
    {}
  );

  const sortedLineChartData = Object.keys(feedbacksGroupedByMonth)
    .sort()
    .map(monthYear => ({
      x: monthYear,
      y: feedbacksGroupedByMonth[monthYear].count,
      label: feedbacksGroupedByMonth[monthYear].label,
    }));

  const chartData = sortedLineChartData.map((item, index) => ({ x: index, y: item.y }));
  const xAxisLabels = sortedLineChartData.map(item => item.label);

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
      {/* Scrollable container */}
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
          <Text style={styles.sectionTitle}>Sentiment Distribution</Text>
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

        {/* Line Chart Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Feedback Count Over Time</Text>
          <LineChart
            style={styles.chart}
            data={{
              dataSets: [
                {
                  values: chartData,
                  label: 'Feedback Count',
                  config: {
                    color: primaryColorInt,
                    lineWidth: 2,
                    drawFilled: true,
                    fillColor: fillColorInt,
                    valueTextSize: 12,
                    valueTextColor: processColor('#000'),
                  },
                },
              ],
            }}
            xAxis={{
              valueFormatter: xAxisLabels,
              labelCount: xAxisLabels.length,
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
            borderColor={processColor('teal')}
            borderWidth={1}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  scrollContentContainer: {
    padding: 10,
    paddingBottom: 80, // Extra bottom padding so charts or content won't be hidden by the tab
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  noDataText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    color: Colors.primary,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  statText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: Colors.text,
    marginTop: 5,
  },
  chart: {
    height: 220,
    marginTop: 10,
  },
});

export default DashboardScreen;
