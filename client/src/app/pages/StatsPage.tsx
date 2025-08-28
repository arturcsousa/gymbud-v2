import { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/charts/ChartCard';
import { TrainingDaysBar } from '@/components/charts/TrainingDaysBar';
import { VolumeSetsCombo } from '@/components/charts/VolumeSetsCombo';
import { WeightProgression } from '@/components/charts/WeightProgression';
import BottomNav from '@/components/BottomNav';
import { useStreakBadges } from '@/hooks/useStreakBadges';
import { useSessionMetrics } from '@/hooks/useSessionMetrics';
import { useProfileData } from '@/hooks/useProfileData';
import domtoimage from 'dom-to-image-more';

export default function StatsPage() {
  const { t } = useTranslation(['stats', 'badges']);
  const shareRef = useRef<HTMLDivElement>(null);
  const { checkAndAwardBadges } = useStreakBadges();
  
  // Real data hooks
  const { metrics, isLoading: metricsLoading, isOffline: metricsOffline } = useSessionMetrics();
  const { profileData, isLoading: profileLoading, isOffline: profileOffline } = useProfileData();

  const isLoading = metricsLoading || profileLoading;
  const isOffline = metricsOffline || profileOffline;

  useEffect(() => {
    // Check for new badges when component mounts
    checkAndAwardBadges();
  }, [checkAndAwardBadges]);

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden pb-20"
        style={{
          background: '#005870', // PALETTE.deepTeal
        }}
      >
        {/* Main teal gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
          }}
        />
        
        {/* Subtle lighter teal curved section with diagonal clip */}
        <div 
          className="absolute top-0 right-0 w-2/3 h-full"
          style={{
            background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Loading content */}
        <div className="relative z-10 px-6 pt-8 pb-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl ring-1 ring-white/20">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">Loading...</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const handleShare = async () => {
    if (!shareRef.current) return;

    try {
      const dataUrl = await domtoimage.toPng(shareRef.current, {
        width: 1080,
        height: 1350,
        quality: 1,
        bgcolor: '#005870',
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
        },
      });

      if (navigator.share && 'canShare' in navigator) {
        // Convert data URL to blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'gymbud-progress.png', { type: 'image/png' });
        
        await navigator.share({
          title: t('stats:shareTitle'),
          text: t('stats:shareText'),
          files: [file],
        });
        
        toast.success(t('stats:shareSuccess'));
      } else {
        // Fallback to download
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

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20"
      style={{
        background: '#005870', // PALETTE.deepTeal
      }}
    >
      {/* Main teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      {/* Subtle lighter teal curved section with diagonal clip */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Main content - positioned directly on page */}
      <div className="relative z-10 px-6 pt-8 pb-4 space-y-6">
        {/* Offline indicator */}
        {isOffline && (
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg border border-orange-500/30 p-3">
            <div className="flex items-center space-x-2 text-orange-200">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Showing offline data - will sync when online</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-white">{t('stats:title')}</h1>
            <p className="text-white/70 text-sm">{t('stats:subtitle')}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div 
          ref={shareRef}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{metrics.totalSessions}</div>
              <div className="text-white font-bold text-xs">{t('stats:totalSessions')}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{metrics.currentStreak}</div>
              <div className="text-white font-bold text-xs">{t('stats:currentStreak')}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{Math.round(metrics.totalVolume)}</div>
              <div className="text-white font-bold text-xs">{t('stats:totalVolume')}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{metrics.avgRPE.toFixed(1)}</div>
              <div className="text-white font-bold text-xs">{t('stats:avgRPE')}</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
            <ChartCard title={t('stats:weeklyActivity')}>
              {metrics.weeklyData.length > 0 ? (
                <TrainingDaysBar data={metrics.weeklyData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No activity data yet</p>
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
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
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
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
        </div>

        {/* Share Button */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <Button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            disabled={metrics.totalSessions === 0}
          >
            <Share2 className="w-5 h-5" />
            {t('stats:shareProgress')}
          </Button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}

export { StatsPage };
