import { SaleRow } from '../models/api.models';

export type HistoryGranularity = 'day' | 'week' | 'month' | 'year';

export type SaleHistoryKind = 'delivery' | 'branch' | 'dailyRecord';

export interface HistorySaleEntry {
  sale: SaleRow;
  productLabel: string;
  kind: SaleHistoryKind;
  dateYmd: string;
  quantity: number;
  total: number;
}

export interface HistoricoProductRow {
  label: string;
  movementCount: number;
  totalUnits: number;
  total: number;
}

export interface HistoryAggregateBucket {
  id: string;
  title: string;
  subtitle: string | null;
  periodCode: string;
  count: number;
  total: number;
  productRows: HistoricoProductRow[];
  sales: SaleRow[];
}

export function inferSaleHistoryKind(s: SaleRow): SaleHistoryKind {
  const obs = (s.observations ?? '').toLowerCase();
  if (obs.includes('registro_diario')) return 'dailyRecord';
  if (
    obs.includes('venta_sucursal') ||
    obs.includes('venta en sucursal') ||
    obs.includes('tipo=venta_sucursal')
  ) {
    return 'branch';
  }
  if (
    obs.includes('route=') ||
    s.inventory_unit_id != null ||
    s.customer_id != null
  ) {
    return 'delivery';
  }
  return 'branch';
}

function mobileProductFromObservations(observations: string | null | undefined): string | null {
  if (!observations) return null;
  const idx = observations.toLowerCase().indexOf('product=');
  if (idx < 0) return null;
  let rest = observations.slice(idx + 'product='.length).trim();
  const comma = rest.indexOf(',');
  if (comma >= 0) rest = rest.slice(0, comma).trim();
  return rest || null;
}

function registroProductFromObservations(observations: string | null | undefined): string | null {
  if (!observations) return null;
  const markers = [' name:', 'name:', ' nombre:'];
  const lower = observations.toLowerCase();
  for (const m of markers) {
    const idx = lower.indexOf(m.toLowerCase());
    if (idx < 0) continue;
    let rest = observations.slice(idx + m.length).trim();
    const pipe = rest.indexOf('|');
    if (pipe >= 0) rest = rest.slice(0, pipe).trim();
    const nl = rest.indexOf('\n');
    if (nl >= 0) rest = rest.slice(0, nl).trim();
    if (rest) return rest;
  }
  return null;
}

export function historyProductLabel(s: SaleRow, kind: SaleHistoryKind): string {
  const name = s.product?.name?.trim();
  if (name) return name;
  const mobile = mobileProductFromObservations(s.observations);
  if (mobile?.trim()) return mobile.trim();
  if (kind === 'dailyRecord') {
    const fromObs = registroProductFromObservations(s.observations);
    if (fromObs?.trim()) return fromObs.trim();
  }
  return `Producto #${s.product_id}`;
}

export function saleDateYmd(s: SaleRow): string {
  const fromDate = (s.date || '').slice(0, 10);
  if (fromDate.length === 10) return fromDate;
  const fromCreated = (s.created_at || '').slice(0, 10);
  if (fromCreated.length === 10) return fromCreated;
  return '';
}

export function entriesFromSales(sales: SaleRow[]): HistorySaleEntry[] {
  return sales.map((sale) => {
    const kind = inferSaleHistoryKind(sale);
    const dateYmd = saleDateYmd(sale);
    const productLabel = historyProductLabel(sale, kind);
    const qty = Math.max(1, Number(sale.quantity) || 0);
    const total = Number(sale.total_amount);
    return { sale, productLabel, kind, dateYmd, quantity: qty, total };
  });
}

function buildProductRows(entries: HistorySaleEntry[]): HistoricoProductRow[] {
  const map = new Map<string, HistoricoProductRow>();
  for (const e of entries) {
    const prev = map.get(e.productLabel);
    if (prev) {
      prev.movementCount += 1;
      prev.totalUnits += e.quantity;
      prev.total += e.total;
    } else {
      map.set(e.productLabel, {
        label: e.productLabel,
        movementCount: 1,
        totalUnits: e.quantity,
        total: e.total,
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.label.localeCompare(b.label, 'es');
  });
}

function buildBucket(
  idPrefix: string,
  sequence: string,
  title: string,
  subtitle: string | null,
  periodCode: string,
  entries: HistorySaleEntry[],
): HistoryAggregateBucket {
  const sales = entries.map((e) => e.sale);
  const total = entries.reduce((s, e) => s + e.total, 0);
  return {
    id: `${idPrefix}-${sequence}`,
    title,
    subtitle,
    periodCode,
    count: entries.length,
    total,
    productRows: buildProductRows(entries),
    sales,
  };
}

/** Lunes de la semana que contiene ymd (calendario local; misma fecha operativa). */
function mondayKeyContainingYmd(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + delta);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function addDaysYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d + deltaDays);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function shortMx(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
}

function dayTitleLong(ymd: string, isToday: boolean): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const base = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const cap = base.charAt(0).toUpperCase() + base.slice(1);
  return isToday ? `${cap} (hoy)` : cap;
}

export function buildHistoryBuckets(
  sales: SaleRow[],
  granularity: HistoryGranularity,
  todayYmd: string,
): HistoryAggregateBucket[] {
  const entries = entriesFromSales(sales).filter((e) => e.dateYmd.length >= 10);
  const byDay = new Map<string, HistorySaleEntry[]>();
  for (const e of entries) {
    const k = e.dateYmd;
    if (!k || k.length < 10) continue;
    const arr = byDay.get(k) ?? [];
    arr.push(e);
    byDay.set(k, arr);
  }

  switch (granularity) {
    case 'day': {
      const keys = [...byDay.keys()].sort((a, b) => b.localeCompare(a));
      return keys.map((ymd) => {
        const items = byDay.get(ymd) ?? [];
        const isToday = ymd === todayYmd;
        return buildBucket(
          'day',
          ymd,
          dayTitleLong(ymd, isToday),
          null,
          ymd,
          items,
        );
      });
    }
    case 'week': {
      const weekMap = new Map<string, HistorySaleEntry[]>();
      for (const e of entries) {
        const mk = mondayKeyContainingYmd(e.dateYmd);
        const arr = weekMap.get(mk) ?? [];
        arr.push(e);
        weekMap.set(mk, arr);
      }
      const mondays = [...weekMap.keys()].sort((a, b) => b.localeCompare(a));
      return mondays.map((monday) => {
        const items = weekMap.get(monday) ?? [];
        const sunday = addDaysYmd(monday, 6);
        const isCurrent = mondayKeyContainingYmd(todayYmd) === monday;
        const title = isCurrent
          ? `Semana ${shortMx(monday)} – ${shortMx(sunday)} (actual)`
          : `Semana ${shortMx(monday)} – ${shortMx(sunday)}`;
        const subtitle = `Lun ${monday} · Dom ${sunday}`;
        const periodCode = monday;
        return buildBucket('week', monday, title, subtitle, periodCode, items);
      });
    }
    case 'month': {
      const monthMap = new Map<string, HistorySaleEntry[]>();
      for (const e of entries) {
        const ymd = e.dateYmd;
        const key = ymd.slice(0, 7);
        const arr = monthMap.get(key) ?? [];
        arr.push(e);
        monthMap.set(key, arr);
      }
      const keys = [...monthMap.keys()].sort((a, b) => b.localeCompare(a));
      return keys.map((ym) => {
        const items = monthMap.get(ym) ?? [];
        const [yStr, mStr] = ym.split('-');
        const y = Number(yStr);
        const m = Number(mStr);
        const monthStart = new Date(y, m - 1, 1);
        const title = monthStart.toLocaleDateString('es-MX', {
          month: 'long',
          year: 'numeric',
        });
        const capTitle = title.charAt(0).toUpperCase() + title.slice(1);
        const subtitle = `Mes calendario ${m}`;
        return buildBucket('month', ym, capTitle, subtitle, ym, items);
      });
    }
    case 'year': {
      const years = new Set<number>();
      for (const e of entries) {
        const y = Number(e.dateYmd.slice(0, 4));
        if (Number.isFinite(y)) years.add(y);
      }
      return [...years]
        .sort((a, b) => b - a)
        .map((year) => {
          const items = entries.filter(
            (e) => Number(e.dateYmd.slice(0, 4)) === year,
          );
          return buildBucket(
            'year',
            String(year),
            `Año ${year}`,
            null,
            String(year),
            items,
          );
        });
    }
  }
}

export function emptyHistoryMessage(granularity: HistoryGranularity): string {
  switch (granularity) {
    case 'day':
      return 'No hay ventas por día.';
    case 'week':
      return 'No hay ventas por semana.';
    case 'month':
      return 'No hay ventas por mes.';
    case 'year':
      return 'No hay ventas por año.';
  }
}
