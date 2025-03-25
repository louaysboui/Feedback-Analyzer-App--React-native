import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../src/components/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Colors from '../../constants/Colors';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const UsersListScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users');
    } else {
      console.log('Fetched users:', data);
      setUsers(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Explore' }],
    });
  };

  const deleteUser = async (id: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('users').delete().eq('id', id);
          if (error) {
            console.error('Error deleting user:', error);
            Alert.alert('Error', 'Failed to delete user');
          } else {
            fetchUsers();
          }
        },
      },
    ]);
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#fff', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.name || 'Unknown'}</Text>
      <Text>{item.email || 'No Email'}</Text>
      <Text>Role: {item.role}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('EditUser', { userId: item.id })}>
          <Icon name="pencil" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteUser(item.id)} style={{ marginLeft: 20 }}>
          <Icon name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' ,color:Colors.primary}}>Users Management</Text>
        <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#FF3B30', borderRadius: 5 }}>
          <Icon name="log-out" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => navigation.navigate('ReclamationsList')}
        style={{ padding: 15, backgroundColor: '#007AFF', borderRadius: 5, alignItems: 'center', marginBottom: 20 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>View Reclamations</Text>
      </TouchableOpacity>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

export default UsersListScreen;