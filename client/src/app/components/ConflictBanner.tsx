import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function ConflictBanner() {
  const { t } = useTranslation(['app'])
  const [conflicts] = useState<any[]>([]) // Placeholder for conflicts

  if (conflicts.length === 0) return null

  return (
    <Card className="mx-4 mt-4 border-red-200 bg-red-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-900">
              {t('app:sync.conflicts')}
            </p>
            <p className="text-sm text-red-700">
              {t('app:sync.conflictsMessage')}
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="border-red-300 text-red-700 hover:bg-red-100"
        >
          <X className="h-4 w-4 mr-2" />
          {t('app:sync.resolve')}
        </Button>
      </CardContent>
    </Card>
  )
}
