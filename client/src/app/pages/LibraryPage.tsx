import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useTranslation } from 'react-i18next'
import { ContentLayout } from '@/app/components/GradientLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Exercise {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  description: string
}

export function LibraryPage() {
  const { t } = useTranslation(['app', 'common'])
  const [, setLocation] = useLocation()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = [
    'all',
    'chest',
    'back',
    'shoulders',
    'arms',
    'legs',
    'core',
    'cardio'
  ]

  useEffect(() => {
    loadExercises()
  }, [])

  useEffect(() => {
    filterExercises()
  }, [exercises, searchQuery, selectedCategory])

  const loadExercises = async () => {
    try {
      // Load exercises (placeholder data)
      setExercises([
        {
          id: '1',
          name: 'Bench Press',
          category: 'chest',
          muscle_groups: ['chest', 'triceps', 'shoulders'],
          equipment: ['barbell', 'bench'],
          difficulty: 'intermediate',
          description: 'Classic compound movement for chest development'
        },
        {
          id: '2',
          name: 'Pull-ups',
          category: 'back',
          muscle_groups: ['lats', 'rhomboids', 'biceps'],
          equipment: ['pull-up bar'],
          difficulty: 'intermediate',
          description: 'Bodyweight exercise for back and arm strength'
        },
        {
          id: '3',
          name: 'Squats',
          category: 'legs',
          muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
          equipment: ['barbell', 'squat rack'],
          difficulty: 'intermediate',
          description: 'Fundamental lower body compound movement'
        },
        {
          id: '4',
          name: 'Push-ups',
          category: 'chest',
          muscle_groups: ['chest', 'triceps', 'shoulders'],
          equipment: [],
          difficulty: 'beginner',
          description: 'Bodyweight chest exercise for all fitness levels'
        },
        {
          id: '5',
          name: 'Deadlift',
          category: 'back',
          muscle_groups: ['hamstrings', 'glutes', 'erector spinae'],
          equipment: ['barbell'],
          difficulty: 'advanced',
          description: 'Full-body compound movement for strength'
        },
        {
          id: '6',
          name: 'Shoulder Press',
          category: 'shoulders',
          muscle_groups: ['deltoids', 'triceps'],
          equipment: ['dumbbells'],
          difficulty: 'intermediate',
          description: 'Overhead pressing movement for shoulder development'
        },
        {
          id: '7',
          name: 'Plank',
          category: 'core',
          muscle_groups: ['abs', 'core'],
          equipment: [],
          difficulty: 'beginner',
          description: 'Isometric core strengthening exercise'
        },
        {
          id: '8',
          name: 'Lunges',
          category: 'legs',
          muscle_groups: ['quadriceps', 'glutes', 'hamstrings'],
          equipment: [],
          difficulty: 'beginner',
          description: 'Unilateral leg exercise for balance and strength'
        }
      ])
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterExercises = () => {
    let filtered = exercises

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(exercise =>
        exercise.name.toLowerCase().includes(query) ||
        exercise.muscle_groups.some(mg => mg.toLowerCase().includes(query)) ||
        exercise.equipment.some(eq => eq.toLowerCase().includes(query))
      )
    }

    setFilteredExercises(filtered)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      default:
        return 'bg-white/20 text-white border-white/30'
    }
  }

  const handleBackToHome = () => {
    setLocation('/')
  }

  const handleExerciseSelect = (exercise: Exercise) => {
    // Placeholder for exercise selection
    console.log('Selected exercise:', exercise)
  }

  if (loading) {
    return (
      <ContentLayout title={t('app:nav.library')}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout
      title={t('app:nav.library')}
      showNavigation={true}
      onBack={handleBackToHome}
      backLabel={t('app:nav.home')}
      nextLabel=""
      onNext={() => {}}
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
          <Input
            type="text"
            placeholder={t('app:library.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white/50"
          />
        </div>

        {/* Category Filter */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
          <h3 className="text-white font-medium mb-3">
            {t('app:library.categories')}
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {t(`app:library.category.${category}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center">
          <p className="text-white/80 text-sm">
            {filteredExercises.length} {t('app:library.exercisesFound')}
          </p>
        </div>

        {/* Exercises List */}
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => handleExerciseSelect(exercise)}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 shadow-xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {exercise.name}
                  </h3>
                  <p className="text-white/70 text-sm mb-2">
                    {exercise.description}
                  </p>
                </div>
                
                <Badge className={getDifficultyColor(exercise.difficulty)}>
                  {t(`app:library.difficulty.${exercise.difficulty}`)}
                </Badge>
              </div>

              {/* Muscle Groups */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {exercise.muscle_groups.map((muscle) => (
                    <Badge
                      key={muscle}
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs"
                    >
                      {t(`app:library.muscle.${muscle}`)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Equipment */}
              {exercise.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {exercise.equipment.map((equipment) => (
                    <Badge
                      key={equipment}
                      variant="outline"
                      className="bg-white/10 text-white/80 border-white/30 text-xs"
                    >
                      {t(`app:library.equipment.${equipment}`)}
                    </Badge>
                  ))}
                </div>
              )}

              {exercise.equipment.length === 0 && (
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-300 border-green-500/30 text-xs"
                >
                  {t('app:library.bodyweight')}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-xl text-center">
            <div className="text-white/70 mb-4">
              {t('app:library.noResults')}
            </div>
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-xl"
            >
              {t('app:library.clearFilters')}
            </Button>
          </div>
        )}
      </div>
    </ContentLayout>
  )
}
