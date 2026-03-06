// Activity feed component showing recent workouts and activities
// Scrollable list with Emerald/Zinc theme styling

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { s } from 'react-native-wind';
import { useTheme } from '../store/theme';
import { WorkoutSession } from '../types/fitness';

interface ActivityFeedProps {
  workouts: WorkoutSession[];
  onWorkoutPress?: (workout: WorkoutSession) => void;
  maxItems?: number;
}

const getWorkoutIcon = (type: WorkoutSession['type']): string => {
  switch (type) {
    case 'running': return '🏃';
    case 'walking': return '🚶';
    case 'cycling': return '🚴';
    case 'swimming': return '🏊';
    case 'strength': return '💪';
    case 'yoga': return '🧘';
    default: return '🏋️';
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes.toString()}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString()}h ${mins.toString()}m`;
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

const WorkoutItem: React.FC<{
  workout: WorkoutSession;
  onPress?: (workout: WorkoutSession) => void;
}> = ({ workout, onPress }) => {
  const { colors } = useTheme();
  
  return (
    <Pressable 
      style={[s`rounded-2xl p-4 mb-3`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}
      onPress={() => onPress?.(workout)}
    >
      <View style={s`flex-row items-center justify-between`}>
        {/* Workout info */}
        <View style={s`flex-row items-center flex-1`}>
          <Text style={s`text-2xl mr-3`}>{getWorkoutIcon(workout.type)}</Text>
          <View style={s`flex-1`}>
            <Text style={[s`font-semibold capitalize`, { color: colors.text }]}>
              {workout.type}
            </Text>
            <View style={s`flex-row items-center mt-1`}>
              <Text style={[s`text-sm`, { color: colors.textSecondary }]}>
                {formatDate(workout.startTime)} at {formatTime(workout.startTime)}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Duration */}
        <View style={s`items-end`}>
          <Text style={[s`font-semibold`, { color: colors.primary }]}>
            {formatDuration(workout.duration)}
          </Text>
          {workout.calories && (
            <Text style={[s`text-xs mt-1`, { color: colors.textTertiary }]}>
              {`${workout.calories.toString()} cal`}
            </Text>
          )}
        </View>
      </View>
      
      {/* Additional stats */}
      {(workout.distance || workout.avgHeartRate || workout.steps) && (
        <View style={[s`flex-row justify-between mt-3 pt-3`, { borderTopWidth: 1, borderTopColor: colors.border }]}>
          {workout.distance && (
            <View style={s`flex-1`}>
              <Text style={[s`text-xs`, { color: colors.textTertiary }]}>Distance</Text>
              <Text style={[s`text-sm font-medium`, { color: colors.text }]}>
                {`${workout.distance.toFixed(1)} km`}
              </Text>
            </View>
          )}
          
          {workout.avgHeartRate && (
            <View style={s`flex-1`}>
              <Text style={[s`text-xs`, { color: colors.textTertiary }]}>Avg HR</Text>
              <Text style={[s`text-sm font-medium`, { color: colors.text }]}>
                {`${workout.avgHeartRate.toString()} bpm`}
              </Text>
            </View>
          )}
          
          {workout.steps && (
            <View style={s`flex-1 items-end`}>
              <Text style={[s`text-xs`, { color: colors.textTertiary }]}>Steps</Text>
              <Text style={[s`text-sm font-medium`, { color: colors.text }]}>
                {workout.steps.toLocaleString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  workouts,
  onWorkoutPress,
  maxItems = 10
}) => {
  const { colors } = useTheme();
  const displayedWorkouts = workouts.slice(0, maxItems);

  return (
    <View style={[s`p-5 rounded-[32px] mb-4`, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
      {/* Header */}
      <View style={s`flex-row justify-between items-center mb-4`}>
        <Text style={[s`text-lg font-semibold`, { color: colors.text }]}>Recent Activities</Text>
        {workouts.length > maxItems && (
          <Text style={[s`text-sm font-medium`, { color: colors.primary }]}>
            +{(workouts.length - maxItems).toString()} more
          </Text>
        )}
      </View>

      {/* Activities list */}
      {displayedWorkouts.length > 0 ? (
        <ScrollView 
          showsVerticalScrollIndicator={true} 
          nestedScrollEnabled={true}
          style={{ maxHeight: 400 }}
        >
          {displayedWorkouts.map((workout) => (
            <WorkoutItem
              key={workout.id}
              workout={workout}
              onPress={onWorkoutPress}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={s`items-center justify-center py-8`}>
          <Text style={s`text-6xl mb-2`}>🏃</Text>
          <Text style={[s`text-center`, { color: colors.textTertiary }]}>No activities yet</Text>
          <Text style={[s`text-sm text-center mt-1`, { color: colors.textTertiary }]}>
            Your workouts will appear here
          </Text>
        </View>
      )}
    </View>
  );
};