/**
 * Real-time Progress Tracker Component
 * Displays progress, achievements, and streak information
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import ProgressManager, { EnhancedProgress, Achievement, ProgressListener } from '@/lib/progress-manager';

const { width } = Dimensions.get('window');

interface ProgressTrackerProps {
  userId: string;
  token?: string | null;
  showAchievements?: boolean;
  showStreak?: boolean;
  compact?: boolean;
}

export default function ProgressTracker({ 
  userId, 
  token, 
  showAchievements = true, 
  showStreak = true,
  compact = false 
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<EnhancedProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [showAchievementPopup, setShowAchievementPopup] = useState(false);
  
  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const achievementAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;

  // Load initial progress
  useEffect(() => {
    loadProgress();
  }, [userId, token]);

  // Setup progress listener
  useEffect(() => {
    const listener: ProgressListener = {
      onProgressUpdate: (updatedProgress) => {
        setProgress(updatedProgress);
        animateProgress(updatedProgress.progressPercentage);
      },
      onAchievementUnlock: (achievement) => {
        setRecentAchievement(achievement);
        setShowAchievementPopup(true);
        animateAchievement();
        
        // Hide popup after 3 seconds
        setTimeout(() => {
          setShowAchievementPopup(false);
        }, 3000);
      },
      onStreakUpdate: (streak) => {
        animateStreak();
      },
      onError: (error) => {
        console.error('Progress error:', error);
      }
    };

    ProgressManager.addListener(listener);

    return () => {
      ProgressManager.removeListener(listener);
    };
  }, []);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      const progressData = await ProgressManager.loadProgress(userId, token);
      setProgress(progressData);
      
      if (progressData) {
        animateProgress(progressData.progressPercentage);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, token]);

  const animateProgress = (percentage: number) => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  };

  const animateAchievement = () => {
    Animated.sequence([
      Animated.timing(achievementAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(achievementAnim, {
        toValue: 0,
        duration: 500,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateStreak = () => {
    Animated.sequence([
      Animated.timing(streakAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(streakAnim, {
        toValue: 0,
        duration: 300,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <View style={styles.skeleton}>
          <View style={styles.skeletonProgress} />
          <View style={styles.skeletonText} />
        </View>
      </View>
    );
  }

  if (!progress) {
    return null;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {/* Main Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>
            {compact ? 'Progress' : 'Your Progress'}
          </Text>
          <Text style={styles.progressPercentage}>
            {Math.round(progress.progressPercentage)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <Animated.View 
              style={[
                styles.progressFill,
                { width: progressWidth }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.progressDetails}>
          <Text style={styles.progressText}>
            {progress.completedLessons} / {progress.totalLessons} lessons
          </Text>
          <Text style={styles.progressText}>
            Level {progress.level} • {progress.xp} XP
          </Text>
        </View>
      </View>

      {/* Streak */}
      {showStreak && !compact && (
        <View style={styles.streakSection}>
          <Animated.View 
            style={[
              styles.streakContainer,
              {
                transform: [{
                  scale: streakAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  })
                }]
              }
            ]}
          >
            <Ionicons name="flame" size={24} color={colors.warning} />
            <Text style={styles.streakText}>
              {progress.learningStreak.currentStreak} day streak
            </Text>
          </Animated.View>
        </View>
      )}

      {/* Recent Achievement Popup */}
      {showAchievementPopup && recentAchievement && (
        <Animated.View 
          style={[
            styles.achievementPopup,
            {
              opacity: achievementAnim,
              transform: [{
                translateY: achievementAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.achievementContent}>
            <Text style={styles.achievementIcon}>
              {recentAchievement.icon}
            </Text>
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>
                Achievement Unlocked!
              </Text>
              <Text style={styles.achievementName}>
                {recentAchievement.name}
              </Text>
              <Text style={styles.achievementDescription}>
                {recentAchievement.description}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Achievements */}
      {showAchievements && !compact && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsList}>
            {progress.achievements.slice(-3).map((achievement, index) => (
              <View key={achievement.id} style={styles.achievementItem}>
                <Text style={styles.achievementIconSmall}>
                  {achievement.icon}
                </Text>
                <Text style={styles.achievementNameSmall}>
                  {achievement.name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Module Progress */}
      {!compact && progress.moduleProgress && (
        <View style={styles.moduleSection}>
          <Text style={styles.sectionTitle}>Module Progress</Text>
          {Object.entries(progress.moduleProgress).map(([module, data]) => (
            <View key={module} style={styles.moduleItem}>
              <Text style={styles.moduleName}>{module}</Text>
              <View style={styles.moduleProgressContainer}>
                <View style={styles.moduleProgressBar}>
                  <View 
                    style={[
                      styles.moduleProgressFill,
                      { width: `${data.percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.modulePercentage}>
                  {data.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  compactContainer: {
    padding: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressPercentage: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  streakSection: {
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  streakText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.warning,
  },
  achievementsSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  achievementsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  achievementIconSmall: {
    fontSize: fontSize.lg,
    marginRight: spacing.xs,
  },
  achievementNameSmall: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  moduleSection: {
    marginBottom: spacing.md,
  },
  moduleItem: {
    marginBottom: spacing.sm,
  },
  moduleName: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  moduleProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  moduleProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  modulePercentage: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    minWidth: 30,
  },
  achievementPopup: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.foreground,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    fontSize: fontSize['3xl'],
    marginRight: spacing.md,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.background,
    marginBottom: spacing.xs,
  },
  achievementName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.background,
    marginBottom: spacing.xs,
  },
  achievementDescription: {
    fontSize: fontSize.sm,
    color: colors.background + 'CC',
  },
  // Skeleton loading
  skeleton: {
    gap: spacing.sm,
  },
  skeletonProgress: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.full,
  },
  skeletonText: {
    height: 16,
    backgroundColor: colors.muted,
    borderRadius: borderRadius.sm,
    width: '60%',
  },
});
