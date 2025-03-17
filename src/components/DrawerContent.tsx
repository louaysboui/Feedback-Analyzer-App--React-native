import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Colors from '../constants/Colors';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerContentComponentProps } from '@react-navigation/drawer';

const DrawerContent = ({ navigation }: DrawerContentComponentProps) => {
  const onSelect = (item: string) => {
    switch (item) {
      case 'Home':
        navigation.navigate('Tabs');
        break;
      case 'Profile':
        navigation.navigate('Profile');
        break;
        case 'About':
        navigation.navigate('About');
        break;
      case 'Logout':
        // Assuming setAuth is accessible via context or passed as a prop
        // For simplicity, we'll just close the drawer here; adjust as needed
        navigation.closeDrawer();
        break;
    }
    navigation.closeDrawer();
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: Colors.primary }}>
      {/* Profile Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
        <Image
          source={require('../assets/images/louay.jpg')}
          style={{ width: 75, height: 75, borderRadius: 35 }}
        />
        <View style={{ marginLeft: 16 }}>
          <Text style={{ color: 'white', fontFamily: 'Poppins-Bold', fontSize: 18 }}>Louay Sboui</Text>
          <Text style={{ color: 'gray', fontFamily: 'Poppins-Regular', fontSize: 14 }}>Full stack Mobile developer</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View>
        {[
          { label: 'Profile', icon: 'person', key: 'Profile' },
          { label: 'Settings', icon: 'settings', key: 'Settings' },
          { label: 'About', icon: 'information-circle', key: 'About' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={{ paddingVertical: 12, paddingHorizontal: 16 }}
            onPress={() => onSelect(item.key)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name={item.icon} size={24} color="white" />
              <Text style={{ color: 'white', fontFamily: 'Poppins-Regular', fontSize: 16, marginLeft: 16 }}>{item.label}</Text>
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
          onPress={() => onSelect('Logout')}
        >
          <MaterialCommunityIcons name="logout" size={24} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontFamily: 'Poppins-Regular', fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DrawerContent;