import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './src/screens/HomeScreen/Home';
import Explore from './src/screens/ExploreScreen/Explore';
import Dashboard from './src/screens/DashboardScreen/Dashboard';
import Login from './src/screens/LoginScreen/Login';
import Bottombar from './src/components/Bottombar';
import Register from './src/screens/RegisterScreen/Register';
import YoutubeHome from './src/screens/YoutubeHomeScreen/YoutubeHome';
import Youtube from './src/screens/YoutubeScreen/Youtube';
import { AuthProvider, useAuth } from './src/components/AuthContext';
import 'react-native-url-polyfill/auto';
import { Linking } from 'react-native';
import { supabase } from './lib/supabase';

export type RootStackParamList = {
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

const AppContent = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // You can add a loading spinner here if desired
  }

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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={user ? 'Tabs' : 'Login'}>
        <Stack.Screen name="Explore" component={Explore} />
        <Stack.Screen name="Tabs" component={Bottombar} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="YoutubeHome" component={YoutubeHome} />
        <Stack.Screen name="Youtube" component={Youtube} />
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