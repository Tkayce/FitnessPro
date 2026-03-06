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
import { useTheme } from '../app/store/theme';

const Tab = createBottomTabNavigator();

// Professional tab icon component
const TabIcon = ({ name, focused, size = 20, colors, isDark }: { name: string; focused: boolean; size?: number; colors: any; isDark: boolean }) => {
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
          backgroundColor: focused ? colors.primary : 'transparent',
          marginBottom: 4,
          shadowColor: focused ? colors.primary : 'transparent',
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
          color={focused ? (isDark ? colors.background : '#ffffff') : colors.textTertiary}
        />
      </View>
      <Text 
        style={{ 
          fontSize: 7, 
          fontWeight: focused ? '600' : '500',
          color: focused ? colors.primary : colors.textTertiary,
          marginTop: 2,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
};

export default function BottomTabNavigator() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 120,
          paddingBottom: 1,
          paddingTop: 12,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 16,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Dashboard" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Analytics" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ focused }: { focused: boolean }) => (
            <TabIcon name="Settings" focused={focused} colors={colors} isDark={isDark} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}