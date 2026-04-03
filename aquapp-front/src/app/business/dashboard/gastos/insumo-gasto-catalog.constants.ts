/** Rubros de `cat_products` que aplican a gastos por insumo (API insumo-expenses). */
export const INSUMO_GASTO_KINDS = [
  'INSUMO_SUMINISTROS_RECIBOS',
  'INSUMO_SUELDOS',
  'INSUMO_SERVICIOS',
] as const;

export type InsumoGastoCatalogKind = (typeof INSUMO_GASTO_KINDS)[number];

/** Clasificación que ve el usuario (valores API: INSUMO_*). */
export const INSUMO_GASTO_KIND_LABELS: Record<InsumoGastoCatalogKind, string> = {
  INSUMO_SUMINISTROS_RECIBOS: 'Suministros y recibos',
  INSUMO_SUELDOS: 'Insumos',
  INSUMO_SERVICIOS: 'Servicios',
};

export function isInsumoGastoCatalogKind(k: string): k is InsumoGastoCatalogKind {
  return (INSUMO_GASTO_KINDS as readonly string[]).includes(k);
}
