import React, { useEffect, useState, memo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../../lib/supabase';
import styles from './FeedbacklistStyles';
import Colors from '../../constants/Colors';
import { NavigationProp } from '@react-navigation/native';
import { useAuth } from '../../components/AuthContext';

interface Feedback {
  id: number;
  content?: string;
  sentiment?: string;
  is_favorite?: boolean | null;
  created_at?: string;
  source: 'user' | 'twitter';
  user_id?: string;
  feedback_id?: string;
  date?: string;
  user?: string;
  text?: string;
}

interface FeedbacksScreenProps {
  navigation: NavigationProp<any>;
}

const API_URL = 'https://louaysboui-sentiment-anlaysis-twitter-improved.hf.space/predict';

// Memoized Feedback Item Component to prevent unnecessary re-renders
const FeedbackItem = memo(({ item, isSelected, onToggleSelection, onToggleFavorite, onHandleEdit, onAnalyzeSentiment, onSaveFeedback, onDeleteFeedback }: { 
  item: Feedback, 
  isSelected: boolean, 
  onToggleSelection: (id: number) => void, 
  onToggleFavorite: (id: number, currentStatus: boolean) => void, 
  onHandleEdit: (feedback: Feedback) => void, 
  onAnalyzeSentiment: (id: number, text: string) => void,
  onSaveFeedback: (id: number) => void,
  onDeleteFeedback: (id: number) => void
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => onToggleSelection(item.id)}
      onPress={() => onToggleSelection(item.id)}
      style={[styles.feedbackItem, isSelected && { backgroundColor: '#d0ebff' }]}
    >
      <View style={styles.feedbackRow}>
        <Text style={styles.feedbackContent}>
          {item.source === 'user' ? item.content : `${item.text} (by ${item.user}, ${new Date(item.date!).toLocaleDateString()})`}
          {item.source === 'twitter' && ' (Twitter)'}
        </Text>
        <Text
          style={[
            styles.sentiment,
            { color: item.sentiment === 'positive' ? '#4CD964' : item.sentiment === 'negative' ? '#FF3B30' : '#666' },
          ]}
        >
          {item.sentiment ? item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1) : 'Pending'}
        </Text>
      </View>
      <View style={styles.actions}>
        {isSelected ? null : (
          <>
            {item.source === 'user' && (
              <>
                <TouchableOpacity onPress={() => onToggleFavorite(item.id, item.is_favorite!)}>
                  <Icon name={item.is_favorite ? "heart" : "heart-outline"} size={20} color={item.is_favorite ? "#FF0000" : "#aaa"} style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onHandleEdit(item)}>
                  <Icon name="pencil" size={20} color="#FFD700" style={styles.actionIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDeleteFeedback(item.id)} onLongPress={() => Alert.alert('Confirm Delete', 'Are you sure you want to delete this feedback?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'OK', onPress: () => onDeleteFeedback(item.id) }
                ])}>
                  <Icon name="trash" size={20} color="#FF4444" style={styles.actionIcon} />
                </TouchableOpacity>
              </>
            )}
            {item.source === 'twitter' && (
              <>
                <TouchableOpacity onPress={() => onAnalyzeSentiment(item.id, item.text!)}>
                  <Icon name="analytics" size={20} color="#4CAF50" style={styles.actionIcon} />
                </TouchableOpacity>
                {!item.user_id && (
                  <TouchableOpacity onPress={() => onSaveFeedback(item.id)}>
                    <Icon name="save" size={20} color="#2196F3" style={styles.actionIcon} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.sentiment === nextProps.item.sentiment &&
         prevProps.item.is_favorite === nextProps.item.is_favorite &&
         prevProps.isSelected === nextProps.isSelected;
});

const FeedbacksScreen = ({ navigation }: FeedbacksScreenProps) => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<number[]>([]);
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackSentiment, setNewFeedbackSentiment] = useState<'positive' | 'negative'>('positive');
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    if (!user) {
      console.error('No user authenticated');
      Alert.alert('Error', 'No user authenticated');
      return;
    }

    const userId = user.id;

    const { data: userFeedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId);

    const { data: twitterFeedback, error: twitterError } = await supabase
      .from('twitter_feedback')
      .select('id, date, user, text, sentiment, user_id')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('date', { ascending: false });

    if (feedbackError || twitterError) {
      console.error('Errors fetching feedbacks:', feedbackError || twitterError);
      Alert.alert('Error', 'Failed to fetch feedbacks');
      return;
    }

    const combinedFeedbacks: Feedback[] = [
      ...(userFeedback || []).map(fb => ({
        ...fb,
        source: 'user' as const,
        created_at: fb.created_at || new Date().toISOString()
      })),
      ...(twitterFeedback || []).map(fb => ({
        id: fb.id,
        source: 'twitter' as const,
        date: fb.date,
        user: fb.user,
        text: fb.text,
        sentiment: fb.sentiment || 'pending',
        created_at: fb.date,
        user_id: fb.user_id
      }))
    ];
    setFeedbacks(combinedFeedbacks);
  };

  const toggleFavorite = async (id: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('feedbacks')
      .update({ is_favorite: newStatus })
      .eq('id', id);
    if (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    } else {
      setFeedbacks(feedbacks.map(f => f.id === id ? { ...f, is_favorite: newStatus } : f));
    }
  };

  const handleAddFeedback = () => {
    setAddModalVisible(true);
  };

  const saveNewFeedback = async () => {
    if (!user || !newFeedbackContent.trim()) {
      Alert.alert('Error', 'Feedback content cannot be empty or no user authenticated.');
      return;
    }

    const { error } = await supabase
      .from('feedbacks')
      .insert({
        user_id: user.id,
        content: newFeedbackContent,
        sentiment: newFeedbackSentiment,
        is_favorite: false,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error adding feedback:', error);
      Alert.alert('Error', 'Failed to add feedback');
    } else {
      setAddModalVisible(false);
      setNewFeedbackContent('');
      setNewFeedbackSentiment('positive');
      fetchFeedbacks();
    }
  };

  const handleEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setNewFeedbackContent(feedback.content || '');
    setNewFeedbackSentiment((feedback.sentiment as 'positive' | 'negative') || 'positive');
    setEditModalVisible(true);
  };

  const saveEditedFeedback = async () => {
    if (!user || !newFeedbackContent.trim() || !editingFeedback) return;

    const { error } = await supabase
      .from('feedbacks')
      .update({
        content: newFeedbackContent,
        sentiment: newFeedbackSentiment,
      })
      .eq('id', editingFeedback.id);

    if (error) {
      console.error('Error updating feedback:', error);
      Alert.alert('Error', 'Failed to update feedback');
    } else {
      setEditModalVisible(false);
      setNewFeedbackContent('');
      setNewFeedbackSentiment('positive');
      setEditingFeedback(null);
      fetchFeedbacks();
    }
  };

  const analyzeSentiment = async (feedbackId: number, text: string) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      console.log('Calling sentiment analysis API for feedback ID:', feedbackId, 'with text:', text);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [text] }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);

      const responseData = result.data?.[0];
      if (!responseData || !responseData.label) {
        throw new Error('Unexpected API response format');
      }
      const newSentiment = responseData.label.toLowerCase();
      console.log('Extracted sentiment:', newSentiment);

      // Pre-update check: Verify the row exists
      const { data: existingFeedback, error: fetchError } = await supabase
        .from('twitter_feedback')
        .select('id, sentiment, user_id')
        .eq('id', feedbackId)
        .single();

      if (fetchError || !existingFeedback) {
        console.error('Row not found or fetch error for feedback ID:', feedbackId, 'Error:', fetchError);
        Alert.alert('Error', 'Feedback not found in database');
        return;
      }
      console.log('Existing feedback before update:', existingFeedback);

      // Perform the update
      const { data, error } = await supabase
        .from('twitter_feedback')
        .update({ sentiment: newSentiment, user_id: user.id })
        .eq('id', feedbackId)
        .select();

      if (error) {
        console.error('Error updating sentiment in Supabase:', error.message);
        Alert.alert('Error', 'Failed to save sentiment to database: ' + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error('No rows updated in Supabase for feedback ID:', feedbackId);
        Alert.alert('Error', 'No rows updated in database');
        return;
      }

      console.log('Updated feedback in Supabase:', data[0]);

      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f.id === feedbackId && f.source === 'twitter' ? { ...f, sentiment: newSentiment, user_id: user.id } : f
      ));

      // Refetch feedbacks to ensure consistency
      await fetchFeedbacks();

      // Show success message
      Alert.alert('Success', 'Sentiment analyzed and saved successfully!');
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      Alert.alert('Error', 'Failed to connect to sentiment analysis API: ' + (error as Error).message);
    }
  };

  const saveFeedback = async (id: number) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    const feedback = feedbacks.find(f => f.id === id && f.source === 'twitter');
    if (!feedback || feedback.user_id) {
      Alert.alert('Error', 'Feedback already saved or not found');
      return;
    }

    const { error } = await supabase
      .from('twitter_feedback')
      .update({ user_id: user.id })
      .eq('id', id);

    if (error) {
      console.error('Error saving feedback:', error);
      Alert.alert('Error', 'Failed to save feedback');
    } else {
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, user_id: user.id } : f
      ));
    }
  };

  const deleteFeedback = async (id: number) => {
    if (!user) return;

    const { error } = await supabase
      .from('feedbacks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting feedback:', error);
      Alert.alert('Error', 'Failed to delete feedback');
    } else {
      setFeedbacks(feedbacks.filter(f => f.id !== id));
      fetchFeedbacks();
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = (
      (feedback.content?.toLowerCase().includes(lowerSearch) || '') ||
      (feedback.text?.toLowerCase().includes(lowerSearch) || '') ||
      (feedback.sentiment?.toLowerCase().includes(lowerSearch) || '')
    );
    const matchesSentiment = filterSentiment === 'all' || feedback.sentiment === filterSentiment;
    const matchesSource = filterSource === 'all' || feedback.source === filterSource;
    return matchesSearch && matchesSentiment && matchesSource;
  });

  const toggleSelection = (id: number) => {
    if (selectedFeedbackIds.includes(id)) {
      setSelectedFeedbackIds(selectedFeedbackIds.filter(item => item !== id));
    } else {
      setSelectedFeedbackIds([...selectedFeedbackIds, id]);
    }
  };

  const cancelSelection = () => {
    setSelectedFeedbackIds([]);
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => {
    const isSelected = selectedFeedbackIds.length > 0 && selectedFeedbackIds.includes(item.id);
    return (
      <FeedbackItem
        item={item}
        isSelected={isSelected}
        onToggleSelection={toggleSelection}
        onToggleFavorite={toggleFavorite}
        onHandleEdit={handleEdit}
        onAnalyzeSentiment={analyzeSentiment}
        onSaveFeedback={saveFeedback}
        onDeleteFeedback={deleteFeedback}
      />
    );
  };

  return (
    <View style={styles.container}>
      {selectedFeedbackIds.length > 0 && (
        <View style={localStyles.selectionHeader}>
          <Text style={localStyles.selectionText}>
            {selectedFeedbackIds.length} selected
          </Text>
          <TouchableOpacity onPress={cancelSelection} style={localStyles.cancelButton}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.header}>Feedbacks</Text>
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search feedbacks by text or sentiment..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 }}>
        <Picker
          selectedValue={filterSentiment}
          style={{ height: 50, width: '48%' }}
          onValueChange={(itemValue) => setFilterSentiment(itemValue)}
        >
          <Picker.Item label="All Sentiments" value="all" />
          <Picker.Item label="Positive" value="positive" color="#4CD964" />
          <Picker.Item label="Negative" value="negative" color="#FF3B30" />
          <Picker.Item label="Pending" value="pending" color="#666" />
        </Picker>
        <Picker
          selectedValue={filterSource}
          style={{ height: 50, width: '48%' }}
          onValueChange={(itemValue) => setFilterSource(itemValue)}
        >
          <Picker.Item label="All Sources" value="all" />
          <Picker.Item label="User" value="user" />
          <Picker.Item label="Twitter" value="twitter" />
        </Picker>
      </View>
      <FlatList
        data={filteredFeedbacks}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No feedbacks available.</Text>
          </View>
        )}
      />
      {(filterSource === 'user' || filterSource === 'all') && (
        <TouchableOpacity style={styles.fab} onPress={handleAddFeedback}>
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Add New Feedback</Text>
            <TextInput
              style={localStyles.modalInput}
              placeholder="Enter feedback content"
              value={newFeedbackContent}
              onChangeText={setNewFeedbackContent}
              multiline
            />
            <Picker
              selectedValue={newFeedbackSentiment}
              style={localStyles.modalPicker}
              onValueChange={(itemValue) => setNewFeedbackSentiment(itemValue)}
            >
              <Picker.Item label="Positive" value="positive" color="#4CD964" />
              <Picker.Item label="Negative" value="negative" color="#FF3B30" />
            </Picker>
            <View style={localStyles.modalButtons}>
              <Pressable
                style={[localStyles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewFeedbackContent('');
                  setNewFeedbackSentiment('positive');
                }}
              >
                <Text style={localStyles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[localStyles.modalButton, { backgroundColor: '#4CD964' }]}
                onPress={saveNewFeedback}
              >
                <Text style={localStyles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={localStyles.modalContainer}>
          <View style={localStyles.modalContent}>
            <Text style={localStyles.modalTitle}>Edit Feedback</Text>
            <TextInput
              style={localStyles.modalInput}
              placeholder="Enter feedback content"
              value={newFeedbackContent}
              onChangeText={setNewFeedbackContent}
              multiline
            />
            <Picker
              selectedValue={newFeedbackSentiment}
              style={localStyles.modalPicker}
              onValueChange={(itemValue) => setNewFeedbackSentiment(itemValue)}
            >
              <Picker.Item label="Positive" value="positive" color="#4CD964" />
              <Picker.Item label="Negative" value="negative" color="#FF3B30" />
            </Picker>
            <View style={localStyles.modalButtons}>
              <Pressable
                style={[localStyles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  setEditModalVisible(false);
                  setNewFeedbackContent('');
                  setNewFeedbackSentiment('positive');
                  setEditingFeedback(null);
                }}
              >
                <Text style={localStyles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[localStyles.modalButton, { backgroundColor: '#4CD964' }]}
                onPress={saveEditedFeedback}
              >
                <Text style={localStyles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const localStyles = StyleSheet.create({
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  selectionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#4CD964',
    padding: 8,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalPicker: {
    width: '100%',
    height: 50,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FeedbacksScreen;