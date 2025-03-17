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

  return (
    <View style={{ height: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
      {showMenu && (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={onMenuPress}>
          <Icon name="menu" size={27} color="blue" />
        </TouchableOpacity>
      )}
      
    </View>
  );
};

export default CustomHeader;