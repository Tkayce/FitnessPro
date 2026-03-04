// Settings screen for health permissions and app preferences
// Manages Health Connect/HealthKit permissions and sync settings

import React, { useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    Switch,
    Text,
    View
} from 'react-native';
import { s } from 'react-native-wind';
import { useFitnessStore } from '../store/fitness';

export default function SettingsScreen() {
  const {
    permissions,
    syncStatus,
    requestPermissions,
    syncHealthData,
    clearCache
  } = useFitnessStore();
  
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Health data permissions granted successfully!');
    } else {
      Alert.alert(
        'Permission Required',
        `Please enable health data access in your device settings to sync fitness data. Go to Settings > Health${Platform.OS === 'android' ? ' Connect' : 'Kit'} > FitnessPro.`
      );
    }
  };

  const handleSyncNow = async () => {
    try {
      await syncHealthData();
      Alert.alert('Sync Complete', 'Your fitness data has been synced successfully.');
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync health data. Please try again.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will remove all cached fitness data from the app. Your original data will remain safe in Health Connect/HealthKit. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCache();
            Alert.alert('Data Cleared', 'All cached data has been removed.');
          }
        }
      ]
    );
  };

  const SettingItem: React.FC<{
    title: string;
    description?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    accessory?: string;
    color?: 'default' | 'destructive';
  }> = ({ title, description, value, onValueChange, onPress, accessory, color = 'default' }) => {
    return (
      <Pressable
        style={s`bg-zinc-800/50 border border-zinc-700 rounded-2xl p-4 mb-3`}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={s`flex-row items-center justify-between`}>
          <View style={s`flex-1 mr-3`}>
            <Text style={s`font-semibold ${color === 'destructive' ? 'text-red-400' : 'text-white'}`}>
              {title}
            </Text>
            {description && (
              <Text style={s`text-zinc-400 text-sm mt-1`}>{description}</Text>
            )}
          </View>
          
          {onValueChange && value !== undefined && (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ false: '#27272a', true: '#34d399' }}
              thumbColor={value ? '#ffffff' : '#71717a'}
            />
          )}
          
          {accessory && (
            <Text style={s`text-zinc-400 text-sm`}>{accessory}</Text>
          )}
          
          {onPress && !onValueChange && (
            <Text style={s`text-emerald-400 text-sm font-medium`}>›</Text>
          )}
        </View>
      </Pressable>
    );
  };

  const getPermissionStatus = (): string => {
    const grantedCount = Object.values(permissions).filter(Boolean).length;
    const totalCount = Object.keys(permissions).length;
    
    if (grantedCount === 0) return 'No permissions granted';
    if (grantedCount === totalCount) return 'All permissions granted';
    return `${grantedCount}/${totalCount} permissions granted`;
  };

  const getLastSyncText = (): string => {
    if (!syncStatus.lastSync) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - syncStatus.lastSync.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24)} days ago`;
    } else if (diffHours >= 1) {
      return `${diffHours} hours ago`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes} minutes ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <View style={s`flex-1 bg-zinc-950`}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s`px-6 pt-12 pb-6`}>
          <Text style={s`text-white text-2xl font-bold mb-2`}>Settings</Text>
          <Text style={s`text-zinc-400 text-sm`}>
            Manage permissions, sync, and app preferences
          </Text>
        </View>

        <View style={s`px-6`}>
          {/* Health Data Section */}
          <View style={s`mb-6`}>
            <Text style={s`text-white text-lg font-semibold mb-4`}>Health Data</Text>
            
            <SettingItem
              title="Health Permissions"
              description={getPermissionStatus()}
              onPress={handleRequestPermissions}
            />
            
            <SettingItem
              title="Sync Health Data"
              description={`Last sync: ${getLastSyncText()}`}
              onPress={handleSyncNow}
            />
            
            <SettingItem
              title="Auto Sync"
              description="Automatically sync health data every hour"
              value={autoSync}
              onValueChange={setAutoSync}
            />
          </View>

          {/* App Preferences Section */}
          <View style={s`mb-6`}>
            <Text style={s`text-white text-lg font-semibold mb-4`}>Preferences</Text>
            
            <SettingItem
              title="Push Notifications"
              description="Get reminders and achievement notifications"
              value={notifications}
              onValueChange={setNotifications}
            />
            
            {/* Platform specific info */}
            <SettingItem
              title={`Health ${Platform.OS === 'android' ? 'Connect' : 'Kit'} Integration`}
              description={`Connected to ${Platform.OS === 'android' ? 'Google Health Connect' : 'Apple HealthKit'}`}
              accessory={permissions.steps ? '✓ Active' : '⚠ Inactive'}
            />
          </View>

          {/* Data Management Section */}
          <View style={s`mb-6`}>
            <Text style={s`text-white text-lg font-semibold mb-4`}>Data Management</Text>
            
            <SettingItem
              title="Clear Cache"
              description="Remove all cached data (original data stays safe)"
              onPress={handleClearData}
              color="destructive"
            />
          </View>

          {/* App Info Section */}
          <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
            <Text style={s`text-white text-lg font-semibold mb-4`}>About FitnessPro</Text>
            
            <View style={s`mb-3`}>
              <Text style={s`text-zinc-500 text-sm`}>Version</Text>
              <Text style={s`text-white font-medium`}>1.0.0</Text>
            </View>
            
            <View style={s`mb-3`}>
              <Text style={s`text-zinc-500 text-sm`}>Data Sources</Text>
              <Text style={s`text-white font-medium`}>
                {Platform.OS === 'android' ? 'Google Health Connect' : 'Apple HealthKit'}, Expo Sensors
              </Text>
            </View>
            
            <View>
              <Text style={s`text-zinc-500 text-sm`}>Privacy</Text>
              <Text style={s`text-zinc-400 text-xs mt-1`}>
                All health data is stored locally on your device. We never send your personal health information to external servers.
              </Text>
            </View>
          </View>

          {/* Sync Status Indicator */}
          {syncStatus.isSyncing && (
            <View style={s`bg-emerald-400/10 border border-emerald-400/20 p-4 rounded-2xl mb-4`}>
              <View style={s`flex-row items-center`}>
                <Text style={s`text-emerald-400 mr-2`}>🔄</Text>
                <View style={s`flex-1`}>
                  <Text style={s`text-emerald-400 font-medium`}>Syncing health data...</Text>
                  <Text style={s`text-emerald-300 text-sm`}>
                    {syncStatus.syncProgress}% complete
                  </Text>
                </View>
              </View>
            </View>
          )}

          {syncStatus.error && (
            <View style={s`bg-red-400/10 border border-red-400/20 p-4 rounded-2xl mb-4`}>
              <View style={s`flex-row items-center`}>
                <Text style={s`text-red-400 mr-2`}>⚠️</Text>
                <View style={s`flex-1`}>
                  <Text style={s`text-red-400 font-medium`}>Sync Error</Text>
                  <Text style={s`text-red-300 text-sm`}>{syncStatus.error}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}