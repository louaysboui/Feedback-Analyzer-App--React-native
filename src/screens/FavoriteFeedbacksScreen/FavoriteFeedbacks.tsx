import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../../lib/supabase';
import styles from './../FeedbackListScreen/FeedbacklistStyles';

interface Feedback {
  id: number;
  content: string;
  sentiment: string;
  is_favorite: boolean;
}

const FavoriteFeedbacksScreen = () => {
  const [favoriteFeedbacks, setFavoriteFeedbacks] = useState<Feedback[]>([]);

  useEffect(() => {
    fetchFavoriteFeedbacks();
  }, []);

  const fetchFavoriteFeedbacks = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }
    const userId = user.id;
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true);
    if (error) {
      console.error('Error fetching favorite feedbacks:', error);
    } else {
      setFavoriteFeedbacks(data);
    }
  };

  const unfavorite = async (id: number) => {
    const { error } = await supabase
      .from('feedbacks')
      .update({ is_favorite: false })
      .eq('id', id);
    if (error) {
      console.error('Error unfavoriting feedback:', error);
    } else {
      setFavoriteFeedbacks(favoriteFeedbacks.filter(f => f.id !== id));
    }
  };

  const renderFavoriteFeedbackItem = ({ item }: { item: Feedback }) => {
    return (
      <View style={styles.feedbackItem}>
        <Text style={styles.feedbackContent}>{item.content}</Text>
        <Text
          style={[
            styles.sentiment,
            { color: item.sentiment === 'positive' ? '#4CD964' : '#FF3B30' },
          ]}
        >
          {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
        </Text>
        <TouchableOpacity onPress={() => unfavorite(item.id)} style={styles.unfavoriteButton}>
          <Icon name="star" size={20} color="#FFD700" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Favorite Feedbacks</Text>
      <FlatList
        data={favoriteFeedbacks}
        renderItem={renderFavoriteFeedbackItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No favorite feedbacks yet.</Text>
          </View>
        )}
      />
    </View>
  );
};

styles.unfavoriteButton = {
  position: 'absolute',
  top: 10,
  right: 10,
};

export default FavoriteFeedbacksScreen;