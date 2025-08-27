import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import domtoimage from 'dom-to-image-more';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/charts/ChartCard';
import { TrainingDaysBar } from '@/components/charts/TrainingDaysBar';
import { VolumeSetsCombo } from '@/components/charts/VolumeSetsCombo';
import { WeightProgression } from '@/components/charts/WeightProgression';
import { useStreakBadges } from '@/hooks/useStreakBadges';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { useProfileData } from '@/hooks/useProfileData';

export default function StatsPage() {
  const { t } = useTranslation(['stats', 'badges']);
  const shareRef = useRef<HTMLDivElement>(null);
  const { currentStreak, checkAndAwardBadges } = useStreakBadges();
  
  // Real data hooks
  const { metrics, isLoading: metricsLoading, isOffline: metricsOffline } = useSessionMetrics();
  const { profileData, isLoading: profileLoading, isOffline: profileOffline } = useProfileData();

  const isLoading = metricsLoading || profileLoading;
  const isOffline = metricsOffline || profileOffline;

  const handleShare = async () => {
    if (!shareRef.current) return;

    try {
      const dataUrl = await domtoimage.toPng(shareRef.current, {
        width: 1080,
        height: 1350,
        quality: 1,
        bgcolor: '#0f172a',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
        },
      });

      if (navigator.share && navigator.canShare) {
        // Convert data URL to blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'gymbud-progress.png', { type: 'image/png' });
        
        await navigator.share({
          title: t('stats:shareTitle'),
          text: t('stats:shareText'),
          files: [file],
        });
      } else {
        // Fallback: download the image
        const link = document.createElement('a');
        link.download = 'gymbud-progress.png';
        link.href = dataUrl;
        link.click();
        toast.success(t('stats:downloadSuccess'));
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast.error(t('stats:shareError'));
    }
  };

  React.useEffect(() => {
    // Check for new badges when component mounts
    checkAndAwardBadges();
  }, [checkAndAwardBadges]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-300"></div>
              <span className="text-white">Loading your progress...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Offline indicator */}
        {isOffline && (
          <div className="mb-4 bg-orange-500/20 backdrop-blur-sm rounded-lg border border-orange-500/30 p-3">
            <div className="flex items-center space-x-2 text-orange-200">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Showing offline data - will sync when online</span>
            </div>
          </div>
        )}

        {/* Share Container */}
        <div
          ref={shareRef}
          className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">{t('stats:title')}</h1>
            <p className="text-teal-200">{t('stats:subtitle')}</p>
          </div>

          {/* Highlights Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{metrics.totalSessions}</div>
              <div className="text-sm text-gray-300">{t('stats:totalSessions')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{metrics.currentStreak}</div>
              <div className="text-sm text-gray-300">{t('stats:currentStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{metrics.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-300">{t('stats:totalVolume')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{metrics.avgRPE || '--'}</div>
              <div className="text-sm text-gray-300">{t('stats:avgRPE')}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6">
            <ChartCard title={t('stats:weeklyActivity')}>
              {metrics.weeklyData.length > 0 ? (
                <TrainingDaysBar data={metrics.weeklyData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No training data yet</p>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title={t('stats:volumeAndSets')}>
              {metrics.weeklyData.length > 0 ? (
                <VolumeSetsCombo data={metrics.weeklyData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No volume data yet</p>
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title={t('stats:weightProgress')}>
              {profileData.weightHistory.length > 0 ? (
                <WeightProgression data={profileData.weightHistory} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No weight data yet</p>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          {/* GymBud Branding */}
          <div className="text-center pt-4 border-t border-white/10">
            <div className="text-teal-300 font-bold text-lg">GymBud</div>
            <div className="text-gray-400 text-sm">{t('stats:brandTagline')}</div>
          </div>
        </div>

        {/* Share Button */}
        <div className="mt-6 text-center">
          <Button
            onClick={handleShare}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-semibold"
            disabled={metrics.totalSessions === 0}
          >
            <Share2 className="w-5 h-5 mr-2" />
            {t('stats:shareProgress')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { StatsPage };
