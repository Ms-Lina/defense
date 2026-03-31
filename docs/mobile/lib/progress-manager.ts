/**
 * Real-time Progress Manager for Mobile App
 * Handles progress updates, achievements, and synchronization
 */
import { api, ProgressData } from './api';

export interface ProgressEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface EnhancedAssessmentResult {
  score: number;
  passed: boolean;
  timeSpent?: number;
  timeBonus?: number;
  breakdown?: any[];
  learningMetrics?: {
    engagementScore: number;
    masteryLevel: string;
    improvementAreas: string[];
    nextRecommendations: any[];
  };
}

export interface EnhancedProgress extends ProgressData {
  level: number;
  xp: number;
  nextLevelXP: number;
  progressPercentage: number;
  achievements: Achievement[];
  recentEvents: ProgressEvent[];
  moduleProgress: Record<string, {
    total: number;
    completed: number;
    percentage: number;
  }>;
  learningStreak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string | null;
  };
  weeklyProgress: {
    weekOf: string;
    lessonsCompleted: number;
    practiceSessions: number;
    totalActivity: number;
  };
}

export interface ProgressListener {
  onProgressUpdate?: (progress: EnhancedProgress) => void;
  onAchievementUnlock?: (achievement: Achievement) => void;
  onStreakUpdate?: (streak: number) => void;
  onLevelUp?: (newLevel: number) => void;
  onError?: (error: Error) => void;
}

class ProgressManager {
  private static instance: ProgressManager;
  private listeners: ProgressListener[] = [];
  private currentProgress: EnhancedProgress | null = null;
  private syncQueue: ProgressEvent[] = [];
  private isOnline: boolean = true;
  private syncInterval: number | null = null;
  private lastSyncAt: Date | null = null;

  private constructor() {
    this.initializeSync();
    this.setupNetworkListeners();
  }

  static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  /**
   * Add progress event listener
   */
  addListener(listener: ProgressListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove progress event listener
   */
  removeListener(listener: ProgressListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current progress
   */
  getCurrentProgress(): EnhancedProgress | null {
    return this.currentProgress;
  }

  /**
   * Load initial progress data
   */
  async loadProgress(userId: string, token?: string | null): Promise<EnhancedProgress | null> {
    try {
      const response = await fetch(`${api.getBaseUrl()}/api/progress/enhanced/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to load progress: ${response.status}`);
      }

      const progress = await response.json();
      this.currentProgress = progress;
      this.notifyProgressUpdate(progress);
      
      return progress;
    } catch (error) {
      console.error('Error loading progress:', error);
      this.notifyError(error as Error);
      return null;
    }
  }

  /**
   * Update progress in real-time
   */
  async updateProgress(type: string, data: any, token?: string | null): Promise<void> {
    const event: ProgressEvent = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    // Add to sync queue
    this.syncQueue.push(event);

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncProgress(token);
    } else {
      console.log('Offline - progress event queued for later sync');
    }
  }

  /**
   * Batch update multiple progress events
   */
  async batchUpdateProgress(updates: Array<{ type: string; data: any }>, token?: string | null): Promise<void> {
    const events = updates.map(update => ({
      type: update.type,
      data: update.data,
      timestamp: new Date().toISOString()
    }));

    // Add all to sync queue
    this.syncQueue.push(...events);

    // Try to sync immediately if online
    if (this.isOnline) {
      await this.syncBatchProgress(events, token);
    } else {
      console.log('Offline - batch progress events queued for later sync');
    }
  }

  /**
   * Handle lesson completion
   */
  async handleLessonCompletion(lessonId: string, result: EnhancedAssessmentResult, token?: string | null): Promise<void> {
    await this.updateProgress('lesson.completed', {
      lessonId,
      score: result.score,
      passed: result.passed,
      timeSpent: result.timeSpent,
      masteryLevel: result.learningMetrics?.masteryLevel
    }, token);

    // Check for level up
    if (this.currentProgress) {
      const newLevel = this.calculateLevel(result.score);
      if (newLevel > this.currentProgress.level) {
        await this.updateProgress('level.up', { newLevel }, token);
        this.notifyLevelUp(newLevel);
      }
    }
  }

  /**
   * Handle practice session completion
   */
  async handlePracticeCompletion(practiceId: string, result: EnhancedAssessmentResult, token?: string | null): Promise<void> {
    await this.updateProgress('practice.submitted', {
      practiceId,
      score: result.score,
      passed: result.passed,
      timeSpent: result.timeSpent,
      engagementScore: result.learningMetrics?.engagementScore
    }, token);
  }

  /**
   * Update daily streak
   */
  async updateDailyStreak(token?: string | null): Promise<void> {
    if (this.currentProgress) {
      const newStreak = this.currentProgress.learningStreak.currentStreak + 1;
      await this.updateProgress('streak.updated', {
        streakDays: newStreak,
        longestStreak: Math.max(newStreak, this.currentProgress.learningStreak.longestStreak)
      }, token);
      
      this.notifyStreakUpdate(newStreak);
    }
  }

  /**
   * Get recent progress events
   */
  async getRecentEvents(userId: string, limit: number = 50, token?: string | null): Promise<ProgressEvent[]> {
    try {
      const response = await fetch(`${api.getBaseUrl()}/api/progress/events/${userId}?limit=${limit}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Failed to get events: ${response.status}`);
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Force sync all pending progress
   */
  async forceSync(token?: string | null): Promise<void> {
    if (this.syncQueue.length > 0) {
      await this.syncBatchProgress(this.syncQueue, token);
    }
  }

  /**
   * Get offline status
   */
  getOfflineStatus(): {
    isOnline: boolean;
    pendingEvents: number;
    lastSync: Date | null;
  } {
    return {
      isOnline: this.isOnline,
      pendingEvents: this.syncQueue.length,
      lastSync: this.lastSyncAt
    };
  }

  // Private methods

  private initializeSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.syncProgress();
      }
    }, 30000);
  }

  private setupNetworkListeners(): void {
    // In a real app, you'd listen to network status changes
    // For now, we'll assume we're always online
    this.isOnline = true;
  }

  private async syncProgress(token?: string | null): Promise<void> {
    if (this.syncQueue.length === 0) return;

    const event = this.syncQueue.shift();
    if (!event) return;

    try {
      const response = await fetch(`${api.getBaseUrl()}/api/progress/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.progress) {
        this.currentProgress = result.progress;
        this.notifyProgressUpdate(result.progress);
        
        // Check for new achievements
        if (result.event?.type === 'achievement.unlocked') {
          this.notifyAchievementUnlock(result.event.data);
        }
      }

      this.lastSyncAt = new Date();

    } catch (error) {
      console.error('Sync failed:', error);
      // Put the event back in the queue
      this.syncQueue.unshift(event);
      this.notifyError(error as Error);
    }
  }

  private async syncBatchProgress(events: ProgressEvent[], token?: string | null): Promise<void> {
    if (events.length === 0) return;

    try {
      const response = await fetch(`${api.getBaseUrl()}/api/progress/batch-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ updates: events }),
      });

      if (!response.ok) {
        throw new Error(`Batch sync failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.progress) {
        this.currentProgress = result.progress;
        this.notifyProgressUpdate(result.progress);
        
        // Clear synced events from queue
        this.syncQueue = this.syncQueue.filter(event => 
          !events.find(syncedEvent => syncedEvent.type === event.type && syncedEvent.timestamp === event.timestamp)
        );
      }

      this.lastSyncAt = new Date();

    } catch (error) {
      console.error('Batch sync failed:', error);
      this.notifyError(error as Error);
    }
  }

  private calculateLevel(score: number): number {
    if (score >= 95) return 5;
    if (score >= 85) return 4;
    if (score >= 75) return 3;
    if (score >= 65) return 2;
    return 1;
  }

  private notifyProgressUpdate(progress: EnhancedProgress): void {
    this.listeners.forEach(listener => {
      if (listener.onProgressUpdate) {
        listener.onProgressUpdate(progress);
      }
    });
  }

  private notifyAchievementUnlock(achievement: Achievement): void {
    this.listeners.forEach(listener => {
      if (listener.onAchievementUnlock) {
        listener.onAchievementUnlock(achievement);
      }
    });
  }

  private notifyStreakUpdate(streak: number): void {
    this.listeners.forEach(listener => {
      if (listener.onStreakUpdate) {
        listener.onStreakUpdate(streak);
      }
    });
  }

  private notifyLevelUp(newLevel: number): void {
    this.listeners.forEach(listener => {
      if (listener.onLevelUp) {
        listener.onLevelUp(newLevel);
      }
    });
  }

  private notifyError(error: Error): void {
    this.listeners.forEach(listener => {
      if (listener.onError) {
        listener.onError(error);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.listeners = [];
    this.currentProgress = null;
    this.syncQueue = [];
  }
}

export default ProgressManager.getInstance();
