// Health metric card component with Emerald/Zinc theme
// Displays fitness metrics with progress indicators and trends

import React from 'react';
import { Text, View } from 'react-native';
import { s } from 'react-native-wind';
import { useTheme } from '../store/theme';

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
  const { colors, isDark } = useTheme();
  
  const accentColors = {
    emerald: { main: colors.primary, light: colors.primaryLight },
    blue: { main: colors.blue, light: colors.blueLight },
    purple: { main: colors.purple, light: colors.purpleLight },
    orange: { main: colors.orange, light: colors.orangeLight }
  };
  
  const accent = accentColors[color];
  const trendIcon = trend?.direction === 'up' ? '↗' : 
                   trend?.direction === 'down' ? '↘' : '→';

  return (
    <View style={[s`p-4 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
      <View style={s`flex-row justify-between items-start mb-4`}>
        <View style={s`flex-1 pr-2`}>
          <Text style={[s`text-sm font-medium`, { color: colors.textTertiary }]} numberOfLines={1}>{title}</Text>
          <View style={s`flex-row items-end gap-1 mt-1`}>
            <Text style={[s`text-3xl font-bold`, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{value}</Text>
            {unit && (
              <Text style={[s`text-sm font-medium mb-1`, { color: colors.textSecondary }]}>{unit}</Text>
            )}
          </View>
        </View>
        {trend && (
          <View style={s`items-end flex-shrink-0 ml-1`}>
            <View style={[s`flex-row items-center px-2 py-1 rounded-full`, { backgroundColor: accent.light }]}>
              <Text style={[s`text-xs`, { color: colors.textSecondary }]}>{trendIcon}</Text>
              <Text style={[s`text-xs ml-1`, { color: accent.main }]} numberOfLines={1}>
                +{trend.percentage.toString()}%
              </Text>
            </View>
            <Text style={[s`text-xs mt-1`, { color: colors.textSecondary }]} numberOfLines={1}>{trend.period}</Text>
          </View>
        )}
      </View>
      
      {/* Progress bar */}
      {progress && (
        <View style={[s`h-2 rounded-full overflow-hidden`, { backgroundColor: colors.borderLight }]}>
          <View 
            style={[
              s`h-full rounded-full`,
              {
                backgroundColor: accent.main,
                width: `${Math.min(progress.percentage, 100).toString()}%`
              }
            ]}
          />
        </View>
      )}
    </View>
  );
};