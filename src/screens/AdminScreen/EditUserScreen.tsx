// EditUserScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'EditUser'>;

const EditUserScreen: React.FC<Props> = ({ route, navigation }) => {
  const { userId } = route.params;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error('Error fetching user:', error);
        Alert.alert('Error', 'Failed to fetch user');
      } else {
        setName(data.name || '');
        setEmail(data.email || '');
        setRole(data.role || '');
      }
    };
    fetchUser();
  }, [userId]);

  const handleUpdate = async () => {
    const { error } = await supabase
      .from('users')
      .update({ name, email, role })
      .eq('id', userId);
    if (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    } else {
      Alert.alert('Success', 'User updated successfully');
      navigation.goBack();
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Edit User</Text>
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }}
        placeholder="Role"
        value={role}
        onChangeText={setRole}
      />
      <TouchableOpacity
        onPress={handleUpdate}
        style={{ padding: 15, backgroundColor: '#007AFF', borderRadius: 5, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Update User</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditUserScreen;