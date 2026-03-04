// Health metric card component with Emerald/Zinc theme
// Displays fitness metrics with progress indicators and trends

import React from 'react';
import { Text, View } from 'react-native';
import { s } from 'react-native-wind';

interface HealthMetricCardProps {
  title: string;
  value: string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
    period: string;
  };
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  color?: 'emerald' | 'blue' | 'purple' | 'orange';
}

export const HealthMetricCard: React.FC<HealthMetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  progress,
  color = 'emerald'
}) => {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    blue: 'text-blue-400 bg-blue-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
    orange: 'text-orange-400 bg-orange-400/10'
  };

  const progressColors = {
    emerald: '#34d399',
    blue: '#60a5fa',
    purple: '#a78bfa',
    orange: '#fb7185'
  };

  const trendIcon = trend?.direction === 'up' ? '↗' : 
                   trend?.direction === 'down' ? '↘' : '→';

  return (
    <View style={s`bg-zinc-900 border border-zinc-800 p-5 rounded-[32px] mb-4`}>
      <View style={s`flex-row justify-between items-end mb-6`}>
        <View>
          <Text style={s`text-zinc-500 text-sm font-medium`}>{title}</Text>
          <View style={s`flex-row items-end gap-1`}>
            <Text style={s`text-white text-3xl font-bold`}>{value}</Text>
            {unit && (
              <Text style={s`text-zinc-400 text-sm font-medium mb-1`}>{unit}</Text>
            )}
          </View>
        </View>
        {trend && (
          <View style={s`flex-row items-center gap-1`}>
            <Text style={s`text-xs text-zinc-400`}>{trendIcon}</Text>
            <Text style={s`${colorClasses[color as keyof typeof colorClasses]} text-xs px-2 py-1 rounded-full mb-1`}>
              +{trend.percentage}% {trend.period}
            </Text>
          </View>
        )}
      </View>
      
      {/* Progress bar */}
      {progress && (
        <View style={s`h-2 bg-zinc-800 rounded-full overflow-hidden`}>
          <View 
            style={[
              s`h-full rounded-full`,
              {
                backgroundColor: progressColors[color as keyof typeof progressColors],
                width: `${Math.min(progress.percentage, 100)}%`
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};