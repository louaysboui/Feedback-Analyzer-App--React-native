import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface CustomHeaderProps {
  navigation: any;
  route: any;
  options: any;
  back: any;
  onMenuPress: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ navigation, route, options, back, onMenuPress }) => {
  const showMenu = ['Tabs', 'Home', 'Dashboard', 'YoutubeHome', 'Youtube'].includes(route.name);

  if (route.name === 'Profile') {
    return (
      <View style={{ height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => navigation.navigate('Tabs')}>
          <Icon name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', color: '#000', fontFamily: 'Poppins-Bold', fontSize: 18 }}>Profile </Text>
      </View>
    );
  } else {
    return (
      <View style={{ height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
        {showMenu && (
          <TouchableOpacity style={{ marginRight: 16 }} onPress={onMenuPress}>
            <Icon name="menu" size={27} color="blue  " />
          </TouchableOpacity>
        )}
        <Text style={{ flex: 1, textAlign: 'center', color: 'black', fontFamily: 'Poppins-Bold', fontSize: 18 }}></Text>
      </View>
    );
  }
};

export default CustomHeader;