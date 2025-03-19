import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../../../lib/supabase';
import styles from './FeedbacklistStyles';
import Colors from '../../constants/Colors';

const FeedbacksScreen = () => {
  // Updated feedback object to include sentiment
  const [feedbacks, setFeedbacks] = useState<{ id: number; content: string; sentiment: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [newFeedback, setNewFeedback] = useState('');
  const [newSentiment, setNewSentiment] = useState('positive'); // State for selected sentiment
  const [editingFeedback, setEditingFeedback] =
    useState<{ id: number; content: string; sentiment: string } | null>(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    const { data, error } = await supabase.from('feedbacks').select('*');
    if (error) {
      console.error('Error fetching feedbacks:', error);
    } else {
      setFeedbacks(data);
    }
  };

  const filteredFeedbacks = feedbacks.filter((feedback) =>
    feedback.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFeedback = () => {
    setIsAddModalVisible(true);
  };

  const saveNewFeedback = async () => {
    if (!newFeedback.trim()) {
      Alert.alert('Error', 'Feedback cannot be empty');
      return;
    }
    const { error } = await supabase
      .from('feedbacks')
      .insert([{ content: newFeedback, sentiment: newSentiment }]);

    if (error) {
      console.error('Error adding feedback:', error);
    } else {
      fetchFeedbacks();
      setIsAddModalVisible(false);
      setNewFeedback('');
      setNewSentiment('positive'); // Reset to default
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Feedbacks</Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Icon name="search" size={20} color="#aaa" style={styles.searchIcon} />
        <TextInput
          placeholder="Search feedbacks"
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.searchInput}
        />
      </View>

      {/* Feedback List */}
      <FlatList
        data={filteredFeedbacks}
        renderItem={({ item }) => (
          <View style={styles.feedbackItem}>
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
              <TouchableOpacity onPress={() => handleEdit(item.id)}>
                <Icon name="pencil" size={20} color={Colors.primary} style={styles.actionIcon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Icon name="trash" size={20} color="#FF3B30" style={styles.actionIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No feedbacks yet. Add one!</Text>
          </View>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddFeedback}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Feedback Modal */}
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
            {/* Dropdown for sentiment */}
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

      {/* Edit Feedback Modal */}
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

export default FeedbacksScreen;
