// Android Health Connect integration service
// Handles passive data collection from Health Connect API

import { Platform } from 'react-native';
import {
    getSdkStatus,
    initialize,
    readRecords,
    requestPermission,
    SdkAvailabilityStatus
} from 'react-native-health-connect';
import { DailySummary, HeartRateData, SleepData, StepData, WorkoutSession } from '../types/fitness';

class HealthConnectService {
  private isInitialized = false;
  private hasPermissions = false;

  // Initialize Health Connect connection
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('⚠️ Health Connect only available on Android');
      return false;
    }

    try {
      // Check if Health Connect is available on the device
      const status = await getSdkStatus();
      
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        console.log('⚠️ Health Connect is not installed on this device');
        return false;
      }
      
      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
        console.log('⚠️ Health Connect requires an update');
        return false;
      }

      // Initialize Health Connect
      const initialized = await initialize();
      this.isInitialized = initialized;
      
      if (initialized) {
        console.log('✅ Health Connect initialized successfully');
      } else {
        console.log('❌ Health Connect initialization returned false');
      }
      
      return initialized;
    } catch (error) {
      console.error('❌ Health Connect initialization failed:', error);
      return false;
    }
  }

  // Request permissions for health data access
  async requestPermissions(): Promise<boolean> {
    try {
      // Ensure initialization is complete first
      if (!this.isInitialized) {
        console.log('📱 Health Connect not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          console.error('❌ Cannot request permissions: Health Connect initialization failed');
          return false;
        }
      }

      console.log('🔐 Requesting Health Connect permissions...');

      // Request permissions for all health data types we need
      const permissions = [
        { accessType: 'read' as const, recordType: 'Steps' as const },
        { accessType: 'read' as const, recordType: 'HeartRate' as const },
        { accessType: 'read' as const, recordType: 'SleepSession' as const },
        { accessType: 'read' as const, recordType: 'ExerciseSession' as const },
        { accessType: 'read' as const, recordType: 'ActiveCaloriesBurned' as const },
        { accessType: 'read' as const, recordType: 'Distance' as const },
      ];

      const permissionsGranted = await requestPermission(permissions);
      
      // Check if all permissions were granted
      const granted = permissionsGranted.length === permissions.length;
      this.hasPermissions = granted;
      
      if (granted) {
        console.log('✅ Health Connect permissions granted');
      } else {
        console.log(`⚠️ Health Connect permissions partially granted: ${permissionsGranted.length}/${permissions.length}`);
      }
      
      return granted;
    } catch (error) {
      console.error('❌ Health Connect permission request failed:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return false;
    }
  }

  // Get steps data for a date range
  async getStepsData(startDate: Date, endDate: Date): Promise<StepData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ Health Connect permissions not granted');
      return [];
    }

    try {
      const result = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between' as const,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const stepsData: StepData[] = result.records.map((record: any) => ({
        value: record.count || 0,
        unit: 'steps',
        timestamp: new Date(record.startTime),
        source: 'health_connect'
      }));

      console.log(`📊 Retrieved ${stepsData.length} step records from Health Connect`);
      return stepsData;
    } catch (error) {
      console.error('❌ Error getting steps data from Health Connect:', error);
      return [];
    }
  }

  // Get heart rate data for a date range
  async getHeartRateData(startDate: Date, endDate: Date): Promise<HeartRateData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ Health Connect permissions not granted');
      return [];
    }

    try {
      const result = await readRecords('HeartRate', {
        timeRangeFilter: {
          operator: 'between' as const,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const heartRateData: HeartRateData[] = result.records.map((record: any) => ({
        value: record.beatsPerMinute || 0,
        unit: 'bpm',
        timestamp: new Date(record.time),
        source: 'health_connect'
      }));

      console.log(`❤️ Retrieved ${heartRateData.length} heart rate records from Health Connect`);
      return heartRateData;
    } catch (error) {
      console.error('❌ Error getting heart rate data from Health Connect:', error);
      return [];
    }
  }

  // Get sleep data for a date range
  async getSleepData(startDate: Date, endDate: Date): Promise<SleepData[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ Health Connect permissions not granted');
      return [];
    }

    try {
      const result = await readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between' as const,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const sleepData: SleepData[] = result.records.map((record: any) => {
        const startTime = new Date(record.startTime);
        const endTime = new Date(record.endTime);
        const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        
        return {
          value: durationHours,
          unit: 'hours',
          timestamp: startTime,
          source: 'health_connect',
          sleepStage: 'deep' // You can map stages from record.stages if available
        };
      });

      console.log(`😴 Retrieved ${sleepData.length} sleep records from Health Connect`);
      return sleepData;
    } catch (error) {
      console.error('❌ Error getting sleep data from Health Connect:', error);
      return [];
    }
  }

  // Get workout sessions for a date range
  async getWorkoutSessions(startDate: Date, endDate: Date): Promise<WorkoutSession[]> {
    if (!this.hasPermissions) {
      console.log('⚠️ Health Connect permissions not granted');
      return [];
    }

    try {
      const result = await readRecords('ExerciseSession', {
        timeRangeFilter: {
          operator: 'between' as const,
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
        },
      });

      const workoutSessions: WorkoutSession[] = result.records.map((record: any) => {
        const startTime = new Date(record.startTime);
        const endTime = new Date(record.endTime);
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        
        return {
          id: record.metadata?.id || `workout_${startTime.getTime()}`,
          type: this.mapExerciseType(record.exerciseType) as 'running' | 'walking' | 'cycling' | 'swimming' | 'strength' | 'yoga' | 'other',
          startTime,
          endTime,
          duration: durationMinutes,
          calories: record.totalEnergyBurned?.inKilocalories,
          distance: record.totalDistance?.inMeters ? record.totalDistance.inMeters / 1000 : undefined,
          avgHeartRate: undefined, // Heart rate needs separate query
          maxHeartRate: undefined,
          steps: undefined // Steps needs separate query
        };
      });

      console.log(`💪 Retrieved ${workoutSessions.length} workout sessions from Health Connect`);
      return workoutSessions;
    } catch (error) {
      console.error('❌ Error getting workout sessions from Health Connect:', error);
      return [];
    }
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
    
    try {
      // TODO: Replace with actual Health Connect availability check
      return this.isInitialized && this.hasPermissions;
    } catch (error) {
      console.error('❌ Error checking Health Connect availability:', error);
      return false;
    }
  }

  // Create daily summary from Health Connect data
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
      const totalSleep = sleepData.reduce((sum, data) => sum + data.value, 0);
      const totalCalories = workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);
      const totalDistance = workouts.reduce((sum, workout) => sum + (workout.distance || 0), 0);

      const summary: DailySummary = {
        id: `summary_${date.toISOString().split('T')[0]}`,
        date: date.toISOString().split('T')[0],
        steps: totalSteps,
        stepsGoal: 10000,
        heartRate: avgHeartRate,
        sleep: totalSleep,
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