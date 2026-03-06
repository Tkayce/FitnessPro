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
import { useTheme, useThemeStore } from '../store/theme';

export default function SettingsScreen() {
  const {
    permissions,
    syncStatus,
    requestPermissions,
    syncHealthData,
    clearCache
  } = useFitnessStore();
  
  const { colors, isDark } = useTheme();
  const { toggleTheme, colorScheme } = useThemeStore();
  
  const [autoSync, setAutoSync] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleRequestPermissions = async () => {
    const granted = await requestPermissions();
    if (granted) {
      Alert.alert('Success', 'Step tracking permissions granted successfully!');
    } else {
      Alert.alert(
        'Permission Required',
        `Please enable activity recognition in your device settings to track steps. Go to Settings > Apps > FitnessPro > Permissions.`
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
            try {
              await clearCache();
              Alert.alert('Data Cleared', 'All cached data has been removed.');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache. Please try again.');
            }
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
        style={[s`p-4 mb-3 rounded-2xl`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={s`flex-row items-center justify-between`}>
          <View style={s`flex-1 mr-3`}>
            <Text style={[s`font-semibold`, { color: color === 'destructive' ? colors.error : colors.text }]}>
              {title}
            </Text>
            {description && (
              <Text style={[s`text-sm mt-1`, { color: colors.textSecondary }]}>{description}</Text>
            )}
          </View>
          
          {onValueChange && value !== undefined && (
            <Switch
              value={value}
              onValueChange={onValueChange}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={value ? '#ffffff' : colors.textTertiary}
            />
          )}
          
          {accessory && (
            <Text style={[s`text-sm`, { color: colors.textSecondary }]}>{accessory}</Text>
          )}
          
          {onPress && !onValueChange && (
            <Text style={[s`text-sm font-medium`, { color: colors.primary }]}>›</Text>
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
    return `${grantedCount.toString()}/${totalCount.toString()} permissions granted`;
  };

  const getLastSyncText = (): string => {
    if (!syncStatus.lastSync) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - syncStatus.lastSync.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours >= 24) {
      return `${Math.floor(diffHours / 24).toString()} days ago`;
    } else if (diffHours >= 1) {
      return `${diffHours.toString()} hours ago`;
    } else if (diffMinutes >= 1) {
      return `${diffMinutes.toString()} minutes ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <View style={[s`flex-1`, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s`px-6 pt-12 pb-6`}>
          <Text style={[s`text-2xl font-bold mb-2`, { color: colors.text }]}>Settings</Text>
          <Text style={[s`text-sm`, { color: colors.textSecondary }]}>
            Manage permissions, sync, and app preferences
          </Text>
        </View>

        <View style={s`px-6`}>
          {/* Appearance Section */}
          <View style={s`mb-6`}>
            <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Appearance</Text>
            
            <SettingItem
              title="Dark Mode"
              description={`Currently using ${colorScheme === 'dark' ? 'dark' : 'light'} theme`}
              value={isDark}
              onValueChange={toggleTheme}
            />
          </View>

          {/* Health Data Section */}
          <View style={s`mb-6`}>
            <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Health Data</Text>
            
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
            <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Preferences</Text>
            
            <SettingItem
              title="Push Notifications"
              description="Get reminders and achievement notifications"
              value={notifications}
              onValueChange={setNotifications}
            />
            
            {/* Platform specific info */}
            <SettingItem
              title={`Health ${Platform.OS === 'android' ? 'Sensors' : 'Sensors'} Integration`}
              description={`Using Expo Pedometer for step tracking`}
              accessory={permissions.steps ? '✓ Active' : '⚠ Inactive'}
            />
          </View>

          {/* Data Management Section */}
          <View style={s`mb-6`}>
            <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Data Management</Text>
            
            <SettingItem
              title="Clear Cache"
              description="Remove all cached data (original data stays safe)"
              onPress={handleClearData}
              color="destructive"
            />
          </View>

          {/* App Info Section */}
          <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>About FitnessPro</Text>
            
            <View style={s`mb-3`}>
              <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Version</Text>
              <Text style={[s`font-medium`, { color: colors.text }]}>1.0.0</Text>
            </View>
            
            <View style={s`mb-3`}>
              <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Data Sources</Text>
              <Text style={[s`font-medium`, { color: colors.text }]}>
                Expo Pedometer (Steps & Activity)
              </Text>
              <Text style={[s`text-xs mt-1`, { color: colors.textSecondary }]}>
                Calories calculated from steps (~0.04 cal/step)
              </Text>
            </View>
            
            <View>
              <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Privacy</Text>
              <Text style={[s`text-xs mt-1`, { color: colors.textSecondary }]}>
                All health data is stored locally on your device. We never send your personal health information to external servers.
              </Text>
            </View>
          </View>

          {/* Sync Status Indicator */}
          {syncStatus.isSyncing && (
            <View style={[s`p-4 rounded-2xl mb-4`, { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary + '33' }]}>
              <View style={s`flex-row items-center`}>
                <Text style={s`mr-2`}>🔄</Text>
                <View style={s`flex-1`}>
                  <Text style={[s`font-medium`, { color: colors.primary }]}>Syncing health data...</Text>
                  <Text style={[s`text-sm`, { color: colors.primary }]}>
                    {syncStatus.syncProgress}% complete
                  </Text>
                </View>
              </View>
            </View>
          )}

          {syncStatus.error && (
            <View style={[s`p-4 rounded-2xl mb-4`, { backgroundColor: colors.error + '1A', borderWidth: 1, borderColor: colors.error + '33' }]}>
              <View style={s`flex-row items-center`}>
                <Text style={s`mr-2`}>⚠️</Text>
                <View style={s`flex-1`}>
                  <Text style={[s`font-medium`, { color: colors.error }]}>Sync Error</Text>
                  <Text style={[s`text-sm`, { color: colors.error }]}>{syncStatus.error}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}