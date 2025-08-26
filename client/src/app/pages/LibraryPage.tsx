import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Dumbbell, Filter, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Exercise {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  equipment: string[]
  description: string
  instructions: string[]
}

export function LibraryPage() {
  const { t } = useTranslation(['app', 'library'])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock exercise data - in real app this would come from Supabase
  const mockExercises: Exercise[] = [
    {
      id: '1',
      name: 'Barbell Squat',
      category: 'Compound',
      muscle_groups: ['Quadriceps', 'Glutes', 'Hamstrings'],
      equipment: ['Barbell', 'Squat Rack'],
      description: 'A fundamental lower body compound movement',
      instructions: [
        'Set up barbell in squat rack at shoulder height',
        'Position barbell on upper back/traps',
        'Step back and position feet shoulder-width apart',
        'Lower by pushing hips back and bending knees',
        'Descend until thighs are parallel to floor',
        'Drive through heels to return to starting position'
      ]
    },
    {
      id: '2',
      name: 'Bench Press',
      category: 'Compound',
      muscle_groups: ['Chest', 'Shoulders', 'Triceps'],
      equipment: ['Barbell', 'Bench'],
      description: 'Primary upper body pushing movement',
      instructions: [
        'Lie on bench with eyes under the bar',
        'Grip bar slightly wider than shoulder width',
        'Retract shoulder blades and arch back slightly',
        'Lower bar to chest with control',
        'Press bar up in straight line over chest',
        'Lock out arms at top'
      ]
    },
    {
      id: '3',
      name: 'Deadlift',
      category: 'Compound',
      muscle_groups: ['Hamstrings', 'Glutes', 'Back', 'Traps'],
      equipment: ['Barbell'],
      description: 'Full body pulling movement',
      instructions: [
        'Stand with feet hip-width apart, bar over mid-foot',
        'Bend at hips and knees to grip bar',
        'Keep chest up and back straight',
        'Drive through heels and extend hips',
        'Stand tall with shoulders back',
        'Lower bar with control'
      ]
    },
    {
      id: '4',
      name: 'Pull-ups',
      category: 'Compound',
      muscle_groups: ['Lats', 'Rhomboids', 'Biceps'],
      equipment: ['Pull-up Bar'],
      description: 'Bodyweight upper body pulling exercise',
      instructions: [
        'Hang from bar with overhand grip',
        'Hands slightly wider than shoulders',
        'Pull body up until chin clears bar',
        'Lower with control to full arm extension',
        'Maintain straight body line throughout'
      ]
    },
    {
      id: '5',
      name: 'Dumbbell Bicep Curls',
      category: 'Isolation',
      muscle_groups: ['Biceps'],
      equipment: ['Dumbbells'],
      description: 'Isolated bicep strengthening exercise',
      instructions: [
        'Stand with dumbbells at sides',
        'Keep elbows close to body',
        'Curl weights up by flexing biceps',
        'Squeeze at top of movement',
        'Lower with control'
      ]
    }
  ]

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setExercises(mockExercises)
      setLoading(false)
    }, 500)
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchQuery, categoryFilter])

  const filterExercises = () => {
    let filtered = exercises

    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === categoryFilter)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle_groups.some(muscle => muscle.toLowerCase().includes(query)) ||
        exercise.equipment.some(eq => eq.toLowerCase().includes(query))
      )
    }

    setFilteredExercises(filtered)
  }

  const categories = ['all', ...Array.from(new Set(exercises.map(ex => ex.category)))]

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          {t('library:title')}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('library:subtitle')}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('library:search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={categoryFilter === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategoryFilter(category)}
                >
                  {category === 'all' 
                    ? t('library:filters.all')
                    : t(`library:categories.${category.toLowerCase()}`)
                  }
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-12">
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {exercises.length === 0 
                    ? t('library:empty.title')
                    : t('library:noResults.title')
                  }
                </h3>
                <p className="text-muted-foreground">
                  {exercises.length === 0 
                    ? t('library:empty.message')
                    : t('library:noResults.message')
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{exercise.category}</Badge>
                  {exercise.muscle_groups.slice(0, 2).map(muscle => (
                    <Badge key={muscle} variant="outline" className="text-xs">
                      {muscle}
                    </Badge>
                  ))}
                  {exercise.muscle_groups.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{exercise.muscle_groups.length - 2}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {exercise.description}
                </p>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t('library:exercise.equipment')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exercise.equipment.map(eq => (
                        <Badge key={eq} variant="outline" className="text-xs">
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {t('library:exercise.muscles')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {exercise.muscle_groups.join(', ')}
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full mt-4">
                  {t('library:exercise.viewDetails')}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
