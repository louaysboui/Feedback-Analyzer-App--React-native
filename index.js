import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import 'whatwg-fetch';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

import '@tensorflow/tfjs-react-native';
import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs';

(async () => {
  try {
    await tf.ready();
    const backends = Object.keys(tf.engine().registry);
    console.log('TFJS ready, available backends:', backends);
    const preferred = backends.includes('rn-webgl') ? 'rn-webgl' : 'cpu';
    await tf.setBackend(preferred);
    console.log('Using backend:', tf.getBackend());
  } catch (e) {
    console.error('Error initializing TensorFlow.js:', e);
  } finally {
    AppRegistry.registerComponent(appName, () => App);
  }
})();