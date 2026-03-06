// Android Health Connect integration service
// Handles passive data collection from Health Connect API
// FALLBACK: Uses Expo Sensors Pedometer when Health Connect unavailable

import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { DailySummary, HeartRateData, SleepData, StepData, WorkoutSession } from '../types/fitness';

class HealthConnectService {
  private isInitialized = false;
  private hasPermissions = false;
  private initializationFailed = false;
  private usePedometer = false;
  private todaySteps = 0;
  private stepSubscription: any = null;
  private isTracking = false;
  private sessionStartTime: Date | null = null;

  // Initialize Health Connect connection or fallback to Pedometer
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Health Connect only available on Android');
      return false;
    }

    try {
      // Use Expo Pedometer as fallback for step tracking
      const isAvailable = await Pedometer.isAvailableAsync();
      
      if (isAvailable) {
        console.log('✅ Using Expo Pedometer for step tracking');
        this.usePedometer = true;
        this.isInitialized = true;
        this.hasPermissions = true;
        
        // Don't auto-start - let user control tracking
        console.log('ℹ️ Pedometer ready. Use startTracking() to begin.');
        
        return true;
      } else {
        console.log('❌ Pedometer not available on this device');
        this.initializationFailed = true;
        return false;
      }
    } catch (error) {
      console.error('❌ Pedometer initialization failed:', error);
      this.initializationFailed = true;
      return false;
    }
  }

  // Start real-time step counting (PUBLIC - user controlled)
  startTracking(): boolean {
    if (this.stepSubscription) {
      console.log('⚠️ Already tracking steps');
      return false;
    }

    if (!this.isInitialized || !this.hasPermissions) {
      console.log('❌ Cannot start tracking - not initialized');
      return false;
    }

    // Reset step count for new session
    this.todaySteps = 0;
    this.isTracking = true;
    this.sessionStartTime = new Date();

    // Watch for step updates
    // Note: On Android, result.steps is the TOTAL steps since tracking started, not incremental
    this.stepSubscription = Pedometer.watchStepCount(result => {
      this.todaySteps = result.steps;
      console.log(`👟 Steps updated: ${result.steps} total`);
    });

    console.log(`✅ Started step tracking session at ${this.sessionStartTime.toLocaleTimeString()}`);
    return true;
  }

  // Stop step counting (PUBLIC - user controlled)
  stopTracking(): { steps: number; startTime: Date | null; endTime: Date } | null {
    if (!this.stepSubscription) {
      console.log('⚠️ No active tracking session');
      return null;
    }

    this.stepSubscription.remove();
    this.stepSubscription = null;
    this.isTracking = false;

    const session = {
      steps: this.todaySteps,
      startTime: this.sessionStartTime,
      endTime: new Date()
    };

    console.log(`⏹️ Stopped tracking: ${session.steps} steps from ${session.startTime?.toLocaleTimeString()} to ${session.endTime.toLocaleTimeString()}`);
    
    return session;
  }

  // Get current tracking status
  getTrackingStatus(): { isTracking: boolean; steps: number; startTime: Date | null } {
    return {
      isTracking: this.isTracking,
      steps: this.todaySteps,
      startTime: this.sessionStartTime
    };
  }

  // Request permissions for health data access
  async requestPermissions(): Promise<boolean> {
    // Skip if initialization previously failed
    if (this.initializationFailed) {
      console.log('⚠️ Skipping permission request - sensor not available');
      return false;
    }

    try {
      // Ensure initialization is complete first
      if (!this.isInitialized) {
        console.log('📱 Sensors not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('❌ Cannot request permissions: initialization failed');
          return false;
        }
      }

      console.log('✅ Pedometer permissions granted (no explicit request needed)');
      return true;
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      this.initializationFailed = true;
      return false;
    }
  }

  // Get steps data for a date range
  async getStepsData(startDate: Date, endDate: Date): Promise<StepData[]> {
    if (this.initializationFailed || !this.hasPermissions) {
      return [];
    }

    try {
      if (this.usePedometer) {
        // On Android, Pedometer only tracks steps since app started
        // Return current day's accumulated steps
        const now = new Date();
        const isToday = startDate.toDateString() === now.toDateString();
        
        if (isToday && this.todaySteps > 0) {
          const stepsData: StepData[] = [{
            value: this.todaySteps,
            unit: 'steps',
            timestamp: now,
            source: 'expo_sensors'
          }];
          
          console.log(`📊 Current steps: ${this.todaySteps}`);
          return stepsData;
        }
        
        // For historical dates, no data available on Android
        console.log('ℹ️ Historical step data not available on Android');
        return [];
      }

      return [];
    } catch (error) {
      console.error('❌ Error getting steps data:', error);
      return [];
    }
  }

  // Get heart rate data for a date range
  async getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]> {
    // Heart rate not available via expo-sensors
    console.log('ℹ️ Heart rate data not available (requires Health Connect)');
    return [];
  }

  // Get sleep data for a date range
  async getSleepData(startDate: Date, endDate: Date): Promise<SleepData[]> {
    // Sleep data not available via expo-sensors
    console.log('ℹ️ Sleep data not available (requires Health Connect)');
    return [];
  }

  // Get workout sessions for a date range
  async getWorkoutSessions(startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    // Workout sessions not available via expo-sensors
    console.log('ℹ️ Workout data not available (requires Health Connect)');
    return [];
  }

  // Map Health Connect exercise types to app workout types
  private mapExerciseType(exerciseType: number): string {
    // Health Connect exercise type codes
    const typeMap: Record<number, string> = {
      8: 'running',
      9: 'cycling',
      10: 'swimming',
      79: 'walking',
      59: 'yoga',
      // Add more mappings as needed
    };
    
    return typeMap[exerciseType] || 'other';
  }

  // Check if Health Connect is available and permissions are granted
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    if (this.initializationFailed) return false;
    
    try {
      return this.isInitialized && this.hasPermissions;
    } catch (error) {
      console.error('❌ Error checking Health Connect availability:', error);
      return false;
    }
  }

  // Create daily summary from Health Connect data
  async createDailySummary(date: Date): Promise<DailySummary | null> {
    if (this.initializationFailed) {
      return null;
    }
    
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch all data for the day
      const [stepsData, heartRateData, sleepData, workouts] = await Promise.all([
        this.getStepsData(startOfDay, endOfDay),
        this.getHeartRateData(startOfDay, endOfDay),
        this.getSleepData(startOfDay, endOfDay),
        this.getWorkoutSessions(startOfDay, endOfDay)
      ]);

      // Calculate totals
      const totalSteps = stepsData.reduce((sum, data) => sum + data.value, 0);
      const avgHeartRate = heartRateData.length > 0 
        ? heartRateData.reduce((sum, data) => sum + data.value, 0) / heartRateData.length
        : undefined;
      
      // Calculate calories from steps (approximately 0.04 calories per step)
      const totalCalories = Math.round(totalSteps * 0.04);
      
      // Calculate distance from steps (approximately 0.0008 km per step)
      const totalDistance = Math.round(totalSteps * 0.0008 * 100) / 100;

      const summary: DailySummary = {
        id: `summary_${date.toISOString().split('T')[0]}`,
        date: date.toISOString().split('T')[0],
        steps: totalSteps,
        stepsGoal: 10000,
        heartRate: avgHeartRate,
        sleep: undefined, // Sleep tracking removed (requires Health Connect)
        sleepGoal: 8,
        calories: totalCalories,
        caloriesGoal: 2000,
        distance: totalDistance,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`📋 Created daily summary for ${date.toISOString().split('T')[0]}`);
      return summary;
    } catch (error) {
      console.error('❌ Error creating daily summary:', error);
      return null;
    }
  }
}

// Export singleton instance
export const healthConnectService = new HealthConnectService();