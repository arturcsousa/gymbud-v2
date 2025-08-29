import { useMemo, useState } from "react";
import { useExercise } from "@/data/exercises";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

/**
 * Accessible, localized help ticker for a single exercise.
 * - Shows instructions first (steps), then cues, then contraindications.
 * - Collapsible sections; remembers open/closed locally.
 * - Screen-reader friendly headings and lists.
 */
export default function ExerciseHelpTicker({
  exerciseId,
  className,
}: {
  exerciseId?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useExercise(exerciseId ?? "");
  const [open, setOpen] = useState(true);

  const instructions = useMemo(
    () => (data?.instructions_bulleted ?? []).filter(Boolean),
    [data]
  );
  const cues = useMemo(() => (data?.cues ?? []).filter(Boolean), [data]);
  const contraindications = useMemo(
    () => (data?.contraindications ?? []).filter(Boolean),
    [data]
  );

  if (!exerciseId) return null;

  return (
    <Card
      className={cn(
        "rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-800",
        className
      )}
      aria-live="polite"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 opacity-70" aria-hidden />
          <h2 id="helpTickerHeading" className="text-sm font-medium">
            {t("exercise.help.heading")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls="helpTickerContent"
          onClick={() => setOpen((v) => !v)}
          className="gap-1"
        >
          {open ? (
            <>
              {t("common.hide")} <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              {t("common.show")} <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </Button>
      </div>

      {open && (
        <>
          <Separator />
          <CardContent id="helpTickerContent" className="p-4 space-y-4">
            {/* Instructions */}
            {instructions.length > 0 && (
              <section aria-labelledby="instructionsHeading">
                <h3 id="instructionsHeading" className="text-xs font-semibold mb-2 opacity-80">
                  {t("exercise.help.instructions")}
                </h3>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  {instructions.map((li, idx) => (
                    <li key={idx}>{li}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Cues */}
            {cues.length > 0 && (
              <>
                <Separator className="my-2" />
                <section aria-labelledby="cuesHeading">
                  <h3 id="cuesHeading" className="text-xs font-semibold mb-2 opacity-80">
                    {t("exercise.help.cues")}
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    {cues.map((li, idx) => (
                      <li key={idx}>{li}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* Contraindications */}
            {contraindications.length > 0 && (
              <>
                <Separator className="my-2" />
                <section aria-labelledby="ctHeading">
                  <h3 id="ctHeading" className="text-xs font-semibold mb-2 opacity-80">
                    {t("exercise.help.contraindications")}
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    {contraindications.map((li, idx) => (
                      <li key={idx}>{li}</li>
                    ))}
                  </ul>
                </section>
              </>
            )}

            {/* Loading / error states */}
            {isLoading && instructions.length === 0 && cues.length === 0 && (
              <p className="text-sm opacity-70">{t("common.loading")}</p>
            )}
            {isError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {t("errors.generic")}
              </p>
            )}
          </CardContent>
        </>
      )}
    </Card>
  );
}
