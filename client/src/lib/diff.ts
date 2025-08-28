export function shallowDiff(local: any, server: any) {
  const fields = new Set([...Object.keys(local || {}), ...Object.keys(server || {})]);
  const rows: Array<{ field: string; local: any; server: any }> = [];
  for (const f of fields) {
    const lv = local?.[f];
    const sv = server?.[f];
    // ignore metadata fields that constantly change
    if (['_updated_at','updated_at','client_rev','synced_at'].includes(f)) continue;
    if (JSON.stringify(lv) !== JSON.stringify(sv)) rows.push({ field: f, local: lv, server: sv });
  }
  return rows;
}
