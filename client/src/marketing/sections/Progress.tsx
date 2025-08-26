import { useTranslation } from 'react-i18next';
import { PALETTE } from '../theme';
import { Trophy, TrendingUp, Calendar, Clock, BarChart, Target, Zap, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Progress() {
  const { t } = useTranslation(['landing', 'common']);

  const metrics = [
    { 
      icon: <Trophy className="h-6 w-6" />, 
      titleKey: 'progress.metrics.prs',
      color: PALETTE.orange 
    },
    { 
      icon: <TrendingUp className="h-6 w-6" />, 
      titleKey: 'progress.metrics.volume',
      color: PALETTE.aqua 
    },
    { 
      icon: <Calendar className="h-6 w-6" />, 
      titleKey: 'progress.metrics.streaks',
      color: PALETTE.teal 
    },
    { 
      icon: <Clock className="h-6 w-6" />, 
      titleKey: 'progress.metrics.rest',
      color: PALETTE.orange 
    },
    { 
      icon: <BarChart className="h-6 w-6" />, 
      titleKey: 'progress.metrics.history',
      color: PALETTE.aqua 
    },
    { 
      icon: <Target className="h-6 w-6" />, 
      titleKey: 'Track every goal milestone and achievement',
      color: PALETTE.teal 
    },
  ];

  return (
    <section id="progress" className="relative py-20" style={{ backgroundColor: PALETTE.deepTeal }}>
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-20 right-10 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: PALETTE.aqua }}
        />
        <div 
          className="absolute bottom-20 left-10 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: PALETTE.orange }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {t('progress.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.aqua }}>
            {t('progress.subtitle')}
          </h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Phone Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Phone frame with enhanced styling */}
              <div className="relative h-[520px] w-[260px] rounded-[36px] p-4 shadow-2xl" 
                   style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                {/* Screen content */}
                <div className="h-full w-full rounded-[28px] bg-gradient-to-b from-gray-900 to-gray-800 p-4 flex flex-col justify-center items-center text-white text-sm">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center mb-6">
                      <Award className="h-8 w-8" style={{ color: PALETTE.orange }} />
                    </div>
                    <div className="space-y-3">
                      <div className="text-xs opacity-80">Personal Records</div>
                      <div className="text-xs opacity-80">Training Volume</div>
                      <div className="text-xs opacity-80">Consistency Streaks</div>
                      <div className="text-xs opacity-80">Rest Tracking</div>
                      <div className="text-xs opacity-80">Exercise History</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Glowing effect around phone */}
              <div 
                className="absolute inset-0 rounded-[36px] opacity-20 blur-xl"
                style={{ backgroundColor: PALETTE.aqua }}
              />
            </div>
          </motion.div>

          {/* Right side - Enhanced Metrics Grid */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative p-6 rounded-2xl backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  {/* Icon with colored background */}
                  <div 
                    className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                    style={{ backgroundColor: `${metric.color}20` }}
                  >
                    <div style={{ color: metric.color }}>
                      {metric.icon}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {t(metric.titleKey)}
                  </h4>
                  
                  {/* Decorative accent */}
                  <div 
                    className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl opacity-60"
                    style={{ backgroundColor: metric.color }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Call-to-action card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 p-8 rounded-2xl backdrop-blur-sm border-2 text-center"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderColor: PALETTE.orange 
              }}
            >
              <Zap className="h-8 w-8 mx-auto mb-4" style={{ color: PALETTE.orange }} />
              <h4 className="text-xl font-bold text-white mb-2">
                Start Tracking Your Progress
              </h4>
              <p className="text-white/80 mb-6">
                Every rep, set, and milestone automatically recorded and analyzed.
              </p>
              <button 
                className="px-8 py-3 rounded-full font-semibold transition-all hover:scale-105"
                style={{ 
                  backgroundColor: PALETTE.orange,
                  color: 'white'
                }}
              >
                {t('common:cta.start_free')}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
