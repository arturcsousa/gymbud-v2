import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { Play, History, TrendingUp, Target } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

function HomePage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()

  const handleStartWorkout = () => {
    setLocation('/session/new')
  }

  const handleViewHistory = () => {
    setLocation('/history')
  }

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
        {/* Welcome Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            {t('app:home.welcome')}
          </h1>
          <p className="text-white/70 text-sm">
            {t('app:home.subtitle')}
          </p>
        </div>

        {/* Today's Plan */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] flex items-center justify-center">
              <Target className="w-3 h-3 text-slate-900" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Today's Workout
            </h2>
          </div>
          
          <div className="flex justify-between text-xs text-white/70 mb-3">
            <span>5 exercises</span>
            <span>45 minutes</span>
          </div>
          <div className="text-white font-medium text-xs mb-4">Upper Body Strength</div>

          <button
            onClick={handleStartWorkout}
            className="w-full bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 font-semibold py-2.5 px-4 rounded-lg hover:from-[#00ACC1] hover:to-[#4DD0E1] transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <Play className="w-4 h-4" />
            Start Workout
          </button>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 shadow-xl ring-1 ring-white/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white">
              Quick Stats
            </h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white">3</div>
              <div className="text-white/70 text-xs">
                This Week
              </div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">7</div>
              <div className="text-white/70 text-xs">
                Day Streak
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleViewHistory}
            className="bg-white/10 backdrop-blur-xl rounded-lg p-3 shadow-xl ring-1 ring-white/20 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-2"
          >
            <History className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-xs">
              History
            </span>
          </button>
          
          <button
            onClick={() => setLocation('/library')}
            className="bg-white/10 backdrop-blur-xl rounded-lg p-3 shadow-xl ring-1 ring-white/20 hover:bg-white/20 transition-all duration-200 flex flex-col items-center gap-2"
          >
            <TrendingUp className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-xs">
              Library
            </span>
          </button>
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}

export { HomePage as default }
export { HomePage }
