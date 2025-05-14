import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from "../../../lib/supabase";
import { useAuth } from '../../components/AuthContext';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';
import styles from './NotificationStyles';

interface Feedback {
  id: number;
  content?: string;
  sentiment?: string;
  created_at?: string;
  source: 'user' | 'twitter';
  user_id?: string;
  date?: string;
  user?: string;
  text?: string;
}

interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

const NotificationScreen = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threshold, setThreshold] = useState(5); // Default critical threshold
  const [negativeCount, setNegativeCount] = useState(0);
  const [lastCheckedNegativeCount, setLastCheckedNegativeCount] = useState(0); // Track last checked count
  const lastNotifiedCount = useRef(0); // Use ref to track last notified count across renders

  // Fetch feedbacks from both tables
  const fetchFeedbacks = async (user: any) => {
    if (!user) return;

    const userId = user.id;
    try {
      // Fetch user feedbacks
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', userId);

      // Fetch Twitter feedbacks (owned or unassigned)
      const { data: twitterFeedback, error: twitterError } = await supabase
        .from('twitter_feedback')
        .select('id, date, user, text, sentiment, user_id')
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (feedbackError || twitterError) {
        console.error('Error fetching feedbacks:', feedbackError || twitterError);
        return;
      }

      const combinedFeedbacks: Feedback[] = [
        ...(userFeedback || []).map(fb => ({
          ...fb,
          source: 'user',
          created_at: fb.created_at || new Date().toISOString(),
        })),
        ...(twitterFeedback || []).map(fb => ({
          id: fb.id,
          source: 'twitter',
          created_at: fb.date || new Date().toISOString(),
          sentiment: fb.sentiment || 'pending',
          user: fb.user,
          text: fb.text,
          user_id: fb.user_id,
        })),
      ];

      const negative = combinedFeedbacks.filter(f => f.sentiment === 'negative').length;
      setNegativeCount(negative);

      // Generate notification only if negative count increased beyond threshold and not already notified
      if (negative > threshold && negative > lastNotifiedCount.current) {
        const newNotification = {
          id: Date.now(),
          message: `Negative feedbacks (${negative}) exceed the threshold of ${threshold}`,
          timestamp: new Date().toLocaleString(),
        };
        setNotifications((prev) => [...prev, newNotification]);
        lastNotifiedCount.current = negative; // Update last notified count
      }
      setLastCheckedNegativeCount(negative); // Update last checked count
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  // Handle threshold changes and check for notifications
  const handleThresholdChange = (value: number) => {
    setThreshold(Math.round(value)); // Round to nearest integer
    if (negativeCount > Math.round(value) && negativeCount > lastNotifiedCount.current) {
      const newNotification = {
        id: Date.now(),
        message: `Negative feedbacks (${negativeCount}) exceed the new threshold of ${Math.round(value)}`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [...prev, newNotification]);
      lastNotifiedCount.current = negativeCount; // Update last notified count
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
    lastNotifiedCount.current = 0; // Reset last notified count
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const channels = [
      supabase
        .channel('feedbacks-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feedbacks', filter: `user_id=eq.${userId}` }, (payload) => {
          fetchFeedbacks(user);
        })
        .subscribe(),
      supabase
        .channel('twitter_feedback-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'twitter_feedback', filter: `user_id=eq.${userId}` }, (payload) => {
          fetchFeedbacks(user);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'twitter_feedback', filter: 'user_id=is.null' }, (payload) => {
          fetchFeedbacks(user);
        })
        .subscribe(),
    ];

    // Initial fetch
    fetchFeedbacks(user);

    // Cleanup subscriptions on unmount
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

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