/** Pivote `branches_users`: rol de personal en esa sucursal. */
export interface BranchUserPivot {
  staff_role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Branch {
  id: number;
  name: string;
  /** GPS sucursal (mapa Zona, purificadora en mapa). */
  latitude?: number | string | null;
  longitude?: number | string | null;
  pivot?: BranchUserPivot;
}

/** Clasificación en `cat_products`. */
export type CatalogKind =
  | 'PRODUCTOS'
  | 'NOMINA'
  | 'INVENTARIO'
  | 'INSUMO_SUELDOS'
  | 'INSUMO_SUMINISTROS_RECIBOS'
  | 'INSUMO_SERVICIOS';

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

/** Ruta de distribución (catálogo `delivery_routes`). */
export interface DeliveryRoute {
  id: number;
  name: string;
  sort_order: number;
}

/** Enlace cliente ↔ ruta (pivote con orden de parada). */
export type CustomerDeliveryRouteLink = DeliveryRoute & {
  pivot?: {
    stop_order: number;
    customer_id: number;
    delivery_route_id: number;
    created_at?: string;
    updated_at?: string;
  };
};

export interface Customer {
  id: number;
  name: string;
  street: string;
  num_ext: string;
  num_int: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Varias rutas posibles (pivote). */
  delivery_routes?: CustomerDeliveryRouteLink[];
}

/** Cliente en el listado de una ruta (incluye pivot.stop_order). */
export type CustomerRouteStop = Customer & {
  pivot?: {
    stop_order: number;
    customer_id: number;
    delivery_route_id: number;
    created_at?: string;
    updated_at?: string;
  };
};

/** Ruta con clientes ya ordenados por parada (API `with-customers`). */
export interface DeliveryRouteWithStops extends DeliveryRoute {
  customers: CustomerRouteStop[];
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
  /** Rutas de distribución asignadas (repartidor u otros). */
  delivery_routes?: DeliveryRoute[];
}

/** Tipo de gasto de servicio / mantenimiento (tabla service_expense_types). */
export interface ServiceExpenseTypeRow {
  id: number;
  name: string;
  sort_order: number;
}

/** Pago por servicio (mantenimiento, limpieza, etc.); suma a gastos en inicio y balance. */
export interface ServiceExpenseRow {
  id: number;
  branch_id: number;
  service_expense_type_id: number;
  amount: string | number;
  pay_date: string;
  /** Cobertura del gasto (p. ej. recibo de luz); prorrateo en balance. */
  period_start?: string | null;
  period_end?: string | null;
  notes: string | null;
  recorded_by_user_id: number | null;
  created_at?: string | null;
  service_expense_type?: Pick<ServiceExpenseTypeRow, 'id' | 'name'>;
  branch?: Pick<Branch, 'id' | 'name'>;
}

/** Pago registrado por rubro de insumo (suma a «gastos» en la gráfica del inicio). */
export interface InsumoExpenseRow {
  id: number;
  branch_id: number;
  cat_product_id: number;
  amount: string | number;
  pay_date: string;
  /** Cobertura del recibo (prorrateo en gráfica/balance si ambas vienen). */
  period_start?: string | null;
  period_end?: string | null;
  notes: string | null;
  recorded_by_user_id: number | null;
  created_at?: string | null;
  cat_product?: Pick<CatProduct, 'id' | 'name' | 'catalog_kind'>;
  branch?: Pick<Branch, 'id' | 'name'>;
}

/** Pago de sueldo a repartidor (suma a «gastos» en la gráfica de inicio). */
export interface PayrollExpenseRow {
  id: number;
  branch_id: number;
  user_id: number;
  amount: string | number;
  pay_date: string;
  pay_schedule_note: string | null;
  notes: string | null;
  recorded_by_user_id: number | null;
  created_at?: string | null;
  user?: Pick<StaffUser, 'id' | 'name' | 'email'>;
  branch?: Pick<Branch, 'id' | 'name'>;
}

export interface SaleRow {
  id: number;
  user_id: number;
  product_id: number;
  client_id: number | null;
  /** Cliente de purificadora (`customers`), p. ej. entrega de garrafón. */
  customer_id?: number | null;
  inventory_unit_id?: number | null;
  /** Hora de alta en servidor (ISO); útil para venta en sucursal. */
  created_at?: string | null;
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
