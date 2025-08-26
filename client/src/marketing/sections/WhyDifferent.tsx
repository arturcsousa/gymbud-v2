import { useTranslation } from 'react-i18next';
import { CheckCircle, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { PALETTE } from '../theme';

export default function WhyDifferent() {
  const { t } = useTranslation(['landing', 'common']);

  return (
    <section
      id="why"
      className="py-20"
      style={{ background: PALETTE.orange }}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
            {t('landing:different.title')}
          </h2>
          <h3 className="text-2xl lg:text-3xl font-bold" style={{ color: PALETTE.deepTeal }}>
            O que nos Torna Diferentes
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Build Muscle Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: PALETTE.orange }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Build Muscle</h3>
            <p className="text-sm text-white/90 mb-4">Construir Músculo</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Planos de condicionamento físico personalizados
            </p>
          </motion.div>

          {/* Lose Weight Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: PALETTE.deepTeal }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Activity className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Lose Weight</h3>
            <p className="text-sm text-white/90 mb-4">Perder Peso</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Easy de condicionamento físico com recursos avançados
            </p>
          </motion.div>

          {/* Improve Endurance Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-8 text-center"
            style={{ backgroundColor: PALETTE.aqua }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              >
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Improve Endurance</h3>
            <p className="text-sm text-white/90 mb-4">Melhorar Resistência</p>
            <p className="text-white/80 text-sm leading-relaxed">
              Comece com os treinos
            </p>
          </motion.div>
        </div>

        {/* Bottom section with app features */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div 
            className="rounded-2xl p-8"
            style={{ backgroundColor: PALETTE.deepTeal }}
          >
            <h4 className="text-xl font-bold text-white mb-4">Easy to use app</h4>
            <p className="text-white/90 mb-2">w&countri funções</p>
            <p className="text-white/80 text-sm">
              Aplicativo fácil de usar com recursos avançados
            </p>
          </div>
          
          <div 
            className="rounded-2xl p-8"
            style={{ backgroundColor: PALETTE.aqua }}
          >
            <h4 className="text-xl font-bold text-white mb-4">Aplicativo fácil de usar</h4>
            <p className="text-white/90 mb-2">com recursos avançados</p>
            <p className="text-white/80 text-sm">
              Comece com os treinos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
