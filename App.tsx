import * as React from 'react';
import {
  NavigationContainer,
  NavigationContainerRef,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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
import Settings from './src/screens/SettingsScreen/Settings';
import Reclamation from './src/screens/ReclamationScreen/Reclamation';
import FavoriteFeedbacks from './src/screens/FavoriteFeedbacksScreen/FavoriteFeedbacks';
import { ThemeProvider, useTheme } from './src/components/ThemeContext';
import AdminNavigator from './src/navigation/AdminNavigator';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen/ResetPasswordScreen';

export type RootStackParamList = {
  Profile: undefined;
  Settings: undefined;
  Reclamation: undefined;
  About: undefined;
  Home: undefined;
  Explore: undefined;
  Dashboard: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  Bottombar: undefined;
  YoutubeHome: { channelUrl: string } | undefined;
  Youtube: { channelUrl: string; snapshotId: string };
  FavoriteFeedbacks: undefined;
  UsersList: undefined;
  ReclamationsList: undefined;
  EditUser: { userId: string };
  EditReclamation: { reclamationId: string };
  ResetPassword: { deepLinkUrl?: string }; // Updated to accept deepLinkUrl
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const DrawerNavigator = createDrawerNavigator<RootStackParamList>();

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);
  const navTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  const linking = {
    prefixes: ['myapp://'],
    config: {
      screens: {
        ResetPassword: 'reset-password',
        Login: 'login',
      },
    },
  };

  const handleDeepLink = async (url: string) => {
    console.log('Handling deep link:', url);
    if (url.startsWith('myapp://verify')) {
      const urlParams = new URL(url);
      const code = urlParams.searchParams.get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Error exchanging code:', error);
        } else {
          console.log('Session created:', data.session);
        }
      }
    } else if (url.startsWith('myapp://reset-password')) {
      if (navigationRef.current) {
        navigationRef.current.navigate('ResetPassword', { deepLinkUrl: url });
      } else {
        console.log('Navigation ref not ready');
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
    if (user.role === 'admin') {
      return (
        <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
          <AdminNavigator />
        </NavigationContainer>
      );
    }

    return (
      <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
        <DrawerNavigator.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
        >
          <DrawerNavigator.Screen
            name="Tabs"
            component={Bottombar}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
            }}
          />
          <DrawerNavigator.Screen
            name="Profile"
            component={Profile}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
            }}
          />
          <DrawerNavigator.Screen
            name="About"
            component={About}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
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
          <DrawerNavigator.Screen
            name="Settings"
            component={Settings}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
            }}
          />
          <DrawerNavigator.Screen
            name="Reclamation"
            component={Reclamation}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
            }}
          />
          <DrawerNavigator.Screen
            name="FavoriteFeedbacks"
            component={FavoriteFeedbacks}
            options={{
              header: (props) => (
                <CustomHeader
                  {...props}
                  back={undefined}
                  onMenuPress={() => props.navigation.toggleDrawer()}
                />
              ),
            }}
          />
          <DrawerNavigator.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{ headerShown: false }}
          />
        </DrawerNavigator.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      <Stack.Navigator initialRouteName="Explore">
        <Stack.Screen name="Explore" component={Explore} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
        <Stack.Screen name="YoutubeHome" component={YoutubeHome} options={{ headerShown: false }} />
        <Stack.Screen name="Youtube" component={Youtube} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;