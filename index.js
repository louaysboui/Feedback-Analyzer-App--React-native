/**
 * @format
 */

import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './App';

AppRegistry.registerComponent(appName, () => App);
