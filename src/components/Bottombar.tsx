import React, { useEffect, useRef } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View, GestureResponderEvent } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Animatable from 'react-native-animatable';
import Icon, { Icons } from '../components/Icons';
import Colors from '../constants/Colors';

// Import Screens
import Home from '../screens/HomeScreen/Home';
import Dashboard from '../screens/DashboardScreen/Dashboard';
import Notificaton from '../screens/NotificationScreen/Notificaton';
import YoutubeHome from '../screens/YoutubeHomeScreen/YoutubeHome';
import FeedbackList from '../screens/FeedbackListScreen/FeedbackList';

const Tab = createBottomTabNavigator(); // ✅ Define Tab Navigator

// Define TabItem Type
type TabItem = {
  route: string;
  label: string;
  type: any;
  activeIcon: string;
  inActiveIcon: string;
  component: React.ComponentType<any>;
};

// ✅ Add Home to the bottom tabs
const TabArr: TabItem[] = [
  { route: 'Notification', label: 'Notification', type: Icons.MaterialCommunityIcons, activeIcon: 'bell-badge-outline', inActiveIcon: 'bell-badge-outline', component: Notificaton },
  { route: 'Dashboard', label: 'Dashboard', type: Icons.Ionicons, activeIcon: 'grid', inActiveIcon: 'grid-outline', component: Dashboard },
  { route: 'Home', label: 'Home', type: Icons.Ionicons, activeIcon: 'home', inActiveIcon: 'home-outline', component: Home },
  { route: 'YoutubeHome', label: 'YoutubeHome', type: Icons.MaterialCommunityIcons, activeIcon: 'youtube-tv', inActiveIcon: 'youtube-tv', component: YoutubeHome },
  { route: 'FeedbackList', label: 'FeedbackList', type: Icons.FontAwesome, activeIcon: 'comments', inActiveIcon: 'comments', component: FeedbackList},
];

// Define Props Type for TabButton
interface TabButtonProps {
  item: TabItem;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityState?: { selected?: boolean };
}

// ✅ Animated Tab Button Component
const TabButton: React.FC<TabButtonProps> = ({ item, onPress, accessibilityState }) => {
  const focused = accessibilityState?.selected ?? false;
  const viewRef = useRef<Animatable.View & View>(null);

  // ✅ Trigger animation only when the button is clicked
  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event);
    }

    // 🔥 Animate ONLY the clicked icon
    if (viewRef.current) {
      viewRef.current.animate({
        0: { transform: [{ scale: 0.5 }, { rotate: '0deg' }] },
        1: { transform: [{ scale: 1.5 }, { rotate: '360deg' }] },
      });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.container}>
      <Animatable.View ref={viewRef} duration={970}>
        <Icon type={item.type} name={focused ? item.activeIcon : item.inActiveIcon} color={focused ? Colors.primary : Colors.primaryLite} />
      </Animatable.View>
    </TouchableOpacity>
  );
};

// ✅ Main Bottom Tab Navigator Component
const AnimTab1: React.FC = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Home" // ✅ Set Home as default screen (Explore does not exist)
        screenOptions={{
          headerShown: false,
        }}
      >
        {TabArr.map((item, index) => (
          <Tab.Screen
            key={index}
            name={item.route}
            component={item.component}
            options={({ route }) => ({
              tabBarShowLabel: false,
              tabBarButton: (props) => <TabButton {...props} item={item} />,
              
              // ✅ Hide Bottom Bar for Profile (Login screen)
              tabBarStyle: route.name === ''
                ? { display: 'none' } // Hide tab bar
                : { height: 60, position: 'absolute', margin: 16, borderRadius: 16 }, // Show tab bar
            })}
          />
        ))}
      </Tab.Navigator>
    </SafeAreaView>
  );
};


export default AnimTab1;

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
});
