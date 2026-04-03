import { DailySummaryPoint } from '../../../core/services/sale-api.service';

export type HomeChartGranularity = 'day' | 'week' | 'month' | 'year';

export interface HomeChartPoint {
  sortKey: string;
  label: string;
  sales: number;
  expenses: number;
}

export function daysToFetchForGranularity(g: HomeChartGranularity): number {
  switch (g) {
    case 'day':
      return 14;
    case 'week':
      return 84;
    case 'month':
      return 366;
    case 'year':
      return 1825;
    default:
      return 14;
  }
}

function parseLocalYmd(iso: string): Date {
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d);
}

function formatDdMm(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function weekStartKey(iso: string): string {
  const dt = parseLocalYmd(iso);
  const offset = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - offset);
  const y = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, '0');
  const da = String(dt.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

function ymKey(iso: string): string {
  return iso.slice(0, 7);
}

const MONTH_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map((x) => parseInt(x, 10));
  return `${MONTH_SHORT[m - 1]} '${String(y).slice(2)}`;
}

export function buildHomeChartSeries(
  series: DailySummaryPoint[],
  g: HomeChartGranularity,
): HomeChartPoint[] {
  if (g === 'day') {
    return series.map((row) => ({
      sortKey: row.date,
      label: formatDdMm(row.date),
      sales: row.sales,
      expenses: row.expenses,
    }));
  }

  const map = new Map<string, { sales: number; expenses: number }>();
  for (const row of series) {
    let key: string;
    switch (g) {
      case 'week':
        key = weekStartKey(row.date);
        break;
      case 'month':
        key = ymKey(row.date);
        break;
      case 'year':
        key = row.date.slice(0, 4);
        break;
      default:
        key = row.date;
    }
    const cur = map.get(key) ?? { sales: 0, expenses: 0 };
    cur.sales += row.sales;
    cur.expenses += row.expenses;
    map.set(key, cur);
  }

  const keys = [...map.keys()].sort();
  return keys.map((sortKey) => {
    const bucket = map.get(sortKey)!;
    let label: string;
    if (g === 'week') {
      label = formatDdMm(sortKey);
    } else if (g === 'month') {
      label = monthLabel(sortKey);
    } else {
      label = sortKey;
    }
    return {
      sortKey,
      label,
      sales: Math.round(bucket.sales * 100) / 100,
      expenses: Math.round(bucket.expenses * 100) / 100,
    };
  });
}

export function bucketAverages(points: HomeChartPoint[]): {
  avgSales: number;
  avgExp: number;
} {
  const n = points.length;
  if (n === 0) {
    return { avgSales: 0, avgExp: 0 };
  }
  const sumS = points.reduce((a, p) => a + p.sales, 0);
  const sumE = points.reduce((a, p) => a + p.expenses, 0);
  return {
    avgSales: Math.round((sumS / n) * 100) / 100,
    avgExp: Math.round((sumE / n) * 100) / 100,
  };
}
