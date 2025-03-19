import * as React from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from './src/screens/HomeScreen/Home';
import Explore from './src/screens/ExploreScreen/Explore';
import Dashboard from './src/screens/DashboardScreen/Dashboard';
import Login from './src/screens/LoginScreen/Login';
import Bottombar from './src/components/Bottombar';
import Register from './src/screens/RegisterScreen/Register';
import YoutubeHome from './src/screens/YoutubeHomeScreen/YoutubeHome';
import Youtube from './src/screens/YoutubeScreen/Youtube';
import Profile from './src/screens/ProfileScreen/Profile';
import About from './src/screens/AboutScreen/About';
import { AuthProvider, useAuth } from './src/components/AuthContext';
import 'react-native-url-polyfill/auto';
import { Linking, View, Text } from 'react-native';
import { supabase } from './lib/supabase';
import DrawerContent from './src/components/DrawerContent';
import CustomHeader from './src/components/CustomHeader'; 
import 'react-native-reanimated';



export type RootStackParamList = {
  Profile: undefined;
  About: undefined;
  Home: undefined;
  Explore: undefined;
  Dashboard: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  Bottombar: undefined;
  YoutubeHome: { channelUrl: string } | undefined;
  Youtube: { channelUrl: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const DrawerNavigator = createDrawerNavigator<RootStackParamList>();

const AppContent = () => {
  const { user, isLoading, setAuth } = useAuth();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Deep link handling remains unchanged
  const handleDeepLink = async (url: string) => {
    if (url.startsWith('myapp://verify')) {
      const urlParams = new URL(url);
      const code = urlParams.searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error(error);
        } else {
          console.log('Session created:', data.session);
        }
      }
    }
  };

  React.useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return (
      <NavigationContainer ref={navigationRef}>
        <DrawerNavigator.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <DrawerNavigator.Screen
            name="Tabs"
            component={Bottombar}
            options={{
              header: (props) => <CustomHeader {...props} back={undefined} onMenuPress={() => props.navigation.toggleDrawer()} />,
            }}
          />
          <DrawerNavigator.Screen
            name="Profile"
            component={Profile}
            options={{
              header: (props) => <CustomHeader {...props} back={undefined} onMenuPress={() => props.navigation.toggleDrawer()} />,
            }}
          />
          <DrawerNavigator.Screen
            name="About"
            component={About}
            options={{
              header: (props) => <CustomHeader {...props} back={undefined} onMenuPress={() => props.navigation.toggleDrawer()} />,
            }}
          />
          <DrawerNavigator.Screen
          name="Youtube"
          component={Youtube}
          options={{ headerShown: false }}
          />
           <DrawerNavigator.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
          />
          
          
          
        
        </DrawerNavigator.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Explore">
        <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }}/>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
          <Stack.Screen name="YoutubeHome" component={YoutubeHome} options={{ headerShown: false }} />
          <Stack.Screen name="Youtube" component={Youtube} options={{ headerShown: false }} />
          
          
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;