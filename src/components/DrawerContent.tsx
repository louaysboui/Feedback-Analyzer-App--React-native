import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuth } from '../components/AuthContext'; // Adjust path as needed

const DrawerContent = ({ navigation }: DrawerContentComponentProps) => {
  const { user } = useAuth(); // Access user from auth context
  const { signOut } = useAuth(); // Access signOut function from auth context

  const onSelect = (item: string) => {
    switch (item) {
      case 'Settings':
        navigation.navigate('Settings');
        break;
        case 'FavoriteFeedbacks':
        navigation.navigate('FavoriteFeedbacks');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
      case 'About':
        navigation.navigate('About');
        break;
      case 'Logout':
        navigation.closeDrawer();
        break;
        case 'Reclamation':
        navigation.navigate('Reclamation');
        break;
    }
    navigation.closeDrawer();
  };


  
    const handleLogout = async () => {
      await signOut();
      navigation.navigate('Login');
    };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: Colors.primary }}>
      {/* Profile Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
        {user?.profileImage ? (
          <Image
            source={{ uri: user.profileImage }}
            style={{ width: 75, height: 75, borderRadius: 35 }}
          />
        ) : (
          <Icon name="person-circle-outline" size={75} color="#ccc" />
        )}
        <View style={{ marginLeft: 16 }}>
          <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 }}>
            {user?.name || 'Your Name'}
          </Text>
          <Text style={{ color: 'gray', fontFamily: 'Poppins-Regular', fontSize: 14 }}>
            {user?.occupation || 'Your Occupation'}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View>
        {[
          { label: 'Profile', icon: 'person', key: 'Profile' },
          { label: 'Favorite Feedbacks', icon: 'heart', key: 'FavoriteFeedbacks' },
          { label: 'Settings', icon: 'settings', key: 'Settings' },
          { label: 'Reclamation', icon: 'construct', key: 'Reclamation' },
          { label: 'About', icon: 'information-circle', key: 'About' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={{ paddingVertical: 12, paddingHorizontal: 16 }}
            onPress={() => onSelect(item.key)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name={item.icon} size={24} color="white" />
              <Text style={{ color: 'white', fontFamily: 'Poppins-Regular', fontSize: 16, marginLeft: 16 }}>
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontFamily: 'Poppins-Regular', fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DrawerContent;