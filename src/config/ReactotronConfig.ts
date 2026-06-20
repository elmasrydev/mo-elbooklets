import Reactotron from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare global {
  interface Console {
    tron: any;
  }
}

if (__DEV__) {
  const tron = Reactotron.setAsyncStorageHandler(AsyncStorage)
    .configure({
      name: 'Mo ElBooklets',
    })
    .useReactNative()
    .connect();

  console.tron = tron;

  // Clear Reactotron on every reload
  Reactotron.clear?.();
}
