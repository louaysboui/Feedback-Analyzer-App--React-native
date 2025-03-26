import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from "../../../lib/supabase";
import { useAuth } from '../../components/AuthContext';
import { PieChart, LineChart } from 'react-native-charts-wrapper';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';

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
const fillColorHex = Colors.primary + '66';
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
    if (user) fetchFeedbacks(user);
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

  const feedbacksGroupedByMonth = feedbacksData.reduce((acc: { [key: string]: { count: number; label: string; } }, feedback) => {
    const monthYear = getMonthYear(feedback.created_at);
    const label = getMonthYearLabel(feedback.created_at);
    if (!acc[monthYear]) acc[monthYear] = { count: 0, label };
    acc[monthYear].count++;
    return acc;
  }, {});

  const sortedLineChartData = Object.keys(feedbacksGroupedByMonth).sort().map(monthYear => ({
    x: monthYear,
    y: feedbacksGroupedByMonth[monthYear].count,
    label: feedbacksGroupedByMonth[monthYear].label,
  }));

  const chartData = sortedLineChartData.map((item, index) => ({ x: index, y: item.y }));
  const xAxisLabels = sortedLineChartData.map(item => item.label);

  // Fallback for empty data
  if (totalFeedbacks === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 16, color: Colors.text }}>
          No feedback data available. Add some feedback to see statistics!
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: '#fff' }}>
      <View style={{ padding: 10, marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.primary, marginVertical: 5, textAlign: 'center', fontSize: 20 }}>
          Feedback Statistics
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}>
            <Icon name="chatbox" size={30} color={Colors.primary} />
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: Colors.text }}>
              Total Feedbacks: {totalFeedbacks}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Icon name="happy" size={30} color="#4CD964" />
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: Colors.text }}>
              Positive Feedbacks: {positiveFeedbacks}
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Icon name="sad" size={30} color="#FF3B30" />
            <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: Colors.text }}>
              Negative Feedbacks: {negativeFeedbacks}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ padding: 10, marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.primary, marginVertical: 5, textAlign: 'center', fontSize: 20 }}>
          Sentiment Distribution
        </Text>
        <PieChart
          style={{ height: 200 }}
          data={pieData}
          description={{ text: '' }}
          legend={{ enabled: true, textSize: 14 }}
        />
      </View>
      <View style={{ padding: 10, marginVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd' }}>
        <Text style={{ fontFamily: 'Poppins-Bold', color: Colors.primary, marginVertical: 5, textAlign: 'center', fontSize: 20 }}>
          Feedback Count Over Time
        </Text>
        <LineChart
          style={{ height: 200 }}
          data={{
            dataSets: [{
              values: chartData,
              label: 'Feedback Count',
              config: {
                color: primaryColorInt,
                lineWidth: 2,
                drawFilled: true,
                fillColor: fillColorInt,
              },
            }],
          }}
          xAxis={{
            valueFormatter: xAxisLabels,
            labelCount: xAxisLabels.length,
            position: 'BOTTOM',
            granularityEnabled: true,
            granularity: 1,
          }}
          description={{ text: '' }}
          legend={{ enabled: true, textSize: 14 }}
        />
      </View>
    </View>
  );
};

export default DashboardScreen;