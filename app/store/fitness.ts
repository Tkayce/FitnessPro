// Zustand store for fitness app state management
// Manages health data, sync status, and app state with TypeScript support

import { create } from 'zustand';
import { DailySummary, WorkoutSession, SyncStatus, GoalProgress, WeeklyAnalytics, HealthPermissions } from '../types/fitness';
import { databaseService } from '../services/database';
import { healthConnectService } from '../services/healthConnect';
import { healthKitService } from '../services/healthKit';
import { Platform } from 'react-native';

interface FitnessState {
  // Health data
  dailySummaries: DailySummary[];
  workoutSessions: WorkoutSession[];
  todaySummary: DailySummary | null;
  weeklyAnalytics: WeeklyAnalytics | null;
  
  // Sync status
  syncStatus: SyncStatus;
  
  // Permissions
  permissions: HealthPermissions;
  
  // UI state
  isLoading: boolean;
  selectedDate: string; // ISO date string
  
  // Actions
  initializeApp: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  syncHealthData: () => Promise<void>;
  loadDailySummaries: (limit?: number) => Promise<void>;
  loadWorkoutSessions: (limit?: number) => Promise<void>;
  loadTodaysSummary: () => Promise<void>;
  calculateWeeklyAnalytics: () => Promise<void>;
  updateSelectedDate: (date: string) => void;
  clearCache: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  // Initial state
  dailySummaries: [],
  workoutSessions: [],
  todaySummary: null,
  weeklyAnalytics: null,
  
  syncStatus: {
    isOnline: true,
    lastSync: null,
    isSyncing: false,
    syncProgress: 0
  },
  
  permissions: {
    steps: false,
    heartRate: false,
    sleep: false,
    workouts: false
  },
  
  isLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],
  
  // Initialize app - setup database and check permissions
  initializeApp: async () => {
    const { setLoading, loadDailySummaries, loadWorkoutSessions, loadTodaysSummary } = get();
    
    try {
      setLoading(true);
      console.log('🚀 Initializing FitnessPro app...');
      
      // Initialize database
      await databaseService.initialize();
      
      // Initialize health services based on platform
      if (Platform.OS === 'android') {
        await healthConnectService.initialize();
      } else if (Platform.OS === 'ios') {
        await healthKitService.initialize();
      }
      
      // Load cached data
      await Promise.all([
        loadDailySummaries(30),
        loadWorkoutSessions(20),
        loadTodaysSummary()
      ]);
      
      // Update last sync from database
      const lastSync = await databaseService.getLastSync();
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          lastSync
        }
      }));
      
      console.log('✅ FitnessPro app initialized successfully');
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          error: 'Failed to initialize app'
        }
      }));
    } finally {
      setLoading(false);
    }
  },
  
  // Request health data permissions
  requestPermissions: async () => {
    try {
      console.log('🔐 Requesting health data permissions...');
      
      let granted = false;
      
      if (Platform.OS === 'android') {
        granted = await healthConnectService.requestPermissions();
      } else if (Platform.OS === 'ios') {
        granted = await healthKitService.requestPermissions();
      }
      
      if (granted) {
        set((state) => ({
          permissions: {
            steps: true,
            heartRate: true,
            sleep: true,
            workouts: true
          }
        }));
        console.log('✅ Health data permissions granted');
      } else {
        console.log('❌ Health data permissions denied');
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  },
  
  // Sync health data from platform APIs
  syncHealthData: async () => {
    const { permissions } = get();
    
    if (!permissions.steps && !permissions.heartRate) {
      console.log('⚠️ No health permissions granted, skipping sync');
      return;
    }
    
    try {
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isSyncing: true,
          syncProgress: 0,
          error: undefined
        }
      }));
      
      console.log('🔄 Starting health data sync...');
      
      // Sync data for the last 7 days
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      
      // Update progress
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          syncProgress: 25
        }
      }));
      
      // Create daily summaries
      const summaries: DailySummary[] = [];
      
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        let summary: DailySummary | null = null;
        
        if (Platform.OS === 'android') {
          summary = await healthConnectService.createDailySummary(new Date(date));
        } else if (Platform.OS === 'ios') {
          summary = await healthKitService.createDailySummary(new Date(date));
        }
        
        if (summary) {
          await databaseService.saveDailySummary(summary);
          summaries.push(summary);
        }
      }
      
      // Update progress
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          syncProgress: 75
        }
      }));
      
      // Sync workout sessions
      let workouts: WorkoutSession[] = [];
      if (Platform.OS === 'android') {
        workouts = await healthConnectService.getWorkoutSessions(startDate, endDate);
      } else if (Platform.OS === 'ios') {
        workouts = await healthKitService.getWorkoutSessions(startDate, endDate);
      }
      
      // Save workouts to database
      for (const workout of workouts) {
        await databaseService.saveWorkoutSession(workout);
      }
      
      // Update database sync timestamp
      await databaseService.updateLastSync();
      
      // Reload data from database
      await Promise.all([
        get().loadDailySummaries(30),
        get().loadWorkoutSessions(20),
        get().loadTodaysSummary()
      ]);
      
      // Complete sync
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isSyncing: false,
          syncProgress: 100,
          lastSync: new Date()
        }
      }));
      
      console.log(`✅ Health data sync completed: ${summaries.length} summaries, ${workouts.length} workouts`);
      
    } catch (error) {
      console.error('❌ Health data sync failed:', error);
      set((state) => ({
        syncStatus: {
          ...state.syncStatus,
          isSyncing: false,
          error: 'Sync failed. Please try again.'
        }
      }));
    }
  },
  
  // Load daily summaries from database
  loadDailySummaries: async (limit = 30) => {
    try {
      const summaries = await databaseService.getDailySummaries(limit);
      set({ dailySummaries: summaries });
      console.log(`📊 Loaded ${summaries.length} daily summaries`);
    } catch (error) {
      console.error('❌ Error loading daily summaries:', error);
    }
  },
  
  // Load workout sessions from database
  loadWorkoutSessions: async (limit = 20) => {
    try {
      const workouts = await databaseService.getWorkoutSessions(limit);
      set({ workoutSessions: workouts });
      console.log(`💪 Loaded ${workouts.length} workout sessions`);
    } catch (error) {
      console.error('❌ Error loading workout sessions:', error);
    }
  },
  
  // Load today's summary
  loadTodaysSummary: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todaySummary = await databaseService.getDailySummaryByDate(today);
      set({ todaySummary });
      
      if (todaySummary) {
        console.log(`📈 Loaded today's summary: ${todaySummary.steps} steps`);
      } else {
        console.log('📈 No summary data for today');
      }
    } catch (error) {
      console.error('❌ Error loading today\'s summary:', error);
    }
  },
  
  // Calculate weekly analytics
  calculateWeeklyAnalytics: async () => {
    try {
      const { dailySummaries } = get();
      
      if (dailySummaries.length === 0) {
        return;
      }
      
      // Get last 7 days
      const last7Days = dailySummaries.slice(0, 7);
      
      const totalSteps = last7Days.reduce((sum, day) => sum + day.steps, 0);
      const avgSteps = totalSteps / last7Days.length;
      const totalDistance = last7Days.reduce((sum, day) => sum + (day.distance || 0), 0);
      const totalCalories = last7Days.reduce((sum, day) => sum + (day.calories || 0), 0);
      const totalSleep = last7Days.reduce((sum, day) => sum + (day.sleep || 0), 0);
      const avgSleep = totalSleep / last7Days.length;
      
      // Find most active day
      const mostActiveDay = last7Days.reduce((max, day) => 
        day.steps > max.steps ? day : max, last7Days[0]
      );
      
      // Count goals achieved
      const goalsAchieved = last7Days.filter(day => 
        day.steps >= day.stepsGoal || (day.sleep || 0) >= day.sleepGoal
      ).length;
      
      // Calculate streak
      let streakDays = 0;
      for (const day of last7Days) {
        if (day.steps >= day.stepsGoal) {
          streakDays++;
        } else {
          break;
        }
      }
      
      const weeklyAnalytics: WeeklyAnalytics = {
        weekStart: last7Days[last7Days.length - 1]?.date || '',
        weekEnd: last7Days[0]?.date || '',
        totalSteps,
        avgSteps: Math.round(avgSteps),
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalCalories: Math.round(totalCalories),
        avgHeartRate: 0, // Calculate from heart rate data when available
        totalSleep: Math.round(totalSleep * 10) / 10,
        avgSleep: Math.round(avgSleep * 10) / 10,
        workoutCount: 0, // Calculate from workout sessions
        mostActiveDay: mostActiveDay?.date || '',
        goalsAchieved,
        streakDays
      };
      
      set({ weeklyAnalytics });
      console.log('📊 Weekly analytics calculated');
      
    } catch (error) {
      console.error('❌ Error calculating weekly analytics:', error);
    }
  },
  
  // Update selected date
  updateSelectedDate: (date: string) => {
    set({ selectedDate: date });
  },
  
  // Clear cached data
  clearCache: async () => {
    try {
      await databaseService.clearCache();
      set({
        dailySummaries: [],
        workoutSessions: [],
        todaySummary: null,
        weeklyAnalytics: null
      });
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  },
  
  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  }
}));

// Computed selectors for derived state
export const useFitnessSelectors = () => {
  const store = useFitnessStore();
  
  return {
    // Today's goal progress
    stepsProgress: store.todaySummary ? {
      current: store.todaySummary.steps,
      target: store.todaySummary.stepsGoal,
      percentage: Math.round((store.todaySummary.steps / store.todaySummary.stepsGoal) * 100),
      trend: 'up' as const,
      trendPercentage: 12 // Mock trend for now
    } : null,
    
    // Sleep progress
    sleepProgress: store.todaySummary ? {
      current: store.todaySummary.sleep || 0,
      target: store.todaySummary.sleepGoal,
      percentage: Math.round(((store.todaySummary.sleep || 0) / store.todaySummary.sleepGoal) * 100),
      trend: 'up' as const,
      trendPercentage: 8
    } : null,
    
    // Calories progress
    caloriesProgress: store.todaySummary ? {
      current: store.todaySummary.calories || 0,
      target: store.todaySummary.caloriesGoal,
      percentage: Math.round(((store.todaySummary.calories || 0) / store.todaySummary.caloriesGoal) * 100),
      trend: 'up' as const,
      trendPercentage: 15
    } : null,
    
    // Chart data for last 7 days
    chartData: store.dailySummaries.slice(0, 7).reverse().map(summary => ({
      label: new Date(summary.date).toLocaleDateString('en', { weekday: 'short' }),
      value: summary.steps,
      date: summary.date
    })),
    
    // Recent workouts (last 5)
    recentWorkouts: store.workoutSessions.slice(0, 5),
    
    // Sync status indicators
    needsSync: !store.syncStatus.lastSync || 
      (Date.now() - store.syncStatus.lastSync.getTime()) > 2 * 60 * 60 * 1000, // 2 hours
    
    syncStatusText: store.syncStatus.isSyncing 
      ? `Syncing... ${store.syncStatus.syncProgress}%`
      : store.syncStatus.lastSync 
        ? `Last sync: ${store.syncStatus.lastSync.toLocaleDateString()}`
        : 'Never synced'
  };
};