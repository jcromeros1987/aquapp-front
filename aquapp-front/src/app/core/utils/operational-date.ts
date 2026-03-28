/**
 * Fecha calendario alineada con el API (ventas, entregas rápidas, resumen diario).
 */
export const APP_OPERATIONAL_TIMEZONE = 'America/Mexico_City';

/** YYYY-MM-DD en la zona operativa (no usar toISOString: es UTC y desalinea “hoy”). */
export function todayDateStringOperational(date = new Date()): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_OPERATIONAL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    return date.toISOString().slice(0, 10);
  }
  return `${y}-${m}-${d}`;
}
