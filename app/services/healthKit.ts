// iOS HealthKit integration service
// Handles passive data collection from Apple HealthKit

import HealthKit, {
    HKCategoryTypeIdentifier,
    HKQuantityTypeIdentifier,
    HKWorkoutActivityType
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';
import { DailySummary, HeartRateData, SleepData, StepData, WorkoutSession } from '../types/fitness';

class HealthKitService {
  private isInitialized = false;
  private hasPermissions = false;
  private isTracking = false;
  private sessionStartTime: Date | null = null;
  private sessionSteps = 0;

  // Initialize HealthKit connection
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.log('⚠️ HealthKit only available on iOS');
      return false;
    }

    try {
      const isAvailable = await HealthKit.isHealthDataAvailable();
      
      if (!isAvailable) {
        console.log('⚠️ HealthKit is not available on this device');
        return false;
      }

      this.isInitialized = true;
      console.log('✅ HealthKit initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ HealthKit initialization failed:', error);
      return false;
    }
  }

  // Request permissions for health data access
  async requestPermissions(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        return false;
      }
    }

    try {
      // Request read permissions for all health data types we need
      await HealthKit.requestAuthorization([
        HKQuantityTypeIdentifier.stepCount,
        HKQuantityTypeIdentifier.heartRate,
        HKCategoryTypeIdentifier.sleepAnalysis,
        HKQuantityTypeIdentifier.activeEnergyBurned,
        HKQuantityTypeIdentifier.distanceWalkingRunning,
      ]);

      this.hasPermissions = true;
      console.log('✅ HealthKit permissions granted');
      return true;
    } catch (error) {
      console.error('❌ HealthKit permission request failed:', error);
      return false;
    }
  }

  // Get steps data for a date range
  async getStepsData(startDate: Date, endDate: Date): Promise<StepData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ HealthKit permissions not granted');
      return [];
    }

    try {
      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.stepCount,
        {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        }
      );

      const stepsData: StepData[] = samples.map((sample: any) => ({
        value: sample.quantity || 0,
        unit: 'steps',
        timestamp: new Date(sample.startDate),
        source: 'healthkit'
      }));

      console.log(`📊 Retrieved ${stepsData.length} step records from HealthKit`);
      return stepsData;
    } catch (error) {
      console.error('❌ Error getting steps data from HealthKit:', error);
      return [];
    }
  }

  // Start tracking session (iOS can read historical data)
  startTracking(): boolean {
    if (this.isTracking) {
      console.log('⚠️ Already tracking steps');
      return false;
    }

    if (!this.isInitialized || !this.hasPermissions) {
      console.log('❌ Cannot start tracking - not initialized');
      return false;
    }

    this.isTracking = true;
    this.sessionStartTime = new Date();
    this.sessionSteps = 0;

    console.log(`✅ Started step tracking session at ${this.sessionStartTime.toLocaleTimeString()}`);
    return true;
  }

  // Stop tracking and get session data
  async stopTracking(): Promise<{ steps: number; startTime: Date | null; endTime: Date } | null> {
    if (!this.isTracking || !this.sessionStartTime) {
      console.log('⚠️ No active tracking session');
      return null;
    }

    const endTime = new Date();
    
    try {
      // Query steps for the session period
      const stepsData = await this.getStepsData(this.sessionStartTime, endTime);
      this.sessionSteps = stepsData.reduce((sum, data) => sum + data.value, 0);
    } catch (error) {
      console.error('❌ Error fetching session steps:', error);
    }

    const session = {
      steps: this.sessionSteps,
      startTime: this.sessionStartTime,
      endTime
    };

    this.isTracking = false;
    console.log(`⏹️ Stopped tracking: ${session.steps} steps from ${session.startTime.toLocaleTimeString()} to ${session.endTime.toLocaleTimeString()}`);
    
    return session;
  }

  // Get current tracking status
  getTrackingStatus(): { isTracking: boolean; steps: number; startTime: Date | null } {
    return {
      isTracking: this.isTracking,
      steps: this.sessionSteps,
      startTime: this.sessionStartTime
    };
  }

  // Get heart rate data for a date range
  async getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ HealthKit permissions not granted');
      return [];
    }

    try {
      const samples = await HealthKit.querySamples(
        HKQuantityTypeIdentifier.heartRate,
        {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        }
      );

      const heartRateData: HeartRateData[] = samples.map((sample: any) => ({
        value: Math.round(sample.quantity || 0),
        unit: 'bpm',
        timestamp: new Date(sample.startDate),
        source: 'healthkit'
      }));

      console.log(`❤️ Retrieved ${heartRateData.length} heart rate records from HealthKit`);
      return heartRateData;
    } catch (error) {
      console.error('❌ Error getting heart rate data from HealthKit:', error);
      return [];
    }
  }

  // Get sleep data for a date range
  async getSleepData(startDate: Date, endDate: Date): Promise<SleepData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ HealthKit permissions not granted');
      return [];
    }

    try {
      // TODO: Replace with actual HealthKit sleep query
      
      // Mock data for development
      const mockSleepData: SleepData[] = [
        {
          value: 8.2,
          unit: 'hours',
          timestamp: new Date(),
          source: 'healthkit',
          sleepStage: 'deep'
        }
      ];

      console.log(`😴 Retrieved ${mockSleepData.length} sleep records from HealthKit`);
      return mockSleepData;
    } catch (error) {
      console.error('❌ Error getting sleep data from HealthKit:', error);
      return [];
    }
  }

  // Get workout sessions for a date range
  async getWorkoutSessions(startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ HealthKit permissions not granted');
      return [];
    }

    try {
      const workouts = await HealthKit.queryWorkouts({
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      });

      const workoutSessions: WorkoutSession[] = workouts.map((workout: any) => {
        const startTime = new Date(workout.startDate);
        const endTime = new Date(workout.endDate);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        return {
          id: workout.uuid || `workout_${startTime.getTime()}`,
          type: this.mapWorkoutType(workout.workoutActivityType),
          startTime,
          endTime,
          duration: durationMinutes,
          calories: workout.totalEnergyBurned,
          distance: workout.totalDistance ? workout.totalDistance / 1000 : undefined,
          avgHeartRate: undefined, // Need separate query
          maxHeartRate: undefined,
          steps: undefined
        };
      });

      console.log(`💪 Retrieved ${workoutSessions.length} workout sessions from HealthKit`);
      return workoutSessions;
    } catch (error) {
      console.error('❌ Error getting workout sessions from HealthKit:', error);
      return [];
    }
  }

  // Map HealthKit workout types to app workout types
  private mapWorkoutType(workoutType: number): string {
    const typeMap: Record<number, string> = {
      [HKWorkoutActivityType.running]: 'running',
      [HKWorkoutActivityType.cycling]: 'cycling',
      [HKWorkoutActivityType.swimming]: 'swimming',
      [HKWorkoutActivityType.walking]: 'walking',
      [HKWorkoutActivityType.yoga]: 'yoga',
      // Add more mappings as needed
    };
    
    return typeMap[workoutType] || 'other';
  }

  // Check if HealthKit is available and permissions are granted
  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      // TODO: Replace with actual HealthKit availability check
      return this.isInitialized && this.hasPermissions;
    } catch (error) {
      console.error('❌ Error checking HealthKit availability:', error);
      return false;
    }
  }

  // Create daily summary from HealthKit data
  async createDailySummary(date: Date): Promise<DailySummary | null> {
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
        id: `summary_ios_${date.toISOString().split('T')[0]}`,
        date: date.toISOString().split('T')[0],
        steps: totalSteps,
        stepsGoal: 10000,
        heartRate: avgHeartRate,
        sleep: undefined, // Sleep tracking removed (requires HealthKit)
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
export const healthKitService = new HealthKitService();