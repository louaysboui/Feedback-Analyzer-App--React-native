import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UsersListScreen from '../screens/AdminScreen/UsersListScreen.tsx';
import ReclamationsListScreen from '../screens/AdminScreen/ReclamationsListScreen.tsx';

const Stack = createNativeStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Users" component={UsersListScreen} />
      <Stack.Screen name="Reclamations" component={ReclamationsListScreen} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;