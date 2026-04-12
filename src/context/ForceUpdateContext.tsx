import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import {
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';
import DeviceInfo from 'react-native-device-info';
import { isDebugMode as checkDebugMode } from '../config/debug';

export interface PlatformVersionConfig {
  version: string;
  forceUpdate: boolean;
}

export interface RemoteConfigVersionData {
  ios: PlatformVersionConfig;
  android: PlatformVersionConfig;
}

export interface ForceUpdateContextType {
  shouldUpdate: boolean;
  isForceUpdate: boolean;
  remoteVersion: string;
  isMaintenanceMode: boolean;
  checkForUpdate: () => Promise<void>;
  dismissUpdate: () => void;
}

const ForceUpdateContext = createContext<ForceUpdateContextType | undefined>(undefined);

const IS_DEBUG_MODE = checkDebugMode();

// Remote Config key
const REMOTE_CONFIG_KEY = IS_DEBUG_MODE ? 'mobileMinVersionDev' : 'mobileMinVersion';
const MAINTENANCE_CONFIG_KEY = IS_DEBUG_MODE ? 'mobileMaintenanceDev' : 'mobileMaintenance';

// Firebase cache duration in milliseconds
const MINIMUM_FETCH_INTERVAL_MS = IS_DEBUG_MODE
  ? 1 * 60 * 1000 // 1 minutes in debug mode
  : 30 * 60 * 1000; // 30 minutes in production

export const ForceUpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const isInitializedRef = useRef(false);

  const compareVersions = (currentVersion: string, remoteVersionStr: string): boolean => {
    const current = currentVersion.split('.').map(Number);
    const remote = remoteVersionStr.split('.').map(Number);

    for (let i = 0; i < Math.max(current.length, remote.length); i++) {
      const currentPart = current[i] || 0;
      const remotePart = remote[i] || 0;

      if (remotePart > currentPart) {
        return true;
      }
      if (remotePart < currentPart) {
        return false;
      }
    }
    return false;
  };

  const initializeRemoteConfig = useCallback(async () => {
    if (isInitializedRef.current) {
      return;
    }

    try {
      const remoteConfig = getRemoteConfig();
      await setConfigSettings(remoteConfig, {
        minimumFetchIntervalMillis: MINIMUM_FETCH_INTERVAL_MS,
      });

      await setDefaults(remoteConfig, {
        [REMOTE_CONFIG_KEY]: JSON.stringify({
          ios: { version: '1.0.0', forceUpdate: false },
          android: { version: '1.0.0', forceUpdate: false },
        }),
        [MAINTENANCE_CONFIG_KEY]: false,
      });

      isInitializedRef.current = true;
      console.log(`[ForceUpdate] Remote Config initialized (Key: ${REMOTE_CONFIG_KEY})`);
    } catch (error) {
      console.error('[ForceUpdate] Failed to initialize Remote Config:', error);
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    try {
      await initializeRemoteConfig();

      const remoteConfig = getRemoteConfig();
      const fetchedRemotely = await fetchAndActivate(remoteConfig);
      console.log(`[ForceUpdate] Fetched from ${fetchedRemotely ? 'server' : 'cache'}`);

      const configValue = getValue(remoteConfig, REMOTE_CONFIG_KEY);
      const versionData: RemoteConfigVersionData = JSON.parse(configValue.asString());

      const currentVersion = DeviceInfo.getVersion();
      const platform = Platform.OS as 'ios' | 'android';
      const platformConfig = versionData[platform];

      const needsUpdate = compareVersions(currentVersion, platformConfig.version);

      const maintenanceValue = getValue(remoteConfig, MAINTENANCE_CONFIG_KEY);
      const isMaintenance = maintenanceValue.asBoolean();

      console.log(`[ForceUpdate] Maintenance Mode: ${isMaintenance}`);
      setIsMaintenanceMode(isMaintenance);

      if (needsUpdate && !isMaintenance) {
        console.log(`[ForceUpdate] Needs update! (Force: ${platformConfig.forceUpdate})`);
        setShouldUpdate(true);
        setIsForceUpdate(platformConfig.forceUpdate);
        setRemoteVersion(platformConfig.version);
      } else {
        setShouldUpdate(false);
        setIsForceUpdate(false);
        setRemoteVersion('');
      }
    } catch (error) {
      console.error('[ForceUpdate] Error checking for updates:', error);
    }
  }, [initializeRemoteConfig]);

  const dismissUpdate = useCallback(() => {
    if (!isForceUpdate) {
      setShouldUpdate(false);
      setRemoteVersion('');
    }
  }, [isForceUpdate]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        checkForUpdate();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [checkForUpdate]);

  const value: ForceUpdateContextType = {
    shouldUpdate,
    isForceUpdate,
    remoteVersion,
    isMaintenanceMode,
    checkForUpdate,
    dismissUpdate,
  };

  return <ForceUpdateContext.Provider value={value}>{children}</ForceUpdateContext.Provider>;
};

export const useForceUpdate = (): ForceUpdateContextType => {
  const context = useContext(ForceUpdateContext);
  if (!context) {
    throw new Error('useForceUpdate must be used within ForceUpdateProvider');
  }
  return context;
};
