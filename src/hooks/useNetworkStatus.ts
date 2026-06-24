import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Live network connectivity, used to tell "no internet" apart from a backend
 * failure in the Boki chat (per BKLT-221 error-handling acceptance criteria).
 *
 * Defaults to connected so the very first render never shows a false offline
 * state; `isConnected === null` from NetInfo (unknown) is also treated as online.
 */
export const useNetworkStatus = (): { isConnected: boolean } => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected !== false);
    });

    NetInfo.fetch().then((state) => setIsConnected(state.isConnected !== false));

    return () => unsubscribe();
  }, []);

  return { isConnected };
};
