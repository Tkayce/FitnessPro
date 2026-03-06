// Circular progress ring component for fitness goals
// Shows progress like 8,000 / 10,000 steps with SVG ring

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { s } from 'react-native-wind';
import { useTheme } from '../store/theme';
import { GoalProgress } from '../types/fitness';

interface MetricRingProps {
  progress: GoalProgress;
  title: string;
  color?: 'emerald' | 'blue' | 'purple' | 'orange';
  size?: number;
}

export const MetricRing: React.FC<MetricRingProps> = ({
  progress,
  title,
  color = 'emerald',
  size = 120
}) => {
  const { colors, isDark } = useTheme();
  
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;
  
  const colorMap = {
    emerald: colors.primary,
    blue: colors.blue,
    purple: colors.purple,
    orange: colors.orange
  };

  const strokeColor = colorMap[color];
  
  // Background ring color - more visible in dark mode
  const bgRingColor = isDark ? '#3f3f46' : colors.borderLight;

  return (
    <View style={s`items-center py-2`}>
      {/* Ring Title */}
      <Text style={[s`text-sm font-medium mb-6`, { color: colors.textTertiary }]}>{title}</Text>
      
      {/* SVG Ring with proper spacing */}
      <View style={{ position: 'relative', width: size, height: size, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgRingColor}
            strokeWidth={6}
            fill="transparent"
          />
          {/* Progress circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={6}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${(size / 2).toString()} ${(size / 2).toString()})`}
          />
        </Svg>
        
        {/* Center content with absolute positioning */}
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', width: size - 40, paddingHorizontal: 8 }}>
          <Text style={[s`text-2xl font-bold`, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {progress.current.toLocaleString()}
          </Text>
          <Text style={[s`text-sm`, { color: colors.textSecondary }]} numberOfLines={1}>
            / {progress.target.toLocaleString()}
          </Text>
          <Text style={[s`text-xs font-medium mt-1`, { color: strokeColor }]}>
            {progress.percentage.toString()}%
          </Text>
        </View>
      </View>
      
      {/* Trend indicator */}
      <View style={s`mt-4 flex-row items-center`}>
        <Text style={[s`text-xs`, { color: colors.textTertiary }]}>
          {progress.trend === 'up' ? '↗' : progress.trend === 'down' ? '↘' : '→'}
        </Text>
        <Text style={[s`text-xs ml-1`, { color: strokeColor }]}>
          {progress.trendPercentage > 0 ? '+' : ''}{progress.trendPercentage.toString()}% today
        </Text>
      </View>
    </View>
  );
};