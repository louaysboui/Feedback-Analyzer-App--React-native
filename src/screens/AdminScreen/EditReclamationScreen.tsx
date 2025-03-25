// EditReclamationScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'EditReclamation'>;

const EditReclamationScreen: React.FC<Props> = ({ route, navigation }) => {
  const { reclamationId } = route.params;
  const [userId, setUserId] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchReclamation = async () => {
      const { data, error } = await supabase
        .from('reclamations')
        .select('*')
        .eq('id', reclamationId)
        .single();
      if (error) {
        console.error('Error fetching reclamation:', error);
        Alert.alert('Error', 'Failed to fetch reclamation');
      } else {
        setUserId(data.user_id || '');
        setDescription(data.description || '');
      }
    };
    fetchReclamation();
  }, [reclamationId]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('reclamations')
      .update({ user_id: userId, description })
      .eq('id', reclamationId);
    if (error) {
      console.error('Error updating reclamation:', error);
      Alert.alert('Error', 'Failed to update reclamation');
    } else {
      Alert.alert('Success', 'Reclamation updated successfully');
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Edit Reclamation</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TouchableOpacity
        onPress={handleUpdate}
        style={{ padding: 15, backgroundColor: '#007AFF', borderRadius: 5, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Update Reclamation</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditReclamationScreen;