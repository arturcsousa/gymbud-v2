import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Badge {
  threshold: number;
  awarded: boolean;
  awardedAt?: Date;
}

const STREAK_THRESHOLDS = [3, 5, 7, 14, 30, 50, 75, 100];

export function useStreakBadges() {
  const { t } = useTranslation(['badges']);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load badges from localStorage
  useEffect(() => {
    const savedBadges = localStorage.getItem('gymbud_streak_badges');
    if (savedBadges) {
      try {
        const parsed = JSON.parse(savedBadges);
        setBadges(parsed);
      } catch (error) {
        console.error('Failed to parse saved badges:', error);
        initializeBadges();
      }
    } else {
      initializeBadges();
    }
  }, []);

  const initializeBadges = () => {
    const initialBadges = STREAK_THRESHOLDS.map(threshold => ({
      threshold,
      awarded: false,
    }));
    setBadges(initialBadges);
    localStorage.setItem('gymbud_streak_badges', JSON.stringify(initialBadges));
  };

  // Calculate current streak from completed sessions
  const calculateCurrentStreak = useCallback(() => {
    // This would normally query the database for consecutive completed sessions
    // For now, we'll use a mock calculation
    const mockCompletedSessions = [
      { date: '2024-03-15', status: 'completed' },
      { date: '2024-03-14', status: 'completed' },
      { date: '2024-03-13', status: 'completed' },
      { date: '2024-03-12', status: 'completed' },
      { date: '2024-03-11', status: 'completed' },
    ];

    // Calculate consecutive days from today backwards
    const today = new Date();
    let streak = 0;
    
    for (let i = 0; i < 100; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasSession = mockCompletedSessions.some(
        session => session.date === dateStr && session.status === 'completed'
      );
      
      if (hasSession) {
        streak++;
      } else {
        break;
      }
    }

    setCurrentStreak(streak);
    return streak;
  }, []);

  // Check for new badges and award them
  const checkAndAwardBadges = useCallback(() => {
    const streak = calculateCurrentStreak();
    
    setBadges(prevBadges => {
      const updatedBadges = prevBadges.map(badge => {
        if (!badge.awarded && streak >= badge.threshold) {
          // Award the badge
          const awardedBadge = {
            ...badge,
            awarded: true,
            awardedAt: new Date(),
          };

          // Show toast notification
          toast.success(t(`badges:streak_${badge.threshold}_awarded`), {
            description: t('badges:streakAchievement', { days: badge.threshold }),
            duration: 5000,
          });

          return awardedBadge;
        }
        return badge;
      });

      // Save to localStorage
      localStorage.setItem('gymbud_streak_badges', JSON.stringify(updatedBadges));
      
      return updatedBadges;
    });
  }, [calculateCurrentStreak, t]);

  // Get the next badge to earn
  const getNextBadge = useCallback(() => {
    return badges.find(badge => !badge.awarded);
  }, [badges]);

  // Get awarded badges
  const getAwardedBadges = useCallback(() => {
    return badges.filter(badge => badge.awarded);
  }, [badges]);

  return {
    currentStreak,
    badges,
    checkAndAwardBadges,
    getNextBadge,
    getAwardedBadges,
    calculateCurrentStreak,
  };
}
