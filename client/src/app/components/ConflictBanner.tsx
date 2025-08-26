import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ConflictData {
  id: string
  entity: string
  localData: any
  serverData: any
}

export function ConflictBanner() {
  const { t } = useTranslation(['app'])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const handleResolve = (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    // TODO: Implement conflict resolution logic
    console.log('Resolving conflict:', conflictId, 'with:', resolution)
    setDismissed(prev => new Set([...prev, conflictId]))
  }

  const handleDismiss = (conflictId: string) => {
    setDismissed(prev => new Set([...prev, conflictId]))
  }

  const conflicts = [] // Placeholder for conflicts
  const visibleConflicts = conflicts.filter(c => !dismissed.has(c.id))

  if (visibleConflicts.length === 0) {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      {visibleConflicts.map(conflict => (
        <Alert key={conflict.id} className="rounded-none border-0 bg-transparent">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between w-full">
            <span className="text-amber-800">
              {t('app:conflicts.detected', { entity: conflict.entity })}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve(conflict.id, 'local')}
                className="h-7 text-xs"
              >
                {t('app:conflicts.keepMine')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve(conflict.id, 'server')}
                className="h-7 text-xs"
              >
                {t('app:conflicts.useServer')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve(conflict.id, 'merge')}
                className="h-7 text-xs"
              >
                {t('app:conflicts.merge')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismiss(conflict.id)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
