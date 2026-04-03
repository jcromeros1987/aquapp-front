import { SaleRow } from '../models/api.models';

/**
 * Filtra ventas cuya fila de producto pertenece a la sucursal indicada.
 * Útil tras `GET /sale` sin `branch_id` (paridad con la app iOS).
 */
export function filterSalesForBranch(
  sales: SaleRow[],
  branchId: number | null,
): SaleRow[] {
  if (branchId == null) {
    return [];
  }
  return sales.filter((s) => s.product?.branch_id === branchId);
}
