// Local SQLite database service for fitness data caching
// This provides fast access to daily summaries and eliminates slow Health Connect queries

import { DailySummary, WorkoutSession } from '../types/fitness';

// For now, using AsyncStorage as fallback until expo-sqlite is available
import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseService {
  private storageKeys = {
    dailySummaries: '@fitness_daily_summaries',
    workoutSessions: '@fitness_workout_sessions',
    lastSync: '@fitness_last_sync'
  };

  // Initialize database tables (SQLite will replace this later)
  async initialize(): Promise<void> {
    try {
      // Check if first run
      const initialized = await AsyncStorage.getItem('@fitness_db_initialized');
      if (!initialized) {
        await AsyncStorage.setItem('@fitness_db_initialized', 'true');
        console.log('🗄️ Database initialized successfully');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Save daily summary to local cache
  async saveDailySummary(summary: DailySummary): Promise<void> {
    try {
      const existingSummaries = await this.getDailySummaries();
      const updatedSummaries = existingSummaries.filter(s => s.date !== summary.date);
      updatedSummaries.push(summary);
      
      await AsyncStorage.setItem(
        this.storageKeys.dailySummaries, 
        JSON.stringify(updatedSummaries)
      );
      console.log(`💾 Saved daily summary for ${summary.date}`);
    } catch (error) {
      console.error('❌ Error saving daily summary:', error);
      throw error;
    }
  }

  // Get daily summaries from local cache
  async getDailySummaries(limit = 30): Promise<DailySummary[]> {
    try {
      const data = await AsyncStorage.getItem(this.storageKeys.dailySummaries);
      if (!data) return [];
      
      const summaries: DailySummary[] = JSON.parse(data)
        .map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt)
        }))
        .sort((a: DailySummary, b: DailySummary) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, limit);
      
      return summaries;
    } catch (error) {
      console.error('❌ Error getting daily summaries:', error);
      return [];
    }
  }

  // Get daily summary for specific date
  async getDailySummaryByDate(date: string): Promise<DailySummary | null> {
    try {
      const summaries = await this.getDailySummaries();
      return summaries.find(s => s.date === date) || null;
    } catch (error) {
      console.error('❌ Error getting daily summary by date:', error);
      return null;
    }
  }

  // Save workout session
  async saveWorkoutSession(workout: WorkoutSession): Promise<void> {
    try {
      const existingWorkouts = await this.getWorkoutSessions();
      const updatedWorkouts = existingWorkouts.filter(w => w.id !== workout.id);
      updatedWorkouts.push(workout);
      
      await AsyncStorage.setItem(
        this.storageKeys.workoutSessions,
        JSON.stringify(updatedWorkouts)
      );
      console.log(`💪 Saved workout session: ${workout.type}`);
    } catch (error) {
      console.error('❌ Error saving workout session:', error);
      throw error;
    }
  }

  // Get workout sessions
  async getWorkoutSessions(limit = 20): Promise<WorkoutSession[]> {
    try {
      const data = await AsyncStorage.getItem(this.storageKeys.workoutSessions);
      if (!data) return [];
      
      const workouts: WorkoutSession[] = JSON.parse(data)
        .map((w: any) => ({
          ...w,
          startTime: new Date(w.startTime),
          endTime: new Date(w.endTime)
        }))
        .sort((a: WorkoutSession, b: WorkoutSession) => 
          b.startTime.getTime() - a.startTime.getTime()
        )
        .slice(0, limit);
      
      return workouts;
    } catch (error) {
      console.error('❌ Error getting workout sessions:', error);
      return [];
    }
  }

  // Update last sync timestamp
  async updateLastSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.storageKeys.lastSync, 
        new Date().toISOString()
      );
    } catch (error) {
      console.error('❌ Error updating last sync:', error);
    }
  }

  // Get last sync timestamp
  async getLastSync(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.storageKeys.lastSync);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('❌ Error getting last sync:', error);
      return null;
    }
  }

  // Clear all cached data (for development/testing)
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.storageKeys.dailySummaries,
        this.storageKeys.workoutSessions,
        this.storageKeys.lastSync
      ]);
      console.log('🧹 Cache cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();