/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App';
import 'react-native-url-polyfill/auto'; // <--- Add this line FIRST

AppRegistry.registerComponent(appName, () => App); 
