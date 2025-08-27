import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { User, LogOut, Settings, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'

interface AppHeaderProps {
  user: any
}

export function AppHeader({ user }: AppHeaderProps) {
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation('/')}
            className="font-semibold"
          >
            <Dumbbell className="h-5 w-5 mr-2" />
            GymBud
          </Button>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="ghost" onClick={() => handleNavigation('/')}>
            {t('app:nav.home')}
          </Button>
          <Button variant="ghost" onClick={() => handleNavigation('/stats')}>
            {t('app:nav.stats')}
          </Button>
          <Button variant="ghost" onClick={() => handleNavigation('/history')}>
            {t('app:nav.history')}
          </Button>
          <Button variant="ghost" onClick={() => handleNavigation('/library')}>
            {t('app:nav.library')}
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4 mr-2" />
                {user?.email?.split('@')[0] || 'User'}
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
    </header>
  )
}
