// 7-day trend chart component using react-native-gifted-charts
// Shows fitness metrics over time with Emerald/Zinc theme

import React from 'react';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { s } from 'react-native-wind';
import { useTheme } from '../store/theme';
import { ChartDataPoint } from '../types/fitness';

interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: 'emerald' | 'blue' | 'purple' | 'orange';
  unit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  color = 'emerald',
  unit
}) => {
  const { colors, isDark } = useTheme();
  
  const colorMap = {
    emerald: colors.primary,
    blue: colors.blue, 
    purple: colors.purple,
    orange: colors.orange
  };

  // Calculate trend
  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || latestValue;
  const trendPercentage = previousValue > 0 
    ? Math.round(((latestValue - previousValue) / previousValue) * 100)
    : 0;
  const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';

  return (
    <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
      {/* Header */}
      <View style={s`flex-row justify-between items-center mb-4`}>
        <Text style={[s`text-sm font-medium`, { color: colors.textTertiary }]}>{title}</Text>
        <View style={s`flex-row items-center`}>
          <Text style={[s`text-xs mr-1`, { color: colors.textSecondary }]}>
            {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→'}
          </Text>
          <Text style={[s`text-xs`, { color: colorMap[color as keyof typeof colorMap] }]}>
            {trendPercentage > 0 ? '+' : ''}{trendPercentage.toString()}%
          </Text>
        </View>
      </View>

      {/* Chart Container with padding to prevent clipping */}
      <View style={{ marginBottom: 16, paddingHorizontal: 4, overflow: 'hidden' }}>
        {data.length > 0 ? (
          <LineChart
            data={data.map((point: ChartDataPoint) => ({ value: point.value, label: point.label }))}
            color={colorMap[color as keyof typeof colorMap]}
            thickness={3}
            hideDataPoints={false}
            dataPointsRadius={3}
            dataPointsColor={colorMap[color as keyof typeof colorMap]}
            backgroundColor={'transparent'}
            rulesColor={colors.border}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
            height={120}
            curved
            animateOnDataChange
            spacing={35}
            initialSpacing={15}
            endSpacing={15}
            maxValue={Math.max(...data.map(d => d.value)) * 1.1}
          />
        ) : (
          <View style={s`h-32 items-center justify-center`}>
            <Text style={[s`text-sm`, { color: colors.textTertiary }]}>No data available</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={s`flex-row justify-between`}>
        <View>
          <Text style={[s`text-xs`, { color: colors.textSecondary }]}>Latest</Text>
          <Text style={[s`font-semibold`, { color: colors.text }]}>
            {latestValue.toLocaleString()}
            {unit && <Text> {unit}</Text>}
          </Text>
        </View>
        <View style={s`items-end`}>
          <Text style={[s`text-xs`, { color: colors.textSecondary }]}>7-day avg</Text>
          <Text style={[s`font-semibold`, { color: colors.text }]}>
            {Math.round(data.reduce((sum: number, d: ChartDataPoint) => sum + d.value, 0) / data.length || 0).toLocaleString()}
            {unit && <Text> {unit}</Text>}
          </Text>
        </View>
      </View>
    </View>
  );
};