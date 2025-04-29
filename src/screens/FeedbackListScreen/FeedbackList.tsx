import React, { useEffect, useState } from 'react';
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

interface Feedback {
  id: number;
  content: string;
  sentiment: string;
  is_favorite: boolean | null;
  created_at: string;
  source: 'user' | 'twitter';
  user_id?: string;
  feedback_id?: string;
}

import { NavigationProp } from '@react-navigation/native';

interface FeedbacksScreenProps {
  navigation: NavigationProp<any>;
}

const FeedbacksScreen = ({ navigation }: FeedbacksScreenProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<number[]>([]);
  const [filterSentiment, setFilterSentiment] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');

  // State for Add/Edit Modal
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [newFeedbackContent, setNewFeedbackContent] = useState('');
  const [newFeedbackSentiment, setNewFeedbackSentiment] = useState<'positive' | 'negative'>('positive');
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }
    const userId = user.id;

    // Fetch user feedback
    const { data: userFeedback, error: feedbackError } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId);

    // Fetch Twitter feedback (last 30 days)
    const { data: twitterFeedback, error: twitterError } = await supabase
      .from('twitter_feedback')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (feedbackError || twitterError) {
      console.error('Errors:', feedbackError, twitterError);
    } else {
      // Combine user and Twitter feedback
      const combinedFeedbacks: Feedback[] = [
        ...(userFeedback || []).map(fb => ({
          ...fb,
          source: 'user',
          created_at: fb.created_at || new Date().toISOString()
        })),
        ...(twitterFeedback || []).map(fb => ({
          ...fb,
          source: 'twitter',
          is_favorite: null,
          created_at: fb.created_at || new Date().toISOString()
        }))
      ];
      setFeedbacks(combinedFeedbacks);
    }
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

  // Add Feedback Functions
  const handleAddFeedback = () => {
    setAddModalVisible(true);
  };

  const saveNewFeedback = async () => {
    if (!newFeedbackContent.trim()) {
      Alert.alert('Error', 'Feedback content cannot be empty.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found');
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

  // Edit Feedback Functions
  const handleEdit = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setNewFeedbackContent(feedback.content);
    setNewFeedbackSentiment(feedback.sentiment as 'positive' | 'negative');
    setEditModalVisible(true);
  };

  const saveEditedFeedback = async () => {
    if (!newFeedbackContent.trim()) {
      Alert.alert('Error', 'Feedback content cannot be empty.');
      return;
    }

    if (!editingFeedback) return;

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

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = (
      feedback.content.toLowerCase().includes(lowerSearch) ||
      feedback.sentiment.toLowerCase().includes(lowerSearch)
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

  const deleteSelectedFeedbacks = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete the selected feedbacks?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const userFeedbackToDelete = feedbacks
              .filter(f => selectedFeedbackIds.includes(f.id) && f.source === 'user')
              .map(f => f.id);
            if (userFeedbackToDelete.length > 0) {
              await supabase.from('feedbacks').delete().in('id', userFeedbackToDelete);
            }

            const twitterFeedbackToDelete = feedbacks
              .filter(f => selectedFeedbackIds.includes(f.id) && f.source === 'twitter')
              .map(f => f.id);
            if (twitterFeedbackToDelete.length > 0) {
              await supabase.from('twitter_feedback').delete().in('id', twitterFeedbackToDelete);
            }

            fetchFeedbacks();
            setSelectedFeedbackIds([]);
          },
        },
      ]
    );
  };

  const cancelSelection = () => {
    setSelectedFeedbackIds([]);
  };

  const handleDelete = (id: number, source: 'user' | 'twitter') => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const table = source === 'user' ? 'feedbacks' : 'twitter_feedback';
          const { error } = await supabase.from(table).delete().eq('id', id);
          if (error) {
            console.error('Error deleting feedback:', error);
          } else {
            fetchFeedbacks();
          }
        },
      },
    ]);
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => {
    const isSelected = selectedFeedbackIds.includes(item.id);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={() => toggleSelection(item.id)}
        onPress={() => {
          if (selectedFeedbackIds.length > 0) {
            toggleSelection(item.id);
          }
        }}
        style={[
          styles.feedbackItem,
          isSelected && { backgroundColor: '#d0ebff' }
        ]}
      >
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackContent}>
            {item.content} {item.source === 'twitter' && '(Twitter)'}
          </Text>
          <Text
            style={[
              styles.sentiment,
              { color: item.sentiment === 'positive' ? '#4CD964' : '#FF3B30' },
            ]}
          >
            {item.sentiment.charAt(0).toUpperCase() + item.sentiment.slice(1)}
          </Text>
        </View>
        <View style={styles.actions}>
          {selectedFeedbackIds.length === 0 && (
            <>
              {item.source === 'user' && (
                <>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id, item.is_favorite!)}>
                    <Icon name={item.is_favorite ? "heart" : "heart-outline"} size={20} color={item.is_favorite ? "#FF0000" : "#aaa"} style={styles.actionIcon} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEdit(item)}>
                    <Icon name="pencil" size={20} color="#FFD700" style={styles.actionIcon} />
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity onPress={() => handleDelete(item.id, item.source)}>
                <Icon name="trash" size={20} color="#FF3B30" style={styles.actionIcon} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {selectedFeedbackIds.length > 0 && (
        <View style={localStyles.selectionHeader}>
          <Text style={localStyles.selectionText}>
            {selectedFeedbackIds.length} selected
          </Text>
          <TouchableOpacity onPress={deleteSelectedFeedbacks} style={localStyles.deleteButton}>
            <Text style={styles.buttonText}>Delete Selected</Text>
          </TouchableOpacity>
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
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No feedbacks available.</Text>
          </View>
        )}
      />
      {/* Add Feedback Button (only visible when source is 'user' or 'all') */}
      {(filterSource === 'user' || filterSource === 'all') && (
        <TouchableOpacity style={styles.fab} onPress={handleAddFeedback}>
          <Icon name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
      {/* Add Feedback Modal */}
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
      {/* Edit Feedback Modal */}
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
    marginHorizontal: 5,
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