import React from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { Home, Play, History, BookOpen, Settings } from 'lucide-react';

interface BottomNavProps {
  className?: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ className = '' }) => {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation(['app']);

  const navItems = [
    {
      id: 'home',
      label: t('app:nav.home'),
      icon: Home,
      path: '/',
    },
    {
      id: 'session',
      label: t('app:nav.session'),
      icon: Play,
      path: '/session/new',
    },
    {
      id: 'history',
      label: t('app:nav.history'),
      icon: History,
      path: '/history',
    },
    {
      id: 'library',
      label: t('app:nav.library'),
      icon: BookOpen,
      path: '/library',
    },
    {
      id: 'settings',
      label: t('app:nav.settings'),
      icon: Settings,
      path: '/settings',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location === '/';
    }
    return location.startsWith(path);
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-xl border-t border-white/20 rounded-t-2xl shadow-xl">
          <div className="flex justify-around items-center py-2 px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <button
                  key={item.id}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 min-w-0 flex-1 ${
                    active
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${active ? 'text-slate-900' : ''}`} />
                  <span className={`text-xs font-medium truncate ${active ? 'text-slate-900' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
