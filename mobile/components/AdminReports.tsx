/**
 * Admin Reports Component with English/Kinyarwanda Language Support
 * Comprehensive dashboard for learner and lesson analytics
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { getBaseUrl } from '@/lib/api';

const { width } = Dimensions.get('window');

interface ReportData {
  summary: {
    totalLessons: number;
    totalLearners: number;
    totalCompletions: number;
    avgClassScore: number;
    badgeCounts: Record<string, number>;
    translations: {
      totalLessons: string;
      totalLearners: string;
      totalCompletions: string;
      avgClassScore: string;
      badgeCounts: string;
    };
  };
  learners: Array<{
    uid: string;
    completedLessons: number;
    streakDays: number;
    badge: string;
    avgScore: number;
    lastActive: string;
    historyCount: number;
  }>;
  lessonReport: Array<{
    id: string;
    title: string;
    module: string;
    order: number;
    passCount: number;
    failCount: number;
    totalAttempts: number;
    passRate: number;
  }>;
  generatedAt: string;
  language: string;
}

interface AdminReportsProps {
  onLanguageChange?: (language: 'kinyarwanda' | 'english') => void;
}

const AdminReports: React.FC<AdminReportsProps> = ({ onLanguageChange }) => {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'kinyarwanda' | 'english'>('kinyarwanda');
  const [activeTab, setActiveTab] = useState<'summary' | 'learners' | 'lessons'>('summary');

  useEffect(() => {
    fetchReports();
  }, [language]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const base = getBaseUrl();
      const response = await fetch(`${base}/api/admin/reports?lang=${language}`);
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'kinyarwanda' ? 'english' : 'kinyarwanda';
    setLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getBadgeColor = (badge: string): string => {
    const badgeColors: Record<string, string> = {
      'Ntanumwe': '#9E9E9E',
      'None': '#9E9E9E',
      'Inzibacyuho 🥉': '#CD7F32',
      'Bronze 🥉': '#CD7F32',
      'Ifeza 🥈': '#C0C0C0',
      'Silver 🥈': '#C0C0C0',
      'Zahabu 🥇': '#FFD700',
      'Gold 🥇': '#FFD700',
      'Almasi 💎': '#B9F2FF',
      'Diamond 💎': '#B9F2FF',
      'Intsinzi 🏆': '#FF6B6B',
      'Champion 🏆': '#FF6B6B'
    };
    return badgeColors[badge] || '#9E9E9E';
  };

  const renderSummaryCard = () => {
    if (!reports) return null;

    const { summary } = reports;
    const t = summary.translations;

    return (
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Ionicons name="book" size={32} color={colors.primaryForeground} />
          <Text style={styles.summaryNumber}>{summary.totalLessons}</Text>
          <Text style={styles.summaryLabel}>{t.totalLessons}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.accentYellow }]}>
          <Ionicons name="people" size={32} color={colors.primaryForeground} />
          <Text style={styles.summaryNumber}>{summary.totalLearners}</Text>
          <Text style={styles.summaryLabel}>{t.totalLearners}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.success }]}>
          <Ionicons name="checkmark-circle" size={32} color={colors.primaryForeground} />
          <Text style={styles.summaryNumber}>{summary.totalCompletions}</Text>
          <Text style={styles.summaryLabel}>{t.totalCompletions}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.warning }]}>
          <Ionicons name="analytics" size={32} color={colors.primaryForeground} />
          <Text style={styles.summaryNumber}>{summary.avgClassScore}%</Text>
          <Text style={styles.summaryLabel}>{t.avgClassScore}</Text>
        </View>
      </View>
    );
  };

  const renderBadgeDistribution = () => {
    if (!reports) return null;

    const { summary } = reports;
    const t = summary.translations;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.badgeCounts}</Text>
        <View style={styles.badgeGrid}>
          {Object.entries(summary.badgeCounts).map(([badge, count]) => (
            <View key={badge} style={[styles.badgeItem, { backgroundColor: getBadgeColor(badge) }]}>
              <Text style={styles.badgeName}>{badge}</Text>
              <Text style={styles.badgeCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderTopLearners = () => {
    if (!reports) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Learners</Text>
        {reports.learners.slice(0, 10).map((learner, index) => (
          <View key={learner.uid} style={styles.learnerItem}>
            <View style={styles.learnerRank}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
            </View>
            <View style={styles.learnerInfo}>
              <Text style={styles.learnerName}>User {learner.uid.slice(-6)}</Text>
              <Text style={styles.learnerStats}>
                {learner.completedLessons} lessons • {learner.avgScore}% avg • {learner.streakDays} day streak
              </Text>
            </View>
            <View style={[styles.learnerBadge, { backgroundColor: getBadgeColor(learner.badge) }]}>
              <Text style={styles.badgeText}>{learner.badge}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderLessonPerformance = () => {
    if (!reports) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lesson Performance</Text>
        {reports.lessonReport.slice(0, 10).map((lesson) => (
          <View key={lesson.id} style={styles.lessonItem}>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonModule}>{lesson.module}</Text>
            </View>
            <View style={styles.lessonStats}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Pass:</Text>
                <Text style={styles.statValue}>{lesson.passCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Fail:</Text>
                <Text style={styles.statValue}>{lesson.failCount}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Rate:</Text>
                <Text style={[styles.statValue, { color: lesson.passRate >= 70 ? colors.success : colors.danger }]}>
                  {lesson.passRate}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Reports</Text>
        <TouchableOpacity style={styles.languageToggle} onPress={toggleLanguage}>
          <Ionicons name="language" size={20} color={colors.primary} />
          <Text style={styles.languageText}>{language === 'kinyarwanda' ? 'Kiny' : 'Eng'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {(['summary', 'learners', 'lessons'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <View>
            {renderSummaryCard()}
            {renderBadgeDistribution()}
          </View>
        )}

        {/* Learners Tab */}
        {activeTab === 'learners' && renderTopLearners()}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && renderLessonPerformance()}

        {/* Footer */}
        {reports && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Generated on {formatDate(reports.generatedAt)} • Language: {reports.language}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: (width - spacing.md * 3) / 2,
    height: 120,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryNumber: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primaryForeground,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.primaryForeground,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: (width - spacing.md * 2) / 2,
    height: 80,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeName: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: '600',
  },
  badgeCount: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: spacing.xs,
  },
  learnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  learnerRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankNumber: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
    color: colors.white,
  },
  learnerInfo: {
    flex: 1,
  },
  learnerName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  learnerStats: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  learnerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.primaryForeground,
  },
  lessonItem: {
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    shadowColor: colors.border,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lessonInfo: {
    flex: 1,
    marginBottom: spacing.sm,
  },
  lessonTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  lessonModule: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  lessonStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statRow: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textLight,
  },
});

export default AdminReports;
