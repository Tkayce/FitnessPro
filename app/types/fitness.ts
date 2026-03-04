// Core fitness data types for the personal fitness tracker

export interface HealthMetric {
  value: number;
  unit: string;
  timestamp: Date;
  source: 'health_connect' | 'healthkit' | 'expo_sensors';
}

export interface StepData extends HealthMetric {
  unit: 'steps';
}

export interface HeartRateData extends HealthMetric {
  unit: 'bpm';
}

export interface SleepData extends HealthMetric {
  unit: 'hours';
  sleepStage?: 'light' | 'deep' | 'rem' | 'awake';
}

export interface DailySummary {
  id: string;
  date: string; // ISO date string
  steps: number;
  stepsGoal: number;
  heartRate?: number;
  sleep?: number;
  sleepGoal: number;
  calories?: number;
  caloriesGoal: number;
  distance?: number; // in kilometers
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutSession {
  id: string;
  type: 'running' | 'walking' | 'cycling' | 'swimming' | 'strength' | 'yoga' | 'other';
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  calories?: number;
  distance?: number; // in kilometers
  avgHeartRate?: number;
  maxHeartRate?: number;
  steps?: number;
  notes?: string;
}

export interface TrendData {
  date: string;
  steps: number;
  heartRate?: number;
  sleep?: number;
  calories?: number;
}

export interface GoalProgress {
  current: number;
  target: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface HealthPermissions {
  steps: boolean;
  heartRate: boolean;
  sleep: boolean;
  workouts: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  isSyncing: boolean;
  syncProgress?: number; // 0-100
  error?: string;
}

// Weekly analytics data
export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  totalSteps: number;
  avgSteps: number;
  totalDistance: number;
  totalCalories: number;
  avgHeartRate?: number;
  totalSleep: number;
  avgSleep: number;
  workoutCount: number;
  mostActiveDay: string;
  goalsAchieved: number;
  streakDays: number;
}

// Chart data for visualizations
export interface ChartDataPoint {
  label: string; // Day abbreviation or date
  value: number;
  date: string;
}

export interface MetricCardData {
  title: string;
  value: string;
  unit?: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string; // e.g., "today", "this week"
  };
  progress?: GoalProgress;
  color: 'emerald' | 'blue' | 'purple' | 'orange';
}