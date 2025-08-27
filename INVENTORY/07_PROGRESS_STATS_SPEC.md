# Progress / Stats Page — Specification

## Summary
Replace the "Exercise Library" page with a graphic-rich Progress / Stats page that motivates users via adherence visuals, training volume, intensity, time-in-training, movement trends, and shareable highlights. Route: /app/progress (alias /app/stats). Offline-first; renders from Dexie, refines after pull.

## Routes
- /app/progress (primary)
- /app/stats (redirect/alias)
Nav: Show as "Progress" (EN) / "Progresso" (pt-BR).

## Data Sources
- Server: v_session_metrics (per-session + weekly rollups)
  - Required: session_date, session_id, status, total_sets, total_volume, avg_rpe, week_start, week_end, user_id
  - Optional: total_duration_min (if present)
- Local (Dexie mirrors): sessions, session_exercises, logged_sets for:
  - streaks, weekly session counts, top movements, per-movement working-weight trends
  - earned_badges (local streak awards; see Highlights)

## Charts & Cards (v1)
1. Adherence Heatmap (calendar)
2. Training Days / week (bar)
3. Volume & Sets / week (line+bar)
4. Average RPE / week (line)
5. Minutes Training / week (area/line) — hide if duration missing
6. Top Movements (horizontal bar, last 8 weeks)
7. Weight Progression (per movement) — selector + line series
8. Highlights strip — most recent earned badges (e.g., "7-day streak")

## Social Share — Progress Card
- One-tap "Share" button on /app/progress.
- Renders a branded 1080×1350 card (offscreen) with:
  - User display (name or initials), date range, "Updated {{when}}"
  - Current streak & longest streak
  - Sessions/week, Volume/week, Avg RPE/week (key metrics)
  - Top movement (by set count)
  - Optional latest highlight (e.g., "New badge: 7-day streak")
- Export path:
  - Preferred: `navigator.share({ files: [pngFile], text })` if supported
  - Fallbacks: Clipboard API (copy image), "Download PNG"
- Privacy toggles: hide name (show initials), hide volume/weights, hide highlight
- Offline: always available; reads Dexie + last_pull_at

## Highlights & Badges (Streaks)
- Current streak computed from completed sessions (consecutive days).
- Thresholds: 3, 5, 7, 14, 21, 30, 50, 100
- Award logic (local, idempotent):
  - On compute, if streak >= threshold and badge not earned → add to Dexie `earned_badges` with date_awarded
  - Fire toast + show in Highlights strip
- Sync: local-only for v1 (no DB changes); future server sync optional

## Offline-first
- First paint from Dexie mirrors
- "Updated {{when}}" badge uses last_pull_at
- "Refresh" triggers orchestrated pull

## i18n Keys (EN / pt-BR)
progress.title: Progress / Progresso
progress.updated: Updated {{when}} / Atualizado {{when}}
progress.cards.streak.title: Current streak / Sequência atual
progress.cards.longest_streak: Longest streak / Maior sequência
progress.highlights.title: Highlights / Conquistas
progress.highlights.new_badge: New badge: {{name}} / Nova conquista: {{name}}
progress.share.button: Share / Compartilhar
progress.share.privacy.title: Privacy / Privacidade
progress.share.privacy.hide_name: Hide my name / Ocultar meu nome
progress.share.privacy.hide_weights: Hide weights & volume / Ocultar cargas e volume
progress.share.privacy.hide_highlight: Hide highlight / Ocultar conquista
progress.share.preview.title: Share preview / Prévia para compartilhar
progress.share.saved: Image saved / Imagem salva
progress.share.shared: Shared successfully / Compartilhado com sucesso
progress.share.error: Couldn't generate the image / Não foi possível gerar a imagem
progress.charts.days: Training days / week / Dias de treino / semana
progress.charts.volume_sets: Volume & Sets / Volume e Séries
progress.charts.intensity: Average RPE / RPE médio
progress.charts.minutes: Minutes training / week / Minutos de treino / semana
progress.charts.top_movements: Top Movements / Exercícios mais feitos
progress.charts.weight_progression: Weight Progression / Progressão de carga
progress.select.movement: Select a movement / Selecione um exercício
progress.empty.title: No data yet / Ainda não há dados
progress.empty.cta: Start today's session / Começar o treino de hoje

badges.streak_3: 3-day streak / Sequência de 3 dias
badges.streak_5: 5-day streak / Sequência de 5 dias
badges.streak_7: 7-day streak / Sequência de 7 dias
badges.streak_14: 14-day streak / Sequência de 14 dias
badges.streak_21: 21-day streak / Sequência de 21 dias
badges.streak_30: 30-day streak / Sequência de 30 dias
badges.streak_50: 50-day streak / Sequência de 50 dias
badges.streak_100: 100-day streak / Sequência de 100 dias

## Performance & Index Notes
Use existing indexes:
- idx_sessions_user_updated_at
- idx_session_exercises_session_updated_at
- idx_logged_sets_sx_created_at
No new DB objects required for v1.

## Telemetry
- progress_viewed
- progress_refreshed
- progress_chart_interaction (chart_id, control_id, selection)
- progress_share_opened / progress_share_saved / progress_share_shared
- progress_badge_awarded (label with threshold)

## Verification Checklist
- Route reachable offline; charts hydrate post-pull
- Weekly aggregates match v_session_metrics
- i18n swaps correctly EN↔pt-BR
- Empty state renders with CTA when no sessions
- Share produces crisp PNG; navigator.share path works where supported
- Highlights award exactly once per threshold; persisted locally
