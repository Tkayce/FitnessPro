// Analytics screen with detailed fitness trends and insights
// Shows weekly/monthly analytics with comprehensive charts

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View
} from 'react-native';
import { s } from 'react-native-wind';
import { HealthMetricCard } from '../components/HealthMetricCard';
import { TrendChart } from '../components/TrendChart';
import { useFitnessSelectors, useFitnessStore } from '../store/fitness';
import { ChartDataPoint } from '../types/fitness';

type TimePeriod = 'week' | 'month' | 'year';

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  
  const {
    dailySummaries,
    weeklyAnalytics,
    calculateWeeklyAnalytics,
    loadDailySummaries
  } = useFitnessStore();

  const { chartData } = useFitnessSelectors();

  useEffect(() => {
    loadDailySummaries(30); // Load 30 days of data
    calculateWeeklyAnalytics();
  }, []);

  // Prepare chart data based on selected period
  const getChartDataForPeriod = (period: TimePeriod): ChartDataPoint[] => {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    return dailySummaries
      .slice(0, days)
      .reverse()
      .map(summary => ({
        label: period === 'week' 
          ? new Date(summary.date).toLocaleDateString('en', { weekday: 'short' })
          : new Date(summary.date).toLocaleDateString('en', { day: '2-digit' }),
        value: summary.steps,
        date: summary.date
      }));
  };

  // Calculate average metrics
  const calculateAverages = () => {
    if (dailySummaries.length === 0) return null;
    
    const recentData = dailySummaries.slice(0, 7);
    const avgSteps = Math.round(recentData.reduce((sum, d) => sum + d.steps, 0) / recentData.length);
    const avgSleep = (recentData.reduce((sum, d) => sum + (d.sleep || 0), 0) / recentData.length).toFixed(1);
    const avgCalories = Math.round(recentData.reduce((sum, d) => sum + (d.calories || 0), 0) / recentData.length);
    
    return { avgSteps, avgSleep, avgCalories };
  };

  const averages = calculateAverages();
  const currentPeriodData = getChartDataForPeriod(selectedPeriod);

  return (
    <View style={s`flex-1 bg-zinc-950`}>
      <StatusBar barStyle="light-content" backgroundColor="#09090b" />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s`px-6 pt-12 pb-6`}>
          <Text style={s`text-white text-2xl font-bold mb-2`}>Analytics</Text>
          <Text style={s`text-zinc-400 text-sm`}>
            Detailed insights into your fitness journey
          </Text>
        </View>

        {/* Time period selector */}
        <View style={s`px-6 mb-6`}>
          <View style={s`flex-row bg-zinc-900 p-1 rounded-2xl`}>
            {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <Pressable
                key={period}
                style={s`flex-1 py-3 px-4 rounded-xl ${selectedPeriod === period ? 'bg-emerald-400' : ''}`}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={s`text-center font-medium capitalize ${
                  selectedPeriod === period ? 'text-zinc-900' : 'text-zinc-400'
                }`}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Empty state */}
        {dailySummaries.length === 0 ? (
          <View style={s`flex-1 items-center justify-center px-6 py-20`}>
            <View style={s`items-center bg-zinc-900 border border-zinc-800 p-8 rounded-[32px]`}>
              <View style={s`bg-zinc-800 w-20 h-20 rounded-full items-center justify-center mb-4`}>
                <Ionicons name="analytics-outline" size={40} color="#71717a" />
              </View>
              <Text style={s`text-white text-xl font-semibold mb-2`}>No Analytics Data</Text>
              <Text style={s`text-zinc-400 text-center text-sm mb-4`}>
                Start tracking your fitness activities to see detailed analytics and insights
              </Text>
              <View style={s`bg-zinc-800 px-4 py-2 rounded-full`}>
                <Text style={s`text-emerald-400 text-xs font-medium`}>Sync your health data to get started</Text>
              </View>
            </View>
          </View>
        ) : (
        <View style={s`px-6`}>
          {/* Weekly summary cards */}
          {weeklyAnalytics && (
            <View style={s`mb-6`}>
              <Text style={s`text-white text-lg font-semibold mb-4`}>Weekly Summary</Text>
              
              <View style={s`flex-row gap-3 mb-4`}>
                <View style={s`flex-1`}>
                  <HealthMetricCard
                    title="Avg Steps"
                    value={weeklyAnalytics.avgSteps.toLocaleString()}
                    trend={{
                      direction: 'up',
                      percentage: 8,
                      period: 'vs last week'
                    }}
                    color="emerald"
                  />
                </View>
                <View style={s`flex-1`}>
                  <HealthMetricCard
                    title="Avg Sleep"
                    value={weeklyAnalytics.avgSleep.toString()}
                    unit="hrs"
                    trend={{
                      direction: 'up',
                      percentage: 12,
                      period: 'vs last week'
                    }}
                    color="blue"
                  />
                </View>
              </View>

              <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
                <Text style={s`text-white font-semibold mb-3`}>Week Highlights</Text>
                
                <View style={s`flex-row justify-between mb-3`}>
                  <View style={s`flex-1`}>
                    <Text style={s`text-zinc-500 text-sm`}>Total Distance</Text>
                    <Text style={s`text-white font-medium`}>{weeklyAnalytics.totalDistance} km</Text>
                  </View>
                  <View style={s`flex-1 items-center`}>
                    <Text style={s`text-zinc-500 text-sm`}>Workouts</Text>
                    <Text style={s`text-white font-medium`}>{weeklyAnalytics.workoutCount}</Text>
                  </View>
                  <View style={s`flex-1 items-end`}>
                    <Text style={s`text-zinc-500 text-sm`}>Goals Hit</Text>
                    <Text style={s`text-emerald-400 font-medium`}>{weeklyAnalytics.goalsAchieved}/7</Text>
                  </View>
                </View>
                
                <View style={s`flex-row justify-between`}>
                  <View style={s`flex-1`}>
                    <Text style={s`text-zinc-500 text-sm`}>Current Streak</Text>
                    <Text style={s`text-emerald-400 font-medium`}>{weeklyAnalytics.streakDays} days</Text>
                  </View>
                  <View style={s`flex-1 items-end`}>
                    <Text style={s`text-zinc-500 text-sm`}>Most Active</Text>
                    <Text style={s`text-white font-medium`}>
                      {new Date(weeklyAnalytics.mostActiveDay).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Charts */}
          <TrendChart
            title={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Steps Trend`}
            data={currentPeriodData}
            color="emerald"
            unit="steps"
          />

          {/* Sleep trend chart */}
          {dailySummaries.length > 0 && (
            <TrendChart
              title="Sleep Pattern"
              data={dailySummaries.slice(0, 7).reverse().map(summary => ({
                label: new Date(summary.date).toLocaleDateString('en', { weekday: 'short' }),
                value: summary.sleep || 0,
                date: summary.date
              }))}
              color="blue"
              unit="hrs"
            />
          )}

          {/* Calories trend chart */}
          {dailySummaries.length > 0 && (
            <TrendChart
              title="Calorie Burn"
              data={dailySummaries.slice(0, 7).reverse().map(summary => ({
                label: new Date(summary.date).toLocaleDateString('en', { weekday: 'short' }),
                value: summary.calories || 0,
                date: summary.date
              }))}
              color="orange"
              unit="cal"
            />
          )}

          {/* Monthly comparison */}
          {averages && (
            <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
              <Text style={s`text-white text-lg font-semibold mb-4`}>Performance Insights</Text>
              
              <View style={s`mb-4`}>
                <Text style={s`text-emerald-400 text-sm font-medium mb-1`}>🎯 Daily Averages (Last 7 Days)</Text>
                <Text style={s`text-zinc-400 text-xs mb-3`}>Your consistency over the past week</Text>
                
                <View style={s`flex-row justify-between`}>
                  <View>
                    <Text style={s`text-zinc-500 text-sm`}>Steps</Text>
                    <Text style={s`text-white font-semibold`}>{averages.avgSteps.toLocaleString()}</Text>
                  </View>
                  <View style={s`items-center`}>
                    <Text style={s`text-zinc-500 text-sm`}>Sleep</Text>
                    <Text style={s`text-white font-semibold`}>{averages.avgSleep} hrs</Text>
                  </View>
                  <View style={s`items-end`}>
                    <Text style={s`text-zinc-500 text-sm`}>Calories</Text>
                    <Text style={s`text-white font-semibold`}>{averages.avgCalories}</Text>
                  </View>
                </View>
              </View>
              
              <View style={s`border-t border-zinc-700 pt-4`}>
                <Text style={s`text-blue-400 text-sm font-medium mb-1`}>📈 Improvement Tips</Text>
                <Text style={s`text-zinc-400 text-xs`}>
                  {averages.avgSteps < 8000 
                    ? "Try to increase daily steps by 1,000 to reach your goal faster."
                    : "Great job! You're consistently hitting your step goals."}
                </Text>
              </View>
            </View>
          )}
        </View>
        )}
      </ScrollView>
    </View>
  );
}