import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Home from './screens/Home';
import details from './screens/details';
import Explore from './screens/Explore';
import Dashboard from './screens/Dashboard';
import Login from './screens/Login';
import Bottombar from './components/Bottombar';
import Register from './screens/Register';
import YoutubeHome from './screens/YoutubeHome';
import Youtube from './screens/Youtube';

export type RootStackParamList = {
  Home: undefined;
  details: { productId: string };
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

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="YoutubeHome">
        <Stack.Screen 
          name="Explore" 
          component={Explore} 
          options={({ }) => ({
            headerShown: false, 
            title: "Explore",
          })}
        />
        <Stack.Screen name="Tabs" component={Bottombar} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="details" component={details} options={{ title: "products details" }} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="YoutubeHome" component={YoutubeHome} />
        <Stack.Screen name="Youtube" component={Youtube} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;