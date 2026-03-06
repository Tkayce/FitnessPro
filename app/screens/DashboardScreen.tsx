// Main fitness dashboard screen with comprehensive health metrics
// Uses Zustand store for state management and react-native-wind for styling

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect } from 'react';
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { s } from 'react-native-wind';
import { ActivityFeed } from '../components/ActivityFeed';
import { HealthMetricCard } from '../components/HealthMetricCard';
import { MetricRing } from '../components/MetricRing';
import { TrendChart } from '../components/TrendChart';
import { useFitnessSelectors, useFitnessStore } from '../store/fitness';
import { useTheme } from '../store/theme';
import { WorkoutSession } from '../types/fitness';

export default function DashboardScreen() {
  const { colors, isDark } = useTheme();
  
  // Zustand store hooks
  const {
    initializeApp,
    requestPermissions,
    syncHealthData,
    loadTodaysSummary,
    calculateWeeklyAnalytics,
    syncStatus,
    permissions,
    isLoading,
    todaySummary,
    workoutSessions,
    isTrackingSteps,
    sessionSteps,
    sessionStartTime,
    startStepTracking,
    stopStepTracking,
    updateSessionSteps
  } = useFitnessStore();

  // Computed selectors
  const {
    stepsProgress,
    distanceProgress,
    caloriesProgress,
    chartData,
    recentWorkouts,
    needsSync,
    syncStatusText
  } = useFitnessSelectors();

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Update session steps periodically when tracking
  useEffect(() => {
    if (!isTrackingSteps) return;
    
    const interval = setInterval(() => {
      updateSessionSteps();
    }, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, [isTrackingSteps, updateSessionSteps]);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    try {
      if (!permissions.steps && !permissions.heartRate) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Please grant health data permissions to sync your fitness data.',
            [{ text: 'OK' }]
          );
          return;
        }
      }
      
      await Promise.all([
        syncHealthData(),
        loadTodaysSummary(),
        calculateWeeklyAnalytics()
      ]);
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert('Sync Error', 'Failed to sync health data. Please try again.');
    }
  }, [permissions, requestPermissions, syncHealthData, loadTodaysSummary, calculateWeeklyAnalytics]);

  // Handle workout press
  const handleWorkoutPress = useCallback((workout: WorkoutSession) => {
    // TODO: Navigate to workout detail screen
    console.log('Workout pressed:', workout.type, workout.id);
  }, []);

  // Handle start tracking
  const handleStartTracking = useCallback(async () => {
    if (!permissions.steps) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Please grant step tracking permissions to start tracking.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    const started = startStepTracking();
    if (!started) {
      Alert.alert('Error', 'Failed to start step tracking. Please try again.');
    }
  }, [permissions, requestPermissions, startStepTracking]);

  // Handle stop tracking
  const handleStopTracking = useCallback(async () => {
    const finalSteps = sessionSteps; // Capture before stopping
    await stopStepTracking();
    Alert.alert(
      'Session Ended',
      `You walked ${finalSteps.toLocaleString()} steps in this session!`,
      [
        {
          text: 'OK',
          onPress: () => loadTodaysSummary()
        }
      ]
    );
  }, [stopStepTracking, sessionSteps, loadTodaysSummary]);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Format today's date
  const todayDate = new Date().toLocaleDateString('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <View style={[s`flex-1`, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={syncStatus.isSyncing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={isDark ? ['#0c0c0c', '#18181b', '#09090b'] : ['#f5f5f5', '#ffffff', '#fafafa']}
          style={{
            paddingHorizontal: 24,
            paddingTop: 48,
            paddingBottom: 24,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          <View style={s`flex-row justify-between items-start mb-4`}>
            <View style={s`flex-1`}>
              <Text style={[s`text-sm font-medium tracking-wide`, { color: colors.textSecondary }]}>
                {getGreeting()}
              </Text>
              <Text style={[s`text-3xl font-bold mt-2 tracking-tight`, { color: colors.text }]}>
                FitnessPro
              </Text>
              <Text style={[s`text-sm mt-1`, { color: colors.textTertiary }]}>{todayDate}</Text>
            </View>
            
            {/* Profile/Settings icon */}
          </View>
          
          {/* Enhanced sync status */}
          <View style={s`flex-row items-center justify-between mt-2`}>
            <View style={s`flex-row items-center`}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: needsSync ? colors.warning : colors.success,
                marginRight: 8
              }} />
              <Text style={[s`text-xs font-medium`, { color: colors.textSecondary }]}>{syncStatusText}</Text>
            </View>
            
            {needsSync && (
              <Pressable 
                onPress={handleRefresh}
                style={{
                  backgroundColor: colors.primaryLight,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.primary + '4D'
                }}
              >
                <Text style={[s`text-xs font-semibold`, { color: colors.primary }]}>Sync Now</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {/* Main content with enhanced spacing */}
        <View style={s`px-6 mt-6`}>
          {/* Live Step Tracking Card */}
          <View style={[s`mb-6 rounded-3xl p-6`, { backgroundColor: colors.card, borderWidth: 1, borderColor: isTrackingSteps ? colors.success : colors.border }]}>
            <View style={s`flex-row items-center justify-between mb-4`}>
              <View style={s`flex-row items-center`}>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: isTrackingSteps ? colors.success : colors.textTertiary,
                  marginRight: 8
                }} />
                <Text style={[s`text-sm font-semibold tracking-wide`, { color: colors.textSecondary }]}>
                  {isTrackingSteps ? 'TRACKING SESSION' : 'STEP TRACKER'}
                </Text>
              </View>
              {isTrackingSteps && sessionStartTime && (
                <Text style={[s`text-xs`, { color: colors.textTertiary }]}>
                  Started {sessionStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
            
            {isTrackingSteps ? (
              <View>
                <View style={s`flex-row items-baseline mb-6`}>
                  <Text style={[s`text-5xl font-bold`, { color: colors.success }]}>
                    {(sessionSteps || 0).toLocaleString()}
                  </Text>
                  <Text style={[s`text-lg ml-2`, { color: colors.textSecondary }]}>steps</Text>
                </View>
                
                <View style={s`flex-row gap-3 mb-4`}>
                  <View style={[s`flex-1 p-3 rounded-2xl`, { backgroundColor: colors.background }]}>
                    <Text style={[s`text-xs`, { color: colors.textTertiary }]}>Distance</Text>
                    <Text style={[s`text-lg font-semibold`, { color: colors.text }]}>
                      {`${((sessionSteps || 0) * 0.0008).toFixed(2)} km`}
                    </Text>
                  </View>
                  <View style={[s`flex-1 p-3 rounded-2xl`, { backgroundColor: colors.background }]}>
                    <Text style={[s`text-xs`, { color: colors.textTertiary }]}>Calories</Text>
                    <Text style={[s`text-lg font-semibold`, { color: colors.text }]}>
                      {Math.round((sessionSteps || 0) * 0.04).toString()}
                    </Text>
                  </View>
                </View>
                
                <Pressable
                  onPress={handleStopTracking}
                  style={[s`py-4 rounded-2xl flex-row items-center justify-center`, { backgroundColor: colors.error }]}
                >
                  <Ionicons name="stop-circle" size={24} color="#ffffff" style={s`mr-2`} />
                  <Text style={[s`font-bold text-base`, { color: '#ffffff' }]}>Stop Tracking</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={[s`text-sm mb-6`, { color: colors.textSecondary }]}>
                  Start a tracking session to count your steps in real-time. Perfect for walks, runs, or daily activities!
                </Text>
                
                <Pressable
                  onPress={handleStartTracking}
                  style={[s`py-4 rounded-2xl flex-row items-center justify-center`, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="play-circle" size={24} color={isDark ? colors.background : '#ffffff'} style={s`mr-2`} />
                  <Text style={[s`font-bold text-base`, { color: isDark ? colors.background : '#ffffff' }]}>Start Tracking</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Steps Ring - Hero metric with enhanced styling */}
          {stepsProgress && (
            <View style={[s`mb-8 rounded-3xl p-6`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[s`text-sm font-semibold mb-4 tracking-wide`, { color: colors.textSecondary }]}>
                TODAY'S PROGRESS
              </Text>
              <MetricRing
                progress={stepsProgress}
                title="Daily Steps"
                color="emerald"
                size={140}
              />
            </View>
          )}

          {/* Health metrics section header */}
          <View style={s`flex-row items-center justify-between mb-4`}>
            <Text style={[s`text-lg font-bold`, { color: colors.text }]}>Health Metrics</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </View>

          {/* Health metric cards row with enhanced styling */}
          <View style={s`flex-row gap-4 mb-6`}>
            {distanceProgress && (
              <View style={s`flex-1`}>
                <HealthMetricCard
                  title="Distance"
                  value={distanceProgress.current.toFixed(1)}
                  unit="km"
                  trend={{
                    direction: distanceProgress.trend,
                    percentage: distanceProgress.trendPercentage,
                    period: 'today'
                  }}
                  progress={distanceProgress}
                  color="blue"
                />
              </View>
            )}
            
            {caloriesProgress && (
              <View style={s`flex-1`}>
                <HealthMetricCard
                  title="Calories"
                  value={Math.round(caloriesProgress.current).toString()}
                  trend={{
                    direction: caloriesProgress.trend,
                    percentage: caloriesProgress.trendPercentage,
                    period: 'today'
                  }}
                  progress={caloriesProgress}
                  color="orange"
                />
              </View>
            )}
          </View>

          {/* Heart Rate Card with enhanced styling */}
          {todaySummary?.heartRate && (
            <View style={s`mb-6`}>
              <HealthMetricCard
                title="Heart Rate"
                value={Math.round(todaySummary.heartRate).toString()}
                unit="bpm"
                trend={{
                  direction: 'stable',
                  percentage: 3,
                  period: 'avg today'
                }}
                color="purple"
              />
            </View>
          )}

          {/* 7-Day Trend Chart */}
          {chartData.length > 0 && (
            <TrendChart
              title="7-Day Steps Trend"
              data={chartData}
              color="emerald"
              unit="steps"
            />
          )}

          {/* Activity Feed */}
          <ActivityFeed
            workouts={recentWorkouts}
            onWorkoutPress={handleWorkoutPress}
            maxItems={5}
          />

          {/* Quick Stats Summary */}
          {todaySummary && (
            <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Today's Summary</Text>
              
              <View style={s`flex-row justify-between mb-3`}>
                <View style={s`flex-1`}>
                  <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Steps Goal</Text>
                  <Text style={[s`font-semibold`, { color: colors.text }]}>
                    {todaySummary.steps.toLocaleString()} / {todaySummary.stepsGoal.toLocaleString()}
                  </Text>
                </View>
                <View style={s`flex-1 items-end`}>
                  <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Distance</Text>
                  <Text style={[s`font-semibold`, { color: colors.text }]}>
                    {`${(todaySummary.distance || 0).toFixed(1)} km`}
                  </Text>
                </View>
              </View>
              
              <View style={s`flex-row justify-between`}>
                <View style={s`flex-1`}>
                  <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Calories</Text>
                  <Text style={[s`font-semibold`, { color: colors.text }]}>
                    {Math.round(todaySummary.calories || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={s`flex-1 items-end`}>
                  <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Workouts</Text>
                  <Text style={[s`font-semibold`, { color: colors.text }]}>
                    {workoutSessions.filter(w => 
                      w.startTime.toDateString() === new Date().toDateString()
                    ).length.toString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Welcome message for new users */}
          {!todaySummary && !isLoading && (
            <View style={[s`p-6 rounded-[32px] items-center`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={s`text-4xl mb-3`}>🏃‍♂️</Text>
              <Text style={[s`text-lg font-semibold text-center mb-2`, { color: colors.text }]}>
                Welcome to FitnessPro!
              </Text>
              <Text style={[s`text-center text-sm mb-4`, { color: colors.textSecondary }]}>
                Pull down to sync your health data and start tracking your fitness journey.
              </Text>
              <Pressable 
                onPress={handleRefresh}
                style={[s`px-6 py-3 rounded-2xl`, { backgroundColor: colors.primary }]}
              >
                <Text style={[s`font-semibold`, { color: isDark ? colors.background : '#ffffff' }]}>Get Started</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}