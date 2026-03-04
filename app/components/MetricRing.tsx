// Circular progress ring component for fitness goals
// Shows progress like 8,000 / 10,000 steps with SVG ring

import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { s } from 'react-native-wind';
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
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress.percentage / 100) * circumference;
  
  const colorMap = {
    emerald: '#34d399', // emerald-400
    blue: '#60a5fa',    // blue-400  
    purple: '#a78bfa',  // purple-400
    orange: '#fb923c'   // orange-400
  };

  const strokeColor = colorMap[color];

  return (
    <View style={s`bg-zinc-900 border border-zinc-800 p-6 rounded-[32px] items-center`}>
      {/* Ring Title */}
      <Text style={s`text-zinc-500 text-sm font-medium mb-4`}>{title}</Text>
      
      {/* SVG Ring */}
      <View style={s`relative items-center justify-center`}>
        <Svg width={size} height={size} style={s`absolute`}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#27272a" // zinc-800
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
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        
        {/* Center content */}
        <View style={s`items-center justify-center`}>
          <Text style={s`text-white text-2xl font-bold`}>
            {progress.current.toLocaleString()}
          </Text>
          <Text style={s`text-zinc-400 text-sm`}>
            / {progress.target.toLocaleString()}
          </Text>
          <Text style={s`text-${color}-400 text-xs font-medium mt-1`}>
            {progress.percentage}%
          </Text>
        </View>
      </View>
      
      {/* Trend indicator */}
      <View style={s`mt-4 flex-row items-center`}>
        <Text style={s`text-xs text-zinc-500`}>
          {progress.trend === 'up' ? '↗' : progress.trend === 'down' ? '↘' : '→'}
        </Text>
        <Text style={s`text-${color}-400 text-xs ml-1`}>
          {progress.trendPercentage > 0 ? '+' : ''}{progress.trendPercentage}% today
        </Text>
      </View>
    </View>
  );
};