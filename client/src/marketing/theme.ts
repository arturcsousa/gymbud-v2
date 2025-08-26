export const PALETTE = {
  deepTeal: '#005870',
  teal: '#0C8F93',
  aqua: '#18C7B6',
  orange: '#FF9F1C',
  // (paleOrange removed)
};

export const APP_URL =
  (import.meta as any).env?.VITE_APP_URL || 'https://app.gymbud.ai';

export const ctaHref = (source: string, extra: Record<string, string> = {}) => {
  const qs = new URLSearchParams({
    utm_source: 'marketing',
    utm_campaign: 'landing',
    utm_medium: source,
    ...extra,
  });
  return `${APP_URL}/?${qs}`;
};
