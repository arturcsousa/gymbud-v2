import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Brain, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Settings, 
  CheckCircle2, 
  X,
  Lightbulb,
  TrendingDown,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  useCoach, 
  type CoachRecommendation, 
  type CoachConstraints 
} from '@/hooks/useCoach';

interface CoachPanelProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CoachPanel({ sessionId, isOpen, onClose }: CoachPanelProps) {
  const { t } = useTranslation('coach');
  const [constraints, setConstraints] = useState<CoachConstraints>({});
  const [showFilters, setShowFilters] = useState(false);

  const {
    suggestions,
    isLoading,
    suggest,
    isSuggesting,
    apply,
    isApplying,
    dismiss,
    isDismissing
  } = useCoach(sessionId);

  const handleSuggest = () => {
    suggest({
      session_id: sessionId,
      constraints
    });
  };

  const handleConstraintChange = (key: keyof CoachConstraints, value: any) => {
    setConstraints(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getKindIcon = (kind: CoachRecommendation['kind']) => {
    switch (kind) {
      case 'substitute':
        return <RefreshCw className="h-4 w-4" />;
      case 'tweak_prescription':
        return <Settings className="h-4 w-4" />;
      case 'deload':
        return <TrendingDown className="h-4 w-4" />;
      case 'skip_with_alternative':
        return <ArrowRight className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 overflow-y-auto">
          {/* Explanation */}
          <p className="text-sm text-muted-foreground">
            {t('explain')}
          </p>

          {/* Constraint Filters */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide filters' : 'Show filters'}
            </Button>

            {showFilters && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                {/* Equipment constraints */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('filters.no_equipment')}</Label>
                  <div className="flex flex-wrap gap-2">
                    {['barbell', 'dumbbell', 'bench', 'rack', 'cable'].map(equipment => (
                      <div key={equipment} className="flex items-center space-x-2">
                        <Checkbox
                          id={equipment}
                          checked={constraints.no_equipment?.includes(equipment) || false}
                          onCheckedChange={(checked) => {
                            const current = constraints.no_equipment || [];
                            if (checked) {
                              handleConstraintChange('no_equipment', [...current, equipment]);
                            } else {
                              handleConstraintChange('no_equipment', current.filter(e => e !== equipment));
                            }
                          }}
                        />
                        <Label htmlFor={equipment} className="text-sm capitalize">
                          {equipment}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time limit */}
                <div className="space-y-2">
                  <Label htmlFor="time-limit" className="text-sm font-medium">
                    {t('filters.time')} (minutes)
                  </Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min="5"
                    max="180"
                    value={constraints.time_limit_min || ''}
                    onChange={(e) => handleConstraintChange('time_limit_min', 
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                    placeholder="e.g., 30"
                  />
                </div>

                {/* Fatigue level */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('filters.fatigue')}</Label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(level => (
                      <Button
                        key={level}
                        variant={constraints.fatigue === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleConstraintChange('fatigue', 
                          constraints.fatigue === level ? undefined : level
                        )}
                      >
                        {level === 'low' && <Zap className="h-3 w-3 mr-1" />}
                        {level === 'medium' && <Clock className="h-3 w-3 mr-1" />}
                        {level === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Generate Suggestions Button */}
          <Button 
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="w-full"
          >
            {isSuggesting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                {t('toasts.suggesting')}
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                {t('cta')}
              </>
            )}
          </Button>

          {/* Suggestions List */}
          {isLoading && (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading suggestions...</p>
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">{t('empty')}</p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Suggestions</h3>
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApply={() => apply(suggestion.id)}
                  onDismiss={() => dismiss(suggestion.id)}
                  isApplying={isApplying}
                  isDismissing={isDismissing}
                  getKindIcon={getKindIcon}
                  getConfidenceColor={getConfidenceColor}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export { CoachPanel };

interface SuggestionCardProps {
  suggestion: CoachRecommendation;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
  isDismissing: boolean;
  getKindIcon: (kind: CoachRecommendation['kind']) => React.ReactNode;
  getConfidenceColor: (confidence: number) => string;
}

function SuggestionCard({ 
  suggestion, 
  onApply, 
  onDismiss, 
  isApplying, 
  isDismissing,
  getKindIcon,
  getConfidenceColor
}: SuggestionCardProps) {
  const { t } = useTranslation('coach');

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              {getKindIcon(suggestion.kind)}
              <Badge variant="secondary" className="text-xs">
                {t(`kinds.${suggestion.kind}`)}
              </Badge>
              <Badge 
                variant="secondary" 
                className={`text-xs ${getConfidenceColor(suggestion.delta_json.confidence)}`}
              >
                {Math.round(suggestion.delta_json.confidence * 100)}% {t('labels.confidence')}
              </Badge>
            </div>

            {/* Rationale */}
            <p className="text-sm text-muted-foreground">
              {suggestion.delta_json.rationale}
            </p>

            {/* Change preview */}
            {suggestion.kind === 'substitute' && (
              <div className="text-xs bg-muted p-2 rounded">
                <span className="line-through opacity-60">
                  {suggestion.delta_json.from_exercise_id}
                </span>
                {' → '}
                <span className="font-medium">
                  {suggestion.delta_json.to_exercise_id}
                </span>
              </div>
            )}

            {suggestion.delta_json.fields && (
              <div className="text-xs bg-muted p-2 rounded space-y-1">
                {Object.entries(suggestion.delta_json.fields).map(([field, value]) => (
                  <div key={field}>
                    <span className="font-medium">{field}:</span> {value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={onApply}
              disabled={isApplying || isDismissing}
            >
              {isApplying ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              <span className="sr-only">{t('actions.accept')}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              disabled={isApplying || isDismissing}
            >
              {isDismissing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className="sr-only">{t('actions.dismiss')}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
