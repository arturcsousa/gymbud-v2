import { useTranslation } from 'react-i18next';
import { Dumbbell, Flame, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { PALETTE } from '../theme';

export default function Programs() {
  const { t } = useTranslation(['landing', 'common']);
  
  const programs = [
    { 
      icon: <Dumbbell className="h-8 w-8" />, 
      title: t('landing:programs.muscle.title'),    
      desc: t('landing:programs.muscle.desc'),    
      color: PALETTE.orange 
    },
    { 
      icon: <Flame className="h-8 w-8" />, 
      title: t('landing:programs.weight.title'),    
      desc: t('landing:programs.weight.desc'),    
      color: PALETTE.deepTeal 
    },
    { 
      icon: <Activity className="h-8 w-8" />, 
      title: t('landing:programs.endurance.title'), 
      desc: t('landing:programs.endurance.desc'), 
      color: PALETTE.aqua 
    },
  ];

  return (
    <section id="programs" style={{ background: PALETTE.orange }} className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('landing:programs.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.deepTeal }}>
            Programas & Objetivos
          </h3>
        </div>

        {/* Carousel-style layout */}
        <div className="relative">
          {/* Navigation arrows */}
          <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-all">
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Program cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-16">
            {programs.map((program, i) => (
              <div 
                key={i} 
                className="rounded-2xl p-8 text-center transform hover:scale-105 transition-all duration-300"
                style={{ backgroundColor: program.color }}
              >
                <div className="mb-6">
                  <div 
                    className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    {program.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{program.title}</h3>
                <p className="text-white/90 text-sm leading-relaxed">
                  {program.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
