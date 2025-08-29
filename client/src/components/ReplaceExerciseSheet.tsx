import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getExerciseById, getCompatibleSubs, type ExerciseMeta, type CompatibilityConstraints } from '@/lib/exercises/catalog';
import { db } from '@/db/gymbud-db';
import { enqueue } from '@/sync/queue';

interface ReplaceExerciseSheetProps {
  sessionExerciseId: string;
  currentExerciseId: string;
  currentExerciseName: string;
  onExerciseReplaced: () => void;
  children: React.ReactNode;
}

export function ReplaceExerciseSheet({
  sessionExerciseId,
  currentExerciseId,
  currentExerciseName,
  onExerciseReplaced,
  children
}: ReplaceExerciseSheetProps) {
  const { t, i18n } = useTranslation('session');
  const currentLang = i18n.language === 'pt-BR' ? 'pt-BR' : 'en';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [compatibleExercises, setCompatibleExercises] = useState<ExerciseMeta[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<ExerciseMeta[]>([]);

  // Load current exercise and compatible alternatives
  useEffect(() => {
    if (!isOpen) return;

    const loadExercises = async () => {
      setIsLoading(true);
      try {
        // Get current exercise details
        const current = await getExerciseById(currentExerciseId);
        if (!current) {
          toast.error(t('swap.error'));
          return;
        }

        // Get compatible exercises using the current exercise as the original
        const constraints: CompatibilityConstraints = {
          excludedExercises: [currentExerciseId]
        };

        const compatible = await getCompatibleSubs(current, currentLang, constraints);
        setCompatibleExercises(compatible);
        setFilteredExercises(compatible);
      } catch (error) {
        console.error('Failed to load exercises:', error);
        toast.error(t('swap.error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadExercises();
  }, [isOpen, currentExerciseId, t, currentLang]);

  // Filter exercises based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(compatibleExercises);
      return;
    }

    const filtered = compatibleExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredExercises(filtered);
  }, [searchTerm, compatibleExercises]);

  const handleExerciseSelect = async (selectedExercise: ExerciseMeta) => {
    try {
      setIsLoading(true);

      // Update session exercise in local DB
      await db.session_exercises.update(sessionExerciseId, {
        exercise_name: selectedExercise.name,
        updated_at: Date.now()
      });

      // Enqueue sync update
      await enqueue({
        entity: 'app2.session_exercises',
        op: 'update',
        payload: {
          id: sessionExerciseId,
          exercise_name: selectedExercise.name,
          updated_at: new Date().toISOString()
        }
      });

      // Show success message
      toast.success(t('swap.appliedToast'));

      // Close modal and notify parent
      setIsOpen(false);
      onExerciseReplaced();

    } catch (error) {
      console.error('Failed to swap exercise:', error);
      toast.error(t('swap.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => setIsOpen(true);

  return (
    <>
      <div onClick={handleOpen}>
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg h-[80vh] bg-slate-900 border border-slate-700 rounded-t-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-semibold text-white">{t('swap.title')}</h2>
                <p className="text-sm text-slate-400">
                  Replace "{currentExerciseName}" with a compatible exercise
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-hidden flex flex-col">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder={t('swap.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              {/* Exercise List */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : filteredExercises.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    {t('swap.noMatches')}
                  </div>
                ) : (
                  filteredExercises.map((exercise) => (
                    <Card
                      key={exercise.id}
                      className="bg-slate-800 border-slate-600 hover:bg-slate-700 cursor-pointer transition-colors"
                      onClick={() => handleExerciseSelect(exercise)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-white text-sm">
                              {exercise.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {exercise.category}
                              </Badge>
                              {exercise.equipment && exercise.equipment.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {exercise.equipment[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
