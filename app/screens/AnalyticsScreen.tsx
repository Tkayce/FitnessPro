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
import { useTheme } from '../store/theme';
import { ChartDataPoint } from '../types/fitness';

type TimePeriod = 'week' | 'month' | 'year';

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const { colors, isDark } = useTheme();
  
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
    const avgCalories = Math.round(recentData.reduce((sum, d) => sum + (d.calories || 0), 0) / recentData.length);
    
    return { avgSteps, avgCalories };
  };

  const averages = calculateAverages();
  const currentPeriodData = getChartDataForPeriod(selectedPeriod);

  return (
    <View style={[s`flex-1`, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <ScrollView
        style={s`flex-1`}
        contentContainerStyle={s`pb-6`}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s`px-6 pt-12 pb-6`}>
          <Text style={[s`text-2xl font-bold mb-2`, { color: colors.text }]}>Analytics</Text>
          <Text style={[s`text-sm`, { color: colors.textSecondary }]}>
            Detailed insights into your fitness journey
          </Text>
        </View>

        {/* Time period selector */}
        <View style={s`px-6 mb-6`}>
          <View style={[s`flex-row p-1 rounded-2xl`, { backgroundColor: colors.surface }]}>
            {(['week', 'month', 'year'] as TimePeriod[]).map((period) => (
              <Pressable
                key={period}
                style={[
                  s`flex-1 py-3 px-4 rounded-xl`,
                  selectedPeriod === period && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  s`text-center font-medium capitalize`,
                  { color: selectedPeriod === period ? (isDark ? colors.background : '#ffffff') : colors.textSecondary }
                ]}>
                  {period}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Empty state */}
        {dailySummaries.length === 0 ? (
          <View style={s`flex-1 items-center justify-center px-6 py-20`}>
            <View style={[s`items-center p-8 rounded-[32px]`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <View style={[s`w-20 h-20 rounded-full items-center justify-center mb-4`, { backgroundColor: colors.surface }]}>
                <Ionicons name="analytics-outline" size={40} color={colors.textTertiary} />
              </View>
              <Text style={[s`text-xl font-semibold mb-2`, { color: colors.text }]}>No Analytics Data</Text>
              <Text style={[s`text-center text-sm mb-4`, { color: colors.textSecondary }]}>
                Start tracking your fitness activities to see detailed analytics and insights
              </Text>
              <View style={[s`px-4 py-2 rounded-full`, { backgroundColor: colors.primaryLight }]}>
                <Text style={[s`text-xs font-medium`, { color: colors.primary }]}>Sync your health data to get started</Text>
              </View>
            </View>
          </View>
        ) : (
        <View style={s`px-6`}>
          {/* Weekly summary cards */}
          {weeklyAnalytics && (
            <View style={s`mb-6`}>
              <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Weekly Summary</Text>
              
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
                    title="Avg Calories"
                    value={Math.round(weeklyAnalytics.avgSteps * 0.04).toString()}
                    unit="cal"
                    trend={{
                      direction: 'up',
                      percentage: 8,
                      period: 'vs last week'
                    }}
                    color="orange"
                  />
                </View>
              </View>

              <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[s`font-semibold mb-3`, { color: colors.text }]}>Week Highlights</Text>
                
                <View style={s`flex-row justify-between mb-3`}>
                  <View style={s`flex-1`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Total Distance</Text>
                    <Text style={[s`font-medium`, { color: colors.text }]}>{`${weeklyAnalytics.totalDistance} km`}</Text>
                  </View>
                  <View style={s`flex-1 items-center`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Workouts</Text>
                    <Text style={[s`font-medium`, { color: colors.text }]}>{weeklyAnalytics.workoutCount.toString()}</Text>
                  </View>
                  <View style={s`flex-1 items-end`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Goals Hit</Text>
                    <Text style={[s`font-medium`, { color: colors.primary }]}>{weeklyAnalytics.goalsAchieved}/7</Text>
                  </View>
                </View>
                
                <View style={s`flex-row justify-between`}>
                  <View style={s`flex-1`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Current Streak</Text>
                    <Text style={[s`font-medium`, { color: colors.primary }]}>{weeklyAnalytics.streakDays} days</Text>
                  </View>
                  <View style={s`flex-1 items-end`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Most Active</Text>
                    <Text style={[s`font-medium`, { color: colors.text }]}>
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

          {/* Calories trend chart (calculated from steps) */}
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
            <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
              <Text style={[s`text-lg font-semibold mb-4`, { color: colors.text }]}>Performance Insights</Text>
              
              <View style={s`mb-4`}>
                <Text style={[s`text-sm font-medium mb-1`, { color: colors.primary }]}>🎯 Daily Averages (Last 7 Days)</Text>
                <Text style={[s`text-xs mb-3`, { color: colors.textSecondary }]}>Your consistency over the past week</Text>
                
                <View style={s`flex-row justify-between`}>
                  <View>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Steps</Text>
                    <Text style={[s`font-semibold`, { color: colors.text }]}>{averages.avgSteps.toLocaleString()}</Text>
                  </View>
                  <View style={s`items-center`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Distance</Text>
                    <Text style={[s`font-semibold`, { color: colors.text }]}>{`${(averages.avgSteps * 0.0008).toFixed(1)} km`}</Text>
                  </View>
                  <View style={s`items-end`}>
                    <Text style={[s`text-sm`, { color: colors.textTertiary }]}>Calories</Text>
                    <Text style={[s`font-semibold`, { color: colors.text }]}>{averages.avgCalories}</Text>
                  </View>
                </View>
              </View>
              
              <View style={[s`pt-4`, { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <Text style={[s`text-sm font-medium mb-1`, { color: colors.blue }]}>📈 Improvement Tips</Text>
                <Text style={[s`text-xs`, { color: colors.textSecondary }]}>
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