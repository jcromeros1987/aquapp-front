/** Tipos de servicio gestionados en /gastos/suministros (no en /gastos/servicios). */
export const SUMINISTRO_SERVICE_TYPE_NAMES: readonly string[] = ['Luz', 'Limpieza de tanques de agua'];

export function isSuministroServiceTypeName(name: string | null | undefined): boolean {
  const n = (name || '').trim();
  return SUMINISTRO_SERVICE_TYPE_NAMES.includes(n);
}

/** Rubros de insumo que se gestionan en suministros (no en insumos operativos). */
export const SUMINISTRO_INSUMO_NAMES: readonly string[] = ['Agua', 'Luz'];

export function isSuministroInsumoName(name: string | null | undefined): boolean {
  const n = (name || '').trim().toLowerCase();
  return n === 'agua' || n === 'luz';
}

/** Clasificación actual en catálogo; mantiene compatibilidad con datos previos a la migración. */
export function isSuministroInsumoExpenseCat(
  cat: { name?: string | null; catalog_kind?: string | null } | null | undefined,
): boolean {
  if (!cat) return false;
  if (cat.catalog_kind === 'INSUMO_SUMINISTROS_RECIBOS') return true;
  return isSuministroInsumoName(cat.name);
}
