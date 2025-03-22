import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Modal,
  StyleSheet 
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
  is_favorite: boolean;
}

import { NavigationProp } from '@react-navigation/native';

interface FeedbacksScreenProps {
  navigation: NavigationProp<any>;
}

const FeedbacksScreen = ({ navigation }: FeedbacksScreenProps) => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newFeedback, setNewFeedback] = useState('');
  const [newSentiment, setNewSentiment] = useState('positive');
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<number[]>([]);

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
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .eq('user_id', userId);
    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      setFeedbacks(data);
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

  const filteredFeedbacks = feedbacks.filter((feedback) => {
    const lowerSearch = searchTerm.toLowerCase();
    return (
      feedback.content.toLowerCase().includes(lowerSearch) ||
      feedback.sentiment.toLowerCase().includes(lowerSearch)
    );
  });

  const handleAddFeedback = () => {
    setIsAddModalVisible(true);
  };

  const saveNewFeedback = async () => {
    if (!newFeedback.trim()) {
      Alert.alert('Error', 'Feedback cannot be empty');
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return;
    }
    const userId = user.id;
    const { error } = await supabase
      .from('feedbacks')
      .insert([{ content: newFeedback, sentiment: newSentiment, user_id: userId, is_favorite: false }]);
    if (error) {
      console.error('Error adding feedback:', error);
    } else {
      fetchFeedbacks();
      setIsAddModalVisible(false);
      setNewFeedback('');
      setNewSentiment('positive');
    }
  };

  const handleEdit = (id: number) => {
    const feedback = feedbacks.find((f) => f.id === id);
    if (feedback) {
      setEditingFeedback(feedback);
      setIsEditModalVisible(true);
    } else {
      console.error('Feedback not found');
    }
  };

  const saveEditedFeedback = async () => {
    if (editingFeedback && editingFeedback.content.trim()) {
      const { error } = await supabase
        .from('feedbacks')
        .update({
          content: editingFeedback.content,
          sentiment: editingFeedback.sentiment,
        })
        .eq('id', editingFeedback.id);
      if (error) {
        console.error('Error updating feedback:', error);
      } else {
        fetchFeedbacks();
        setIsEditModalVisible(false);
        setEditingFeedback(null);
      }
    } else {
      Alert.alert('Error', 'Feedback cannot be empty');
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this feedback?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('feedbacks').delete().eq('id', id);
          if (error) {
            console.error('Error deleting feedback:', error);
          } else {
            fetchFeedbacks();
          }
        },
      },
    ]);
  };

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
            const { error } = await supabase
              .from('feedbacks')
              .delete()
              .in('id', selectedFeedbackIds);
            if (error) {
              console.error('Error deleting feedbacks:', error);
            } else {
              fetchFeedbacks();
              setSelectedFeedbackIds([]);
            }
          },
        },
      ]
    );
  };

  const cancelSelection = () => {
    setSelectedFeedbackIds([]);
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
          } else {
            handleEdit(item.id);
          }
        }}
        style={[
          styles.feedbackItem,
          isSelected && { backgroundColor: '#d0ebff' }
        ]}
      >
        <View style={styles.feedbackRow}>
          <Text style={styles.feedbackContent}>{item.content}</Text>
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
              <TouchableOpacity onPress={() => toggleFavorite(item.id, item.is_favorite)}>
                <Icon name={item.is_favorite ? "star" : "star-outline"} size={20} color={item.is_favorite ? "#FFD700" : "#aaa"} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEdit(item.id)}>
                <Icon name="pencil" size={20} color={Colors.primary} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
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
      <FlatList
        data={filteredFeedbacks}
        renderItem={renderFeedbackItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No feedbacks yet. Add one!</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddFeedback}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal visible={isAddModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Feedback</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter feedback"
              value={newFeedback}
              onChangeText={setNewFeedback}
            />
            <Picker
              selectedValue={newSentiment}
              style={{ height: 100, width: '100%' }}
              onValueChange={(itemValue) => setNewSentiment(itemValue)}
            >
              <Picker.Item label="Positive" value="positive" color="#4CD964" />
              <Picker.Item label="Negative" value="negative" color="#FF3B30" />
            </Picker>
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveNewFeedback}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setIsAddModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={isEditModalVisible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Feedback</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Edit feedback"
              value={editingFeedback?.content || ''}
              onChangeText={(text) =>
                setEditingFeedback(editingFeedback ? { ...editingFeedback, content: text } : null)
              }
            />
            {editingFeedback && (
              <Picker
                selectedValue={editingFeedback.sentiment}
                style={{ height: 50, width: '100%' }}
                onValueChange={(itemValue) =>
                  setEditingFeedback({ ...editingFeedback, sentiment: itemValue })
                }
              >
                <Picker.Item label="Positive" value="positive" color="#4CD964" />
                <Picker.Item label="Negative" value="negative" color="#FF3B30" />
              </Picker>
            )}
            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveEditedFeedback}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setEditingFeedback(null);
                setIsEditModalVisible(false);
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
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
  favoriteButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  favoriteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default FeedbacksScreen;