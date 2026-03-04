// Main App entry point for FitnessPro
// Professional fitness tracking app with React Navigation

import { StatusBar } from 'expo-status-bar';
import React from 'react';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#09090b" />
      <AppNavigator />
    </>
  );
}