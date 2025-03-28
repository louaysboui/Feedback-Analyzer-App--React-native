import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from "../../../lib/supabase"; // Adjust path to your Supabase config
import { useAuth } from '../../components/AuthContext'; // Adjust path to your auth context
import Colors from '../../constants/Colors'; // Adjust path to your color constants
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './NotificationStyles'; // Adjust path to your styles

// Feedback interface
interface Feedback {
  id: number;
  content: string;
  sentiment: string;
  created_at: string;
}

// Notification interface
interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const NotificationScreen = () => {
  const { user } = useAuth(); // Get the authenticated user
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threshold, setThreshold] = useState(5); // Default critical threshold
  const [negativeCount, setNegativeCount] = useState(0);
  const [lastCheckedNegativeCount, setLastCheckedNegativeCount] = useState(0); // Track last checked count

  // Fetch feedback data when the user is available
  useEffect(() => {
    if (user) fetchFeedbacks(user);
  }, [user]);

  // Fetch feedbacks and generate notifications only for new negative feedbacks
  const fetchFeedbacks = async (user: any) => {
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', user.id);
    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      const negative = data.filter((f: Feedback) => f.sentiment === 'negative').length;
      setNegativeCount(negative);

      // Generate notification only if negative count increased and exceeds threshold
      if (negative > threshold && negative > lastCheckedNegativeCount) {
        const newNotification = {
          id: Date.now(),
          message: `Negative feedbacks (${negative}) exceed the threshold of ${threshold}`,
          timestamp: new Date().toLocaleString(),
        };
        setNotifications((prev) => [...prev, newNotification]);
      }
      setLastCheckedNegativeCount(negative); // Update last checked count
    }
  };

  // Handle threshold changes and check for notifications
  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    // Check if current negative count exceeds the new threshold
    if (negativeCount > value && negativeCount > lastCheckedNegativeCount) {
      const newNotification = {
        id: Date.now(),
        message: `Negative feedbacks (${negativeCount}) exceed the new threshold of ${value}`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [...prev, newNotification]);
      setLastCheckedNegativeCount(negativeCount);
    }
  };

  // Handle refresh to check for new feedbacks
  const handleRefresh = () => {
    if (user) fetchFeedbacks(user);
  };

  // Delete a single notification
  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>

      {/* Slider for adjusting the critical threshold */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Critical Threshold: {threshold}</Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={threshold}
          onValueChange={handleThresholdChange}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor="#ddd"
          thumbTintColor={Colors.primary}
        />
      </View>

      {/* Refresh button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Check for Updates</Text>
      </TouchableOpacity>

      {/* Notification count badge */}
      {notifications.length > 0 && (
        <View style={styles.notificationCount}>
          <Text style={styles.notificationCountText}>{notifications.length} Alerts</Text>
        </View>
      )}

      {/* List of notifications */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.notificationItem}>
            <Icon name="alert-circle" size={24} color="#FF3B30" style={styles.notificationIcon} />
            <View style={styles.notificationText}>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationTimestamp}>{item.timestamp}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteNotification(item.id)}>
              <Icon name="trash" size={20} color="#aaa" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Icon name="notifications-off" size={40} color="#aaa" />
            <Text style={styles.emptyStateText}>No notifications yet.</Text>
          </View>
        )}
      />

      {/* Clear all notifications button */}
      {notifications.length > 0 && (
        <TouchableOpacity style={styles.clearAllButton} onPress={clearAllNotifications}>
          <Text style={styles.clearAllButtonText}>Clear All Alerts</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};



export default NotificationScreen;