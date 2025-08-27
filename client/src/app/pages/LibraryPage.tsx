import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Search } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

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

  if (loading) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden pb-20"
        style={{
          background: '#005870', // PALETTE.deepTeal
        }}
      >
        {/* Main teal gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
          }}
        />
        
        {/* Subtle lighter teal curved section with diagonal clip */}
        <div 
          className="absolute top-0 right-0 w-2/3 h-full"
          style={{
            background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
            clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
          }}
        />

        {/* Main content */}
        <div className="min-h-screen grid place-items-center py-4 relative z-10">
          <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="ml-3 text-white text-sm">Loading...</span>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20"
      style={{
        background: '#005870', // PALETTE.deepTeal
      }}
    >
      {/* Main teal gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, #005870 0%, #0C8F93 50%, #18C7B6 100%)`,
        }}
      />
      
      {/* Subtle lighter teal curved section with diagonal clip */}
      <div 
        className="absolute top-0 right-0 w-2/3 h-full"
        style={{
          background: `linear-gradient(135deg, #0C8F93 0%, #14A085 50%, #18C7B6 100%)`,
          clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Main content */}
      <div className="min-h-screen grid place-items-center py-4 relative z-10">
        <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-xl p-8 shadow-2xl ring-1 ring-white/20 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBackToHome}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">
              Exercise Library
            </h1>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60 pl-10 h-10"
            />
          </div>

          {/* Category Filter */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 4).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {filteredExercises.slice(0, 4).map((exercise) => (
              <div
                key={exercise.id}
                className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white">
                      {exercise.name}
                    </h3>
                    <p className="text-white/70 text-xs">
                      {exercise.description}
                    </p>
                  </div>
                  
                  <Badge className={`${getDifficultyColor(exercise.difficulty)} text-xs px-2 py-0`}>
                    {exercise.difficulty.charAt(0).toUpperCase()}
                  </Badge>
                </div>

                {/* Muscle Groups */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {exercise.muscle_groups.slice(0, 2).map((muscle) => (
                    <Badge
                      key={muscle}
                      className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs px-2 py-0"
                    >
                      {muscle}
                    </Badge>
                  ))}
                </div>

                {/* Equipment */}
                {exercise.equipment.length > 0 ? (
                  <Badge className="bg-white/10 text-white/80 border-white/30 text-xs px-2 py-0">
                    {exercise.equipment[0]}
                  </Badge>
                ) : (
                  <Badge className="bg-green-500/10 text-green-300 border-green-500/30 text-xs px-2 py-0">
                    Bodyweight
                  </Badge>
                )}
              </div>
            ))}

            {filteredExercises.length === 0 && (
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-white/70 text-sm mb-3">
                  No exercises found
                </div>
                <Button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="bg-gradient-to-r from-[#00BFA6] to-[#64FFDA] text-slate-900 hover:from-[#00ACC1] hover:to-[#4DD0E1] text-xs px-4 py-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>

          {filteredExercises.length > 4 && (
            <div className="text-center mt-4">
              <p className="text-white/70 text-xs">
                +{filteredExercises.length - 4} more exercises
              </p>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  )
}
