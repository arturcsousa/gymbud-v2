import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowRight, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getExerciseById, getCompatibleSubs, type ExerciseMeta, type CompatibilityConstraints } from '@/lib/exercises/catalog';
import { db } from '@/db/gymbud-db';
import { enqueueUpdate } from '@/sync/queue';

interface ReplaceExerciseSheetProps {
  sessionExerciseId: string;
  currentExerciseId: string;
  currentExerciseName: string;
  onExerciseReplaced: (newExercise: { id: string; name: string; rest_sec: number }) => void;
  children: React.ReactNode;
}

export function ReplaceExerciseSheet({
  sessionExerciseId,
  currentExerciseId,
  currentExerciseName,
  onExerciseReplaced,
  children
}: ReplaceExerciseSheetProps) {
  const { t } = useTranslation('session');
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [compatibleExercises, setCompatibleExercises] = useState<ExerciseMeta[]>([]);
  const [originalExercise, setOriginalExercise] = useState<ExerciseMeta | null>(null);

  // Load compatible exercises when sheet opens
  useEffect(() => {
    if (isOpen && !originalExercise) {
      loadCompatibleExercises();
    }
  }, [isOpen, currentExerciseId]);

  const loadCompatibleExercises = async () => {
    setIsLoading(true);
    try {
      // Get the original exercise details
      const original = await getExerciseById(currentExerciseId);
      if (!original) {
        toast({
          title: t('swap.error'),
          description: 'Could not load exercise details',
          variant: 'destructive'
        });
        return;
      }

      setOriginalExercise(original);

      // Get user's equipment preferences (could be from profile in the future)
      const constraints: CompatibilityConstraints = {
        maxComplexityDelta: 1,
        // availableEquipment: [], // TODO: Get from user profile
        excludedExercises: [currentExerciseId] // Don't include current exercise
      };

      // Get compatible substitutions
      const compatible = await getCompatibleSubs(original, 'en', constraints);
      setCompatibleExercises(compatible);

    } catch (error) {
      console.error('Failed to load compatible exercises:', error);
      toast({
        title: t('swap.error'),
        description: 'Failed to load exercise alternatives',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExerciseSelect = async (selectedExercise: ExerciseMeta) => {
    try {
      setIsLoading(true);

      // Update the session exercise in Dexie
      await db.session_exercises.update(sessionExerciseId, {
        exercise_id: selectedExercise.id,
        exercise_name: selectedExercise.name,
        updated_at: new Date().toISOString()
      });

      // Enqueue sync update
      await enqueueUpdate('session_exercises', {
        id: sessionExerciseId,
        exercise_id: selectedExercise.id,
        exercise_name: selectedExercise.name,
        updated_at: new Date().toISOString()
      });

      // Log coach audit event
      await enqueueUpdate('coach_audit', {
        id: crypto.randomUUID(),
        user_id: '', // Will be filled by server
        session_id: '', // Will be filled by server  
        tool: 'swap_exercise',
        args_json: JSON.stringify({
          from_id: currentExerciseId,
          to_id: selectedExercise.id,
          session_exercise_id: sessionExerciseId
        }),
        args_hash: '', // Will be calculated by server
        explain: `User swapped ${currentExerciseName} for ${selectedExercise.name}`,
        created_at: new Date().toISOString()
      });

      // Notify parent component
      onExerciseReplaced({
        id: selectedExercise.id,
        name: selectedExercise.name,
        rest_sec: 90 // Default rest time, could be from exercise data
      });

      // Show success toast
      toast({
        title: t('swap.appliedToast'),
        description: `${currentExerciseName} → ${selectedExercise.name}`,
      });

      // Close sheet
      setIsOpen(false);

    } catch (error) {
      console.error('Failed to replace exercise:', error);
      toast({
        title: t('swap.error'),
        description: 'Failed to replace exercise',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter exercises based on search query
  const filteredExercises = compatibleExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.primary_muscles.some(muscle => 
      muscle.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] bg-slate-900 border-slate-700">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-white">{t('swap.title')}</SheetTitle>
          <SheetDescription className="text-slate-400">
            Replace "{currentExerciseName}" with a compatible exercise
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 h-full overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder={t('swap.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
              <span className="ml-2 text-slate-400">Loading alternatives...</span>
            </div>
          )}

          {/* Exercise List */}
          {!isLoading && (
            <div className="flex-1 overflow-y-auto space-y-3">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400">{t('swap.noMatches')}</p>
                </div>
              ) : (
                filteredExercises.map((exercise) => (
                  <Card 
                    key={exercise.id}
                    className="bg-slate-800 border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={() => handleExerciseSelect(exercise)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-white mb-1">
                            {exercise.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-slate-400">
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                              {exercise.category}
                            </Badge>
                            <span>•</span>
                            <span>Level {exercise.complexity_level}</span>
                            {exercise.equipment.length > 0 && (
                              <>
                                <span>•</span>
                                <span>{exercise.equipment.join(', ')}</span>
                              </>
                            )}
                          </div>
                          {exercise.primary_muscles.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {exercise.primary_muscles.slice(0, 3).map((muscle) => (
                                <Badge 
                                  key={muscle}
                                  variant="outline" 
                                  className="text-xs border-teal-600 text-teal-400"
                                >
                                  {muscle}
                                </Badge>
                              ))}
                              {exercise.primary_muscles.length > 3 && (
                                <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                  +{exercise.primary_muscles.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
