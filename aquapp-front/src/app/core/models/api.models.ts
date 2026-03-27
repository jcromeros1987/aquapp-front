export interface Branch {
  id: number;
  name: string;
}

/** Clasificación en `cat_products`. */
export type CatalogKind = 'PRODUCTOS' | 'INSUMOS' | 'NOMINA' | 'INVENTARIO';

export interface CatProduct {
  id: number;
  name: string;
  catalog_kind: CatalogKind;
}

export interface ProductRow {
  id: number;
  branch_id: number;
  name: string;
  cost: string | number;
  cat_product_id: number;
  cat_product?: CatProduct;
}

/** Existencias por sucursal (`inventories`); tipo en catálogo INVENTARIO. */
export interface InventoryRow {
  id: number;
  /** Clave única generada, ej. INV-B1-00007 */
  clave: string | null;
  branch_id: number;
  cat_product_id: number;
  quantity: number;
  observations: string | null;
  cat_product?: CatProduct;
  /** `withCount` desde API */
  units_con_cliente?: number;
  units_tracked?: number;
}

export type InventoryUnitStatus = 'en_planta' | 'con_cliente' | 'en_disputa' | 'baja';

export interface InventoryUnitRow {
  id: number;
  inventory_id: number;
  codigo: string;
  status: InventoryUnitStatus;
  customer_id: number | null;
  assigned_at: string | null;
  returned_at: string | null;
  observations: string | null;
  customer?: Customer;
  /** Presente en listados de unidades disponibles para venta. */
  inventory?: Pick<InventoryRow, 'id' | 'clave' | 'cat_product'>;
}

/** Ruta de reparto (catálogo `delivery_routes`). */
export interface DeliveryRoute {
  id: number;
  name: string;
  sort_order: number;
}

export interface Customer {
  id: number;
  name: string;
  street: string;
  num_ext: string;
  num_int: string;
  description: string;
  delivery_route_id?: number | null;
  delivery_route?: DeliveryRoute;
}

export interface StaffRoleRef {
  id?: number;
  name: string;
}

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  paternal_name?: string;
  maternal_name?: string;
  birthday?: string;
  roles?: StaffRoleRef[];
  branches?: Branch[];
}

export interface SaleRow {
  id: number;
  user_id: number;
  product_id: number;
  client_id: number | null;
  /** Cliente de purificadora (`customers`), p. ej. entrega de garrafón. */
  customer_id?: number | null;
  inventory_unit_id?: number | null;
  date: string;
  cost: string | number;
  quantity: number;
  total_amount: string | number;
  observations: string | null;
  product?: ProductRow;
  user?: { id: number; name?: string };
  customer?: Customer;
  inventory_unit?: Pick<InventoryUnitRow, 'id' | 'codigo' | 'status'>;
}
