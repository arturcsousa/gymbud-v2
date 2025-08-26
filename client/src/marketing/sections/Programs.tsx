import { useTranslation } from 'react-i18next';
import { Dumbbell, Flame, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
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
      color: PALETTE.aqua 
    },
    { 
      icon: <Activity className="h-8 w-8" />, 
      title: t('landing:programs.endurance.title'), 
      desc: t('landing:programs.endurance.desc'), 
      color: PALETTE.teal 
    },
  ];

  return (
    <section 
      id="programs" 
      className="py-20 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${PALETTE.deepTeal} 0%, ${PALETTE.teal} 100%)` 
      }}
    >
      {/* Decorative elements */}
      <div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
        style={{ 
          background: `radial-gradient(circle, ${PALETTE.orange} 0%, transparent 70%)`,
          transform: 'translate(30%, -30%)'
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-10"
        style={{ 
          background: `radial-gradient(circle, ${PALETTE.aqua} 0%, transparent 70%)`,
          transform: 'translate(-30%, 30%)'
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('landing:programs.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.aqua }}>
            Programas & Objetivos
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {programs.map((program, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="group relative"
            >
              {/* Card background with gradient border */}
              <div 
                className="absolute inset-0 rounded-2xl p-[2px]"
                style={{
                  background: `linear-gradient(135deg, ${program.color}, ${program.color}80)`
                }}
              >
                <div className="h-full w-full rounded-2xl bg-white/95 backdrop-blur-sm" />
              </div>
              
              {/* Card content */}
              <div className="relative p-8 text-center">
                <div 
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                  style={{ 
                    backgroundColor: program.color,
                    boxShadow: `0 8px 32px ${program.color}40`
                  }}
                >
                  {program.icon}
                </div>
                <h3 
                  className="text-xl font-bold mb-4"
                  style={{ color: PALETTE.deepTeal }}
                >
                  {program.title}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {program.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
