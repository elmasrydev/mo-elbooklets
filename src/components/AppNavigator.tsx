import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import ParentLoginScreen from '../screens/ParentLoginScreen';
import ParentRegisterScreen from '../screens/ParentRegisterScreen';
import ParentTabNavigator from './ParentTabNavigator';
import InternalSettingsScreen from '../screens/InternalSettingsScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import ProfileCompletionPrompt from './ProfileCompletionPrompt';
import RegistrationSuccessScreen from '../screens/RegistrationSuccessScreen';
import PackagesScreen from '../screens/payment/PackagesScreen';
import PaymobCheckoutScreen from '../screens/payment/PaymobCheckoutScreen';

const RootStack = createNativeStackNavigator();

const AppNavigator: React.FC = () => {
  const {
    isLoading,
    isAuthenticated,
    userRole,
    user,
    parentUser,
    isVerificationSkipped,
    showRegistrationSuccess,
  } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = (authenticated: boolean) => {
    setShowSplash(false);
  };

  // Show splash screen while loading or during initial delay
  if (isLoading || showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          userRole === 'parent' ? (
            // `null` is the server saying "not verified"; `undefined` means the
            // record predates the gate and is being backfilled — gating on that
            // would lock every already-verified parent out after an upgrade.
            parentUser?.mobile_verified_at === null && !isVerificationSkipped ? (
              <RootStack.Group>
                <RootStack.Screen
                  name="OTPVerification"
                  component={OTPVerificationScreen}
                  initialParams={{ audience: 'parent' }}
                />
              </RootStack.Group>
            ) : (
              <RootStack.Group>
                <RootStack.Screen name="ParentMain" component={ParentTabNavigator} />
              </RootStack.Group>
            )
          ) : !user?.mobile_verified_at && !isVerificationSkipped ? (
            <RootStack.Group>
              <RootStack.Screen
                name="OTPVerification"
                component={OTPVerificationScreen}
                initialParams={{ audience: 'student' }}
              />
            </RootStack.Group>
          ) : showRegistrationSuccess ? (
            <RootStack.Group>
              <RootStack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
            </RootStack.Group>
          ) : (
            <RootStack.Group>
              <RootStack.Screen name="MainTabs" component={TabNavigator} />
              <RootStack.Screen name="InternalSettings" component={InternalSettingsScreen} />
              {/* Purchase surface: reachable only while `isPaymentAllowed` is on,
                  which each entry point checks and PackagesScreen re-checks. */}
              <RootStack.Screen name="Packages" component={PackagesScreen} />
              <RootStack.Screen
                name="PaymobCheckout"
                component={PaymobCheckoutScreen}
                options={{ gestureEnabled: false }}
              />
              <RootStack.Screen
                name="ResetPassword"
                component={ForgotPasswordScreen}
                initialParams={{ audience: 'student', fromProfile: true }}
              />
            </RootStack.Group>
          )
        ) : (
          <RootStack.Group>
            <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
            <RootStack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              initialParams={{ audience: 'student' }}
            />
            <RootStack.Screen name="ParentLogin" component={ParentLoginScreen} />
            <RootStack.Screen name="ParentRegister" component={ParentRegisterScreen} />
            <RootStack.Screen
              name="ParentForgotPassword"
              component={ForgotPasswordScreen}
              initialParams={{ audience: 'parent' }}
            />
          </RootStack.Group>
        )}
      </RootStack.Navigator>

      {/* Global one-time check for profile completion — only after mobile is verified */}
      {isAuthenticated &&
        userRole !== 'parent' &&
        (user?.mobile_verified_at || isVerificationSkipped) && (
          <ProfileCompletionPrompt oneTimeAutoShow={true} />
        )}
    </>
  );
};

export default AppNavigator;
