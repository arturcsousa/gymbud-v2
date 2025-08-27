import { ReactNode } from 'react'
import { COLORS } from '@/app/theme/colors'

interface GradientLayoutProps {
  children: ReactNode
  className?: string
}

export function GradientLayout({ children, className = '' }: GradientLayoutProps) {
  return (
    <div 
      className={`h-full ${className}`}
      style={{ background: COLORS.gradients.primary }}
    >
      <div className="max-w-2xl mx-auto h-full flex flex-col px-2 sm:px-4">
        {children}
      </div>
    </div>
  )
}

interface ContentLayoutProps {
  title?: string
  children: ReactNode
  showNavigation?: boolean
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
}

export function ContentLayout({ 
  title, 
  children, 
  showNavigation = false,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled = false
}: ContentLayoutProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {title && (
        <div className="text-center flex-shrink-0 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {title}
          </h1>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-6 overflow-y-auto mb-6">
        {children}
      </div>

      {showNavigation && (
        <div className="flex justify-between items-center px-4 sm:px-6 py-4 flex-shrink-0 bg-black/10 backdrop-blur-sm rounded-2xl mx-4 sm:mx-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white hover:text-white hover:bg-white/20 rounded-xl h-11 px-4 font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLabel}
          </button>

          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-2 bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] h-11 px-6 text-base font-semibold rounded-xl transform transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {nextLabel}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
