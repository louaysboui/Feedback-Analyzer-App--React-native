import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Animated,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../components/AuthContext';
import Colors from '../../constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import Sound from 'react-native-sound';

// Define the navigation stack
type RootStackParamList = {
  Feedback: undefined;
  Notification: undefined;
};

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
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [negativeCount, setNegativeCount] = useState(0);
  const [lastCheckedNegativeCount, setLastCheckedNegativeCount] = useState(0);
  const lastNotifiedCount = useRef(0);
  const [isCriticalModalVisible, setIsCriticalModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playSound = () => {
    if (soundEnabled) {
      const beep = new Sound('beep.mp3', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Failed to load sound', error);
          return;
        }
        beep.play();
      });
    }
  };

  const fetchFeedbacks = async (user: any) => {
    if (!user) return;

    const userId = user.id;
    try {
      const { data: userFeedback, error: feedbackError } = await supabase
        .from('feedbacks')
        .select('*')
        .eq('user_id', userId);

      const { data: twitterFeedback, error: twitterError } = await supabase
        .from('twitter_feedback')
        .select('id, date, user, text, sentiment, user_id')
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (feedbackError || twitterError) {
        console.error('Error fetching feedbacks:', feedbackError || twitterError);
        return;
      }

      const combinedFeedbacks: Feedback[] = [
        ...(userFeedback || []).map((fb) => ({
          ...fb,
          source: 'user',
          created_at: fb.created_at || new Date().toISOString(),
        })),
        ...(twitterFeedback || []).map((fb) => ({
          id: fb.id,
          source: 'twitter',
          created_at: fb.date || new Date().toISOString(),
          sentiment: fb.sentiment || 'pending',
          user: fb.user,
          text: fb.text,
          user_id: fb.user_id,
        })),
      ];

      const negative = combinedFeedbacks.filter((f) => f.sentiment === 'negative').length;
      setNegativeCount(negative);

      if (negative > threshold && negative > lastNotifiedCount.current) {
        const newNotification = {
          id: Date.now(),
          message: `Critical Alert: ${negative} negative feedbacks exceed threshold of ${threshold}`,
          timestamp: new Date().toLocaleString(),
        };
        setNotifications((prev) => [...prev, newNotification]);
        setIsCriticalModalVisible(true);
        playSound();
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
        lastNotifiedCount.current = negative;
      }
      setLastCheckedNegativeCount(negative);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleThresholdChange = (value: number) => {
    setThreshold(Math.round(value));
    if (negativeCount > Math.round(value) && negativeCount > lastNotifiedCount.current) {
      const newNotification = {
        id: Date.now(),
        message: `Critical Alert: ${negativeCount} negative feedbacks exceed new threshold of ${Math.round(value)}`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [...prev, newNotification]);
      setIsCriticalModalVisible(true);
      playSound();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      lastNotifiedCount.current = negativeCount;
    }
  };

  const handleRefresh = () => {
    if (user) fetchFeedbacks(user);
  };

  const deleteNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    lastNotifiedCount.current = 0;
    setIsCriticalModalVisible(false);
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const dismissCriticalModal = () => {
    setIsCriticalModalVisible(false);
    Animated.timing(slideAnim, {
      toValue: -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const channels = [
      supabase
        .channel('feedbacks-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedbacks', filter: `user_id=eq.${userId}` },
          (payload) => {
            fetchFeedbacks(user);
          }
        )
        .subscribe(),
      supabase
        .channel('twitter_feedback-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'twitter_feedback', filter: `user_id=eq.${userId}` },
          (payload) => {
            fetchFeedbacks(user);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'twitter_feedback', filter: 'user_id=is.null' },
          (payload) => {
            fetchFeedbacks(user);
          }
        )
        .subscribe(),
    ];

    fetchFeedbacks(user);

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          Critical Threshold: {threshold} {negativeCount > threshold && '(Exceeded)'}
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={20}
          step={1}
          value={threshold}
          onValueChange={handleThresholdChange}
          minimumTrackTintColor={negativeCount > threshold ? '#FF3B30' : Colors.primary}
          maximumTrackTintColor="#ddd"
          thumbTintColor={negativeCount > threshold ? '#FF3B30' : Colors.primary}
        />
      </View>
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Check for Updates</Text>
      </TouchableOpacity>
      {notifications.length > 0 && (
        <Animated.View
          style={[
            styles.notificationCount,
            {
              transform: [
                {
                  scale: notifications.length > lastNotifiedCount.current
                    ? slideAnim.interpolate({
                        inputRange: [-300, 0],
                        outputRange: [1, 1.2],
                      })
                    : 1,
                },
              ],
            },
          ]}
        >
          <Text style={styles.notificationCountText}>{notifications.length} Alerts</Text>
        </Animated.View>
      )}
      <Modal
        transparent={true}
        visible={isCriticalModalVisible}
        animationType="none"
        onRequestClose={dismissCriticalModal}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.modalContent}>
            <Icon name="alert-circle" size={40} color="#FF3B30" />
            <Text style={styles.modalTitle}>Critical Alert!</Text>
            <Text style={styles.modalMessage}>
              {notifications.length > 0 ? notifications[notifications.length - 1].message : 'Negative feedbacks exceed threshold.'}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={clearAllNotifications}>
                <Text style={styles.modalButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Modal>
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
      {notifications.length > 0 && (
        <TouchableOpacity style={styles.clearAllButton} onPress={clearAllNotifications}>
          <Text style={styles.clearAllButtonText}>Clear All Alerts</Text>
        </TouchableOpacity>
      )}
      <View style={styles.soundToggle}>
        <Text style={styles.sliderLabel}>Sound Alerts</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: '#767577', true: Colors.primary }}
          thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  sliderContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
  },
  refreshButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 16,
  },
  notificationCount: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notificationCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationText: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 16,
    color: '#333',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#aaa',
    fontSize: 16,
  },
  clearAllButton: {
    backgroundColor: '#FF4444',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
    width: '90%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginVertical: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  soundToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginTop: 10,
  },
});

export default NotificationScreen;