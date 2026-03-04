// Bottom tab navigator with professional icons and Emerald/Zinc theming
// Uses React Navigation for smooth tab transitions

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text, View } from 'react-native';

// Import screens
import AnalyticsScreen from '../app/screens/AnalyticsScreen';
import DashboardScreen from '../app/screens/DashboardScreen';
import SettingsScreen from '../app/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Professional tab icon component
const TabIcon = ({ name, focused, size = 20 }: { name: string; focused: boolean; size?: number }) => {
  const getIconProps = () => {
    switch (name) {
      case 'Dashboard':
        return {
          IconComponent: MaterialIcons,
          iconName: 'dashboard' as any,
        };
      case 'Analytics':
        return {
          IconComponent: Ionicons,
          iconName: 'analytics' as any,
        };
      case 'Settings':
        return {
          IconComponent: Ionicons,
          iconName: 'settings' as any,
        };
      default:
        return {
          IconComponent: MaterialIcons,
          iconName: 'home' as any,
        };
    }
  };

  const { IconComponent, iconName } = getIconProps();
  
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 60 }}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: focused ? '#34d399' : 'transparent',
          marginBottom: 4,
          shadowColor: focused ? '#34d399' : 'transparent',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: focused ? 0.4 : 0,
          shadowRadius: 6,
          elevation: focused ? 6 : 0,
          transform: [{ scale: focused ? 1.1 : 1 }],
        }}
      >
        <IconComponent
          name={iconName}
          size={focused ? 22 : 20}
          color={focused ? '#09090b' : '#71717a'}
        />
      </View>
      <Text 
        style={{ 
          fontSize: 22, 
          fontWeight: focused ? '800' : '700',
          color: focused ? '#34d399' : '#71717a',
          marginTop: 1,
          textAlign: 'center',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.7}
      >
        {name}
      </Text>
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#09090b', // zinc-950 - professional dark
          borderTopColor: '#27272a', // zinc-800 - subtle border
          borderTopWidth: 0.5,
          height: 120,
          paddingBottom: 12,
          paddingTop: 12,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 16,
          opacity: 0.98,
        },
        tabBarActiveTintColor: '#34d399', // emerald-400
        tabBarInactiveTintColor: '#71717a', // zinc-500
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Analytics" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Settings" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}