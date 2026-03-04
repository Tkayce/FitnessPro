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
import { WorkoutSession } from '../types/fitness';

export default function DashboardScreen() {
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
    workoutSessions
  } = useFitnessStore();

  // Computed selectors
  const {
    stepsProgress,
    sleepProgress,
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
    <View style={s`flex-1 bg-zinc-950`}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={syncStatus.isSyncing}
            onRefresh={handleRefresh}
            tintColor="#34d399" // emerald-400
            colors={['#34d399']}
            progressBackgroundColor="#18181b" // zinc-900
          />
        }
      >
        {/* Enhanced Header with Gradient */}
        <LinearGradient
          colors={['#0c0c0c', '#18181b', '#09090b']}
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
              <Text style={s`text-zinc-400 text-sm font-medium tracking-wide`}>
                {getGreeting()}
              </Text>
              <Text style={s`text-white text-3xl font-bold mt-2 tracking-tight`}>
                FitnessPro
              </Text>
              <Text style={s`text-zinc-500 text-sm mt-1`}>{todayDate}</Text>
            </View>
            
            {/* Profile/Settings icon */}
            <Pressable 
              style={s`w-10 h-10 bg-zinc-800/50 rounded-full items-center justify-center`}
            >
              <Ionicons name="person-circle-outline" size={20} color="#71717a" />
            </Pressable>
          </View>
          
          {/* Enhanced sync status */}
          <View style={s`flex-row items-center justify-between mt-2`}>
            <View style={s`flex-row items-center`}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: needsSync ? '#f59e0b' : '#34d399',
                marginRight: 8
              }} />
              <Text style={s`text-zinc-400 text-xs font-medium`}>{syncStatusText}</Text>
            </View>
            
            {needsSync && (
              <Pressable 
                onPress={handleRefresh}
                style={{
                  backgroundColor: 'rgba(52, 211, 153, 0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(52, 211, 153, 0.3)'
                }}
              >
                <Text style={s`text-emerald-400 text-xs font-semibold`}>Sync Now</Text>
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {/* Main content with enhanced spacing */}
        <View style={s`px-6 mt-6`}>
          {/* Steps Ring - Hero metric with enhanced styling */}
          {stepsProgress && (
            <View style={s`mb-8 bg-zinc-900/30 rounded-3xl p-6 border border-zinc-800/50`}>
              <Text style={s`text-zinc-400 text-sm font-semibold mb-4 tracking-wide`}>
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
            <Text style={s`text-white text-lg font-bold`}>Health Metrics</Text>
            <Ionicons name="chevron-forward" size={16} color="#71717a" />
          </View>

          {/* Health metric cards row with enhanced styling */}
          <View style={s`flex-row gap-4 mb-6`}>
            {sleepProgress && (
              <View style={s`flex-1`}>
                <HealthMetricCard
                  title="Sleep"
                  value={sleepProgress.current.toFixed(1)}
                  unit="hrs"
                  trend={{
                    direction: sleepProgress.trend,
                    percentage: sleepProgress.trendPercentage,
                    period: 'last night'
                  }}
                  progress={sleepProgress}
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
            <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
              <Text style={s`text-white text-lg font-semibold mb-4`}>Today's Summary</Text>
              
              <View style={s`flex-row justify-between mb-3`}>
                <View style={s`flex-1`}>
                  <Text style={s`text-zinc-500 text-sm`}>Steps Goal</Text>
                  <Text style={s`text-white font-semibold`}>
                    {todaySummary.steps.toLocaleString()} / {todaySummary.stepsGoal.toLocaleString()}
                  </Text>
                </View>
                <View style={s`flex-1 items-end`}>
                  <Text style={s`text-zinc-500 text-sm`}>Distance</Text>
                  <Text style={s`text-white font-semibold`}>
                    {(todaySummary.distance || 0).toFixed(1)} km
                  </Text>
                </View>
              </View>
              
              <View style={s`flex-row justify-between`}>
                <View style={s`flex-1`}>
                  <Text style={s`text-zinc-500 text-sm`}>Calories</Text>
                  <Text style={s`text-white font-semibold`}>
                    {Math.round(todaySummary.calories || 0).toLocaleString()}
                  </Text>
                </View>
                <View style={s`flex-1 items-end`}>
                  <Text style={s`text-zinc-500 text-sm`}>Workouts</Text>
                  <Text style={s`text-white font-semibold`}>
                    {workoutSessions.filter(w => 
                      w.startTime.toDateString() === new Date().toDateString()
                    ).length}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Welcome message for new users */}
          {!todaySummary && !isLoading && (
            <View style={s`bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] items-center`}>
              <Text style={s`text-4xl mb-3`}>🏃‍♂️</Text>
              <Text style={s`text-white text-lg font-semibold text-center mb-2`}>
                Welcome to FitnessPro!
              </Text>
              <Text style={s`text-zinc-400 text-center text-sm mb-4`}>
                Pull down to sync your health data and start tracking your fitness journey.
              </Text>
              <Pressable 
                onPress={handleRefresh}
                style={s`bg-emerald-400 px-6 py-3 rounded-2xl`}
              >
                <Text style={s`text-zinc-900 font-semibold`}>Get Started</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}