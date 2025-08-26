import { Menu, User, Settings, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { SyncStatus } from '@/app/sync/engine'

interface AppHeaderProps {
  user: any
  syncStatus: SyncStatus
}

export function AppHeader({ user, syncStatus }: AppHeaderProps) {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setLocation('/auth/signin')
  }

  const handleNavigation = (path: string) => {
    setLocation(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo and brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/')}
            className="text-lg font-bold text-primary"
          >
            GymBud
          </Button>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/')}
          >
            {t('app:nav.home')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/history')}
          >
            {t('app:nav.history')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/library')}
          >
            {t('app:nav.library')}
          </Button>
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNavigation('/')}>
                  {t('app:nav.home')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/history')}>
                  {t('app:nav.history')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleNavigation('/library')}>
                  {t('app:nav.library')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('app:nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('app:auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop user menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-32 truncate">
                    {user?.email || t('app:auth.user')}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleNavigation('/settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  {t('app:nav.settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('app:auth.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
