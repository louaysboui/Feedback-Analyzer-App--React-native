import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../../../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../../src/components/AuthContext'; // Adjust path as needed
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import Colors from '../../constants/Colors';
import EditReclamationScreen from './EditReclamationScreen';

interface Reclamation {
  id: number;
  user_id: string;
  description: string;
  severity: string;
  issue_type: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ReclamationsListScreen = () => {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = async () => {
    const { data, error } = await supabase.from('reclamations').select('*');
    if (error) {
      console.error('Error fetching reclamations:', error);
      Alert.alert('Error', 'Failed to fetch reclamations');
    } else {
      console.log('Fetched reclamations:', data); // Debug log
      setReclamations(data);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Explore' }],
    });
  };

  const deleteReclamation = async (id: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this reclamation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('reclamations').delete().eq('id', id);
          if (error) {
            console.error('Error deleting reclamation:', error);
            Alert.alert('Error', 'Failed to delete reclamation');
          } else {
            fetchReclamations();
          }
        },
      },
    ]);
  };

  const renderReclamationItem = ({ item }: { item: Reclamation }) => (
    <View style={{ padding: 10, marginVertical: 5, backgroundColor: '#fff', borderRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Reclamation ID: {item.id}</Text>
      <Text>User ID: {item.user_id}</Text>
      <Text>Severity: {item.severity}</Text>
      <Text>Issue Type: {item.issue_type}</Text>
      <Text>{item.description}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
        <TouchableOpacity onPress={() => navigation.navigate('EditReclamation', { reclamationId: item.id.toString() })}>
          <Icon name="pencil" size={24} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteReclamation(item.id)} style={{ marginLeft: 20 }}>
          <Icon name="trash" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color:Colors.primary}}>Reclamations :</Text>
        <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row',padding: 10, backgroundColor: '#FF3B30', borderRadius: 5 }}>
          <Icon name="log-out" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={reclamations}
        renderItem={renderReclamationItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

export default ReclamationsListScreen;