import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { Play, History, TrendingUp, Target } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const HomePage: React.FC = () => {
  const { t } = useTranslation(['app', 'common']);
  const [, setLocation] = useLocation();

  const handleStartWorkout = () => {
    setLocation('/session/new');
  };

  const handleViewHistory = () => {
    setLocation('/history');
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-teal-900 via-teal-950 to-black p-6">
      <div className="w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-xl p-6 shadow-xl ring-1 ring-white/10">
        {/* Welcome Header */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-semibold text-white mb-1">
            {t('app:home.welcome')}
          </h1>
          <p className="text-white/70 text-sm">
            {t('app:home.subtitle')}
          </p>
        </div>

        {/* Today's Plan */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] flex items-center justify-center">
              <Target className="w-3 h-3 text-slate-900" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              {t('app:home.todaysPlan')}
            </h2>
          </div>
          
          <div className="flex justify-between text-xs text-white/70 mb-2">
            <span>5 {t('app:home.nextSession.exercises')}</span>
            <span>45 {t('app:home.nextSession.minutes')}</span>
          </div>
          <div className="text-white font-medium text-xs mb-3">Upper Body Strength</div>

          <button
            onClick={handleStartWorkout}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 font-semibold py-2 px-3 rounded-lg hover:from-[#00ACC1] hover:to-[#4DD0E1] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-3 h-3" />
            {t('app:home.startWorkout')}
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              {t('app:home.quickStats.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-white">3</div>
              <div className="text-white/70 text-xs">
                {t('app:home.quickStats.workoutsThisWeek')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">7</div>
              <div className="text-white/70 text-xs">
                {t('app:home.quickStats.currentStreak')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleViewHistory}
            className="bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-1"
          >
            <History className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-xs">
              {t('app:home.viewHistory')}
            </span>
          </button>
          
          <button
            onClick={() => setLocation('/stats')}
            className="bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-1"
          >
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-xs">
              {t('app:nav.stats')}
            </span>
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default HomePage;
