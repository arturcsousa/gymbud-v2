import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import domtoimage from 'dom-to-image-more';
import { Button } from '@/components/ui/button';
import { ChartCard } from '@/components/charts/ChartCard';
import { TrainingDaysBar } from '@/components/charts/TrainingDaysBar';
import { VolumeSetsCombo } from '@/components/charts/VolumeSetsCombo';
import { WeightProgression } from '@/components/charts/WeightProgression';
import { useStreakBadges } from '@/hooks/useStreakBadges';

export default function StatsPage() {
  const { t } = useTranslation(['stats', 'badges']);
  const shareRef = useRef<HTMLDivElement>(null);
  const { currentStreak, checkAndAwardBadges } = useStreakBadges();

  // Mock data - will be replaced with real data hooks
  const mockData = {
    totalSessions: 42,
    totalVolume: 15680,
    avgRPE: 7.2,
    currentWeight: 75.5,
    weeklyData: [
      { day: 'Mon', sessions: 1, volume: 2400, sets: 12 },
      { day: 'Tue', sessions: 0, volume: 0, sets: 0 },
      { day: 'Wed', sessions: 1, volume: 2800, sets: 14 },
      { day: 'Thu', sessions: 0, volume: 0, sets: 0 },
      { day: 'Fri', sessions: 1, volume: 3200, sets: 16 },
      { day: 'Sat', sessions: 1, volume: 2600, sets: 13 },
      { day: 'Sun', sessions: 0, volume: 0, sets: 0 },
    ],
    weightHistory: [
      { date: '2024-01-01', weight: 78.2 },
      { date: '2024-01-15', weight: 77.8 },
      { date: '2024-02-01', weight: 77.1 },
      { date: '2024-02-15', weight: 76.5 },
      { date: '2024-03-01', weight: 75.9 },
      { date: '2024-03-15', weight: 75.5 },
    ],
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900/20 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
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
              <div className="text-2xl font-bold text-teal-300">{mockData.totalSessions}</div>
              <div className="text-sm text-gray-300">{t('stats:totalSessions')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{currentStreak}</div>
              <div className="text-sm text-gray-300">{t('stats:currentStreak')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{mockData.totalVolume.toLocaleString()}</div>
              <div className="text-sm text-gray-300">{t('stats:totalVolume')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-300">{mockData.avgRPE}</div>
              <div className="text-sm text-gray-300">{t('stats:avgRPE')}</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6">
            <ChartCard title={t('stats:weeklyActivity')}>
              <TrainingDaysBar data={mockData.weeklyData} />
            </ChartCard>

            <ChartCard title={t('stats:volumeAndSets')}>
              <VolumeSetsCombo data={mockData.weeklyData} />
            </ChartCard>

            <ChartCard title={t('stats:weightProgress')}>
              <WeightProgression data={mockData.weightHistory} />
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
