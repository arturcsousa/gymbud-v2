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
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-teal-900 via-teal-950 to-black p-6 pb-24">
      <div className="w-full max-w-md space-y-4">
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">
            {t('app:home.welcome')}
          </h1>
          <p className="text-white/70">
            {t('app:home.subtitle')}
          </p>
        </div>

        {/* Today's Plan Card */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-4 shadow-xl ring-1 ring-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] flex items-center justify-center">
              <Target className="w-4 h-4 text-slate-900" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {t('app:home.todaysPlan')}
            </h2>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/70">5 {t('app:home.nextSession.exercises')}</span>
              <span className="text-white/70">45 {t('app:home.nextSession.minutes')}</span>
            </div>
            <div className="text-white font-medium text-sm">Upper Body Strength</div>
          </div>

          <button
            onClick={handleStartWorkout}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 font-semibold py-2.5 px-4 rounded-xl hover:from-[#00ACC1] hover:to-[#4DD0E1] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4" />
            {t('app:home.startWorkout')}
          </button>
        </div>

        {/* Quick Stats Card */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-xl p-4 shadow-xl ring-1 ring-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              {t('app:home.quickStats.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-1">3</div>
              <div className="text-white/70 text-xs">
                {t('app:home.quickStats.workoutsThisWeek')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-1">7</div>
              <div className="text-white/70 text-xs">
                {t('app:home.quickStats.currentStreak')}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleViewHistory}
            className="rounded-xl bg-white/10 backdrop-blur-xl p-3 shadow-xl ring-1 ring-white/10 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-2"
          >
            <History className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-xs">
              {t('app:home.viewHistory')}
            </span>
          </button>
          
          <button
            onClick={() => setLocation('/library')}
            className="rounded-xl bg-white/10 backdrop-blur-xl p-3 shadow-xl ring-1 ring-white/10 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-2"
          >
            <TrendingUp className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-xs">
              {t('app:nav.library')}
            </span>
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default HomePage;
