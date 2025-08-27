import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const STREAK_THRESHOLDS = [3, 5, 7, 14, 21, 30, 50, 100];
const BADGES_STORAGE_KEY = 'gymbud-streak-badges';

interface StreakBadge {
  threshold: number;
  awarded: boolean;
  awardedAt?: string;
}

export function useStreakBadges(currentStreak: number) {
  const { t } = useTranslation(['stats']);
  const [badges, setBadges] = useState<StreakBadge[]>([]);

  // Initialize badges from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(BADGES_STORAGE_KEY);
    if (stored) {
      try {
        setBadges(JSON.parse(stored));
      } catch {
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
    localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(initialBadges));
  };

  // Check for new badges when streak changes
  useEffect(() => {
    if (badges.length === 0) return;

    const updatedBadges = badges.map(badge => {
      if (!badge.awarded && currentStreak >= badge.threshold) {
        // Award new badge
        toast.success(t('stats.highlights.new_badge'), {
          description: t(`badges.streak_${badge.threshold}`),
          duration: 5000,
        });

        return {
          ...badge,
          awarded: true,
          awardedAt: new Date().toISOString(),
        };
      }
      return badge;
    });

    // Only update if there are changes
    const hasChanges = updatedBadges.some((badge, index) => 
      badge.awarded !== badges[index].awarded
    );

    if (hasChanges) {
      setBadges(updatedBadges);
      localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(updatedBadges));
    }
  }, [currentStreak, badges, t]);

  const getAwardedBadges = () => badges.filter(badge => badge.awarded);
  
  const getNextBadge = () => badges.find(badge => !badge.awarded);

  const getHighestBadge = () => {
    const awarded = getAwardedBadges();
    return awarded.length > 0 ? awarded[awarded.length - 1] : null;
  };

  return {
    badges,
    awardedBadges: getAwardedBadges(),
    nextBadge: getNextBadge(),
    highestBadge: getHighestBadge(),
  };
}
