import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface StatsShareCardProps {
  userName?: string;
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  weeklyAverage: number;
  hidePersonalInfo?: boolean;
}

export const StatsShareCard = forwardRef<HTMLDivElement, StatsShareCardProps>(
  ({ userName, currentStreak, longestStreak, totalWorkouts, weeklyAverage, hidePersonalInfo }, ref) => {
    const { t } = useTranslation(['stats']);

    return (
      <div
        ref={ref}
        className="w-[1080px] h-[1350px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)',
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute top-60 right-32 w-24 h-24 rounded-full bg-white/15" />
          <div className="absolute bottom-40 left-40 w-28 h-28 rounded-full bg-white/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-16 h-full flex flex-col">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-8xl font-bold text-white mb-4">GymBud</h1>
            <p className="text-3xl text-white/80">Training Stats</p>
            {!hidePersonalInfo && userName && (
              <p className="text-2xl text-white/70 mt-4">{userName}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="flex-1 grid grid-cols-2 gap-8">
            {/* Current Streak */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
              <div className="text-7xl font-bold text-white mb-4">{currentStreak}</div>
              <div className="text-2xl text-white/80">{t('stats.cards.streak.title')}</div>
            </div>

            {/* Longest Streak */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
              <div className="text-7xl font-bold text-white mb-4">{longestStreak}</div>
              <div className="text-2xl text-white/80">{t('stats.cards.longest_streak')}</div>
            </div>

            {/* Total Workouts */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
              <div className="text-7xl font-bold text-white mb-4">{totalWorkouts}</div>
              <div className="text-2xl text-white/80">Total Workouts</div>
            </div>

            {/* Weekly Average */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
              <div className="text-7xl font-bold text-white mb-4">{weeklyAverage.toFixed(1)}</div>
              <div className="text-2xl text-white/80">Days/Week</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16">
            <p className="text-2xl text-white/60">Training with GymBud 💪</p>
            <p className="text-xl text-white/50 mt-2">app.gymbud.ai</p>
          </div>
        </div>
      </div>
    );
  }
);

StatsShareCard.displayName = 'StatsShareCard';

export async function exportStatsCard(el: HTMLElement, fileName = "gymbud-stats.png") {
  try {
    const domtoimage = await import('dom-to-image-more');
    const blob = await domtoimage.toBlob(el, { 
      width: 1080, 
      height: 1350, 
      quality: 1,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });
    
    const file = new File([blob], fileName, { type: "image/png" });

    const n = navigator as any;
    if (n.canShare?.({ files: [file] })) {
      await n.share({ files: [file], text: "Training with GymBud 💪" });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); 
      a.href = url; 
      a.download = fileName; 
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to export stats card:', error);
    throw error;
  }
}
