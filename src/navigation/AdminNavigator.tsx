import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsersListScreen from '../screens/AdminScreen/UsersListScreen';
import ReclamationsListScreen from '../screens/AdminScreen/ReclamationsListScreen';
import EditUserScreen from '../screens/AdminScreen/EditUserScreen';
import EditReclamationScreen from '../screens/AdminScreen/EditReclamationScreen';
import { RootStackParamList } from '../../App';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UsersList" component={UsersListScreen} options={{ title: 'Users Management' }} />
      <Stack.Screen name="ReclamationsList" component={ReclamationsListScreen} options={{ title: 'Reclamations Management' }} />
      <Stack.Screen name="EditUser" component={EditUserScreen} options={{ title: 'Edit User' }} />
      <Stack.Screen name="EditReclamation" component={EditReclamationScreen} options={{ title: 'Edit Reclamation' }} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;