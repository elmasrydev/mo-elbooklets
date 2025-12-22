import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

const AppContent: React.FC = () => {
  return (
    <NavigationContainer>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Testing AppContent</Text>
      </View>
    </NavigationContainer>
  );
};

export default AppContent;
