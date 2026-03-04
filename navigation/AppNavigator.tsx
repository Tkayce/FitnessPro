// Main app navigator - Root navigation container
// Sets up React Navigation with proper theme and structure

import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import React from 'react';
import BottomTabNavigator from './BottomTabNavigator';

// Custom dark theme matching our Emerald/Zinc design system
const FitnessTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#34d399', // emerald-400
    background: '#09090b', // zinc-950
    card: '#18181b', // zinc-900
    text: '#ffffff', // white
    border: '#27272a', // zinc-800
    notification: '#f59e0b', // amber-500
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={FitnessTheme}>
      <BottomTabNavigator />
    </NavigationContainer>
  );
}