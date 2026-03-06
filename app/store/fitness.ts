// Zustand store for fitness app state management
// Manages health data, sync status, and app state with TypeScript support

import { Platform } from 'react-native';
import { create } from 'zustand';
import { databaseService } from '../services/database';
import { healthConnectService } from '../services/healthConnect';
import { healthKitService } from '../services/healthKit';
import { DailySummary, HealthPermissions, SyncStatus, WeeklyAnalytics, WorkoutSession } from '../types/fitness';

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
  
  // Step tracking session
  isTrackingSteps: boolean;
  sessionSteps: number;
  sessionStartTime: Date | null;
  
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
  
  // Step tracking controls
  startStepTracking: () => boolean;
  stopStepTracking: () => Promise<void>;
  updateSessionSteps: () => void;
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
  
  isTrackingSteps: false,
  sessionSteps: 0,
  sessionStartTime: null,
  
  isLoading: false,
  selectedDate: new Date().toISOString().split('T')[0],
  
  // Initialize app - setup database and check permissions
  initializeApp: async () => {
    const { setLoading, loadDailySummaries, loadWorkoutSessions, loadTodaysSummary, startStepTracking } = get();
    
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
      
      // Restore active tracking session if exists
      const activeSession = await databaseService.getActiveSession();
      if (activeSession) {
        console.log('♻️ Restoring active tracking session...');
        
        // Restart tracking with restored session data
        let success = false;
        if (Platform.OS === 'android') {
          success = healthConnectService.startTracking();
        } else if (Platform.OS === 'ios') {
          success = healthKitService.startTracking();
        }
        
        if (success) {
          set({
            isTrackingSteps: true,
            sessionSteps: activeSession.steps,
            sessionStartTime: activeSession.startTime
          });
          console.log(`✅ Restored session: ${activeSession.steps} steps from ${activeSession.startTime.toLocaleTimeString()}`);
        } else {
          // Clear invalid session
          await databaseService.clearActiveSession();
        }
      }
      
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
            heartRate: false, // Not available via Pedometer
            sleep: false, // Sleep tracking removed
            workouts: false // Workout tracking removed
          }
        }));
        console.log('✅ Step tracking permissions granted');
      } else {
        console.log('❌ Step tracking permissions denied');
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
      set((state) => ({
        dailySummaries: [],
        workoutSessions: [],
        todaySummary: null,
        weeklyAnalytics: null,
        syncStatus: {
          ...state.syncStatus,
          lastSync: null,
          syncProgress: 0
        }
      }));
      console.log('🗑️ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      throw error;
    }
  },
  
  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  // Start step tracking session
  startStepTracking: () => {
    const { permissions } = get();
    
    if (!permissions.steps) {
      console.log('❌ Step permissions not granted');
      return false;
    }
    
    let success = false;
    
    if (Platform.OS === 'android') {
      success = healthConnectService.startTracking();
    } else if (Platform.OS === 'ios') {
      success = healthKitService.startTracking();
    }
    
    if (success) {
      const startTime = new Date();
      set({
        isTrackingSteps: true,
        sessionSteps: 0,
        sessionStartTime: startTime
      });
      
      // Save session to database
      databaseService.saveActiveSession({ startTime, steps: 0 });
      console.log('✅ Step tracking session started');
    }
    
    return success;
  },
  
  // Stop step tracking session
  stopStepTracking: async () => {
    try {
      let session = null;
      
      if (Platform.OS === 'android') {
        session = healthConnectService.stopTracking();
      } else if (Platform.OS === 'ios') {
        session = await healthKitService.stopTracking();
      }
      
      if (session && session.startTime && session.steps > 0) {
        console.log(`📊 Session completed: ${session.steps} steps`);
        
        // Calculate duration in minutes
        const durationMs = session.endTime.getTime() - session.startTime.getTime();
        const durationMinutes = Math.round(durationMs / 60000);
        
        // Create workout session from step tracking
        const workoutSession: WorkoutSession = {
          id: `walking_${session.endTime.getTime()}`,
          type: 'walking',
          startTime: session.startTime,
          endTime: session.endTime,
          duration: durationMinutes,
          steps: session.steps,
          distance: Math.round(session.steps * 0.0008 * 100) / 100, // km
          calories: Math.round(session.steps * 0.04),
          notes: `Step tracking session: ${session.steps.toLocaleString()} steps`
        };
        
        // Save workout to database
        await databaseService.saveWorkoutSession(workoutSession);
        console.log(`💾 Saved walking activity: ${workoutSession.steps} steps, ${workoutSession.duration}min`);
        
        // Reload workouts to update UI
        await get().loadWorkoutSessions(20);
        
        // Update today's daily summary with accumulated steps
        const today = new Date().toISOString().split('T')[0];
        let todaySummary = await databaseService.getDailySummaryByDate(today);
        
        if (!todaySummary) {
          // Create new daily summary for today
          todaySummary = {
            date: today,
            steps: 0,
            stepsGoal: 10000,
            distance: 0,
            calories: 0,
            caloriesGoal: 2000,
            activeMinutes: 0,
            activeMinutesGoal: 30,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        // Add session steps to today's total
        todaySummary.steps += session.steps;
        todaySummary.distance = Math.round(todaySummary.steps * 0.0008 * 100) / 100;
        todaySummary.calories += workoutSession.calories;
        todaySummary.activeMinutes += durationMinutes;
        todaySummary.updatedAt = new Date();
        
        // Save updated daily summary
        await databaseService.saveDailySummary(todaySummary);
        console.log(`📈 Updated today's summary: ${todaySummary.steps} total steps`);
        
        // Reload today's summary to update UI
        await get().loadTodaysSummary();
      }
      
      // Clear active session from database
      await databaseService.clearActiveSession();
      
      set({
        isTrackingSteps: false,
        sessionSteps: session?.steps || 0,
        sessionStartTime: null
      });
      
      console.log('⏹️ Step tracking session stopped');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
    }
  },
  
  // Update session steps (call periodically while tracking)
  updateSessionSteps: () => {
    const { isTrackingSteps, sessionStartTime } = get();
    
    if (!isTrackingSteps || !sessionStartTime) return;
    
    let status;
    
    if (Platform.OS === 'android') {
      status = healthConnectService.getTrackingStatus();
    } else if (Platform.OS === 'ios') {
      status = healthKitService.getTrackingStatus();
    }
    
    if (status) {
      set({ sessionSteps: status.steps });
      
      // Save updated session to database every update
      databaseService.saveActiveSession({ 
        startTime: sessionStartTime, 
        steps: status.steps 
      });
    }
  }
}));

// Computed selectors for derived state
export const useFitnessSelectors = () => {
  const store = useFitnessStore();
  
  // Calculate current steps including active session
  const currentSteps = store.todaySummary 
    ? store.todaySummary.steps + (store.isTrackingSteps ? store.sessionSteps : 0)
    : (store.isTrackingSteps ? store.sessionSteps : 0);
  
  const stepsGoal = store.todaySummary?.stepsGoal || 10000;
  
  return {
    // Today's goal progress
    stepsProgress: {
      current: currentSteps,
      target: stepsGoal,
      percentage: Math.round((currentSteps / stepsGoal) * 100),
      trend: 'up' as const,
      trendPercentage: 12 // Mock trend for now
    },
    
    // Distance progress (calculated from steps: ~0.0008 km per step)
    distanceProgress: {
      current: Math.round(currentSteps * 0.0008 * 100) / 100,
      target: 8, // 8 km target (~10,000 steps)
      percentage: Math.round((currentSteps * 0.0008 / 8) * 100),
      trend: 'up' as const,
      trendPercentage: 12
    },
    
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
      ? `Syncing... ${(store.syncStatus.syncProgress || 0).toString()}%`
      : store.syncStatus.lastSync 
        ? `Last sync: ${store.syncStatus.lastSync.toLocaleDateString()}`
        : 'Never synced'
  };
};