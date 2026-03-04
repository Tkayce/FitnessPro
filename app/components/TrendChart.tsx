// 7-day trend chart component using react-native-gifted-charts
// Shows fitness metrics over time with Emerald/Zinc theme

import React from 'react';
import { Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { s } from 'react-native-wind';
import { ChartDataPoint } from '../types/fitness';

interface TrendChartProps {
  title: string;
  data: ChartDataPoint[];
  color?: 'emerald' | 'blue' | 'purple' | 'orange';
  unit?: string;
}

// Color configurations for charts
const chartColors = {
  emerald: '#34d399',
  blue: '#60a5fa',
  purple: '#a78bfa',
  orange: '#fb7185'
};

export const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  color = 'emerald',
  unit
}) => {
  const colorMap = {
    emerald: '#34d399',
    blue: '#60a5fa', 
    purple: '#a78bfa',
    orange: '#fb923c'
  };

  // Calculate trend
  const latestValue = data[data.length - 1]?.value || 0;
  const previousValue = data[data.length - 2]?.value || latestValue;
  const trendPercentage = previousValue > 0 
    ? Math.round(((latestValue - previousValue) / previousValue) * 100)
    : 0;
  const trendDirection = trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'stable';

  return (
    <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
      {/* Header */}
      <View style={s`flex-row justify-between items-center mb-4`}>
        <Text style={s`text-zinc-500 text-sm font-medium`}>{title}</Text>
        <View style={s`flex-row items-center`}>
          <Text style={s`text-xs text-zinc-400 mr-1`}>
            {trendDirection === 'up' ? '↗' : trendDirection === 'down' ? '↘' : '→'}
          </Text>
          <Text style={s`text-${color}-400 text-xs`}>
            {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
          </Text>
        </View>
      </View>

      {/* Chart Container */}
      <View style={s`mb-4`}>
        {data.length > 0 ? (
          <LineChart
            data={data.map((point: ChartDataPoint) => ({ value: point.value, label: point.label }))}
            color={colorMap[color as keyof typeof colorMap]}
            thickness={3}
            hideDataPoints={false}
            dataPointsColor={colorMap[color as keyof typeof colorMap]}
            backgroundColor={'transparent'}
            rulesColor={'#27272a'} // zinc-800
            xAxisColor={'#52525b'} // zinc-600
            yAxisColor={'#52525b'} // zinc-600
            xAxisLabelTextStyle={{ color: '#a1a1aa', fontSize: 10 }} // zinc-400
            yAxisTextStyle={{ color: '#a1a1aa', fontSize: 10 }} // zinc-400
            height={120}
            curved
            animateOnDataChange
          />
        ) : (
          <View style={s`h-32 items-center justify-center`}>
            <Text style={s`text-zinc-500 text-sm`}>No data available</Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={s`flex-row justify-between`}>
        <View>
          <Text style={s`text-zinc-400 text-xs`}>Latest</Text>
          <Text style={s`text-white font-semibold`}>
            {latestValue.toLocaleString()}{unit && ` ${unit}`}
          </Text>
        </View>
        <View style={s`items-end`}>
          <Text style={s`text-zinc-400 text-xs`}>7-day avg</Text>
          <Text style={s`text-white font-semibold`}>
            {Math.round(data.reduce((sum: number, d: ChartDataPoint) => sum + d.value, 0) / data.length || 0).toLocaleString()}{unit && ` ${unit}`}
          </Text>
        </View>
      </View>
    </View>
  );
};