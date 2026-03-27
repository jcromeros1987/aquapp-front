import { environment } from '../../../environments/environment';

const base = environment.apiUrl;

/**
 * Rutas alineadas con `aquapp-api/app/routes/api.php` (prefijo /api).
 */
export const ApiEndpoints = {
  auth: {
    login: `${base}/login`,
    register: `${base}/register`,
    logout: `${base}/logout`,
    deleteUser: (id: number) => `${base}/user/${id}`,
    updatePassword: (id: number) => `${base}/user/${id}/password`,
  },
  branch: {
    register: `${base}/branch/register`,
    list: `${base}/branch/list`,
    delete: (id: number) => `${base}/branch/${id}`,
    update: (id: number) => `${base}/branch/${id}`,
    sales: (branchId: number) => `${base}/branches/${branchId}/sales`,
    salesByOwner: (ownerId: number) => `${base}/sales-by-owner/${ownerId}`,
    products: (branchId: number) => `${base}/branch/${branchId}/products`,
    product: (branchId: number, productId: number) =>
      `${base}/branch/${branchId}/products/${productId}`,
    inventoryUnitsAvailable: (branchId: number) =>
      `${base}/branch/${branchId}/inventory-units/available`,
    deliveryQuickAssign: (branchId: number) =>
      `${base}/branch/${branchId}/delivery/quick-assign`,
    deliveryToday: (branchId: number) => `${base}/branch/${branchId}/delivery/today`,
    inventory: (branchId: number) => `${base}/branch/${branchId}/inventory`,
    inventoryItem: (branchId: number, inventoryId: number) =>
      `${base}/branch/${branchId}/inventory/${inventoryId}`,
    inventoryUnits: (branchId: number, inventoryId: number) =>
      `${base}/branch/${branchId}/inventory/${inventoryId}/units`,
    inventoryUnitsBulk: (branchId: number, inventoryId: number) =>
      `${base}/branch/${branchId}/inventory/${inventoryId}/units/bulk`,
    inventoryUnit: (branchId: number, inventoryId: number, unitId: number) =>
      `${base}/branch/${branchId}/inventory/${inventoryId}/units/${unitId}`,
  },
  catalog: {
    products: `${base}/catalog/products`,
    product: (id: number) => `${base}/catalog/products/${id}`,
  },
  staff: {
    list: `${base}/staff`,
    register: `${base}/staff/register`,
    one: (id: number) => `${base}/staff/${id}`,
  },
  sales: {
    list: `${base}/sale`,
    dailySummary: `${base}/sale/daily-summary`,
    register: `${base}/sale/register`,
    one: (id: number) => `${base}/sale/${id}`,
    all: `${base}/sales`,
    byUser: `${base}/sales/user`,
    byWeek: (branchId: number) => `${base}/sales/${branchId}/week`,
    byMonth: (branchId: number) => `${base}/sales/${branchId}/month`,
    byYear: (branchId: number) => `${base}/sales/${branchId}/year`,
  },
  customer: {
    list: `${base}/customer`,
    register: `${base}/customer/register`,
    one: (id: number) => `${base}/customer/${id}`,
  },
  deliveryRoutes: {
    list: `${base}/cat-delivery-routes`,
    register: `${base}/cat-delivery-routes/register`,
    one: (id: number) => `${base}/cat-delivery-routes/${id}`,
  },
  cat: {
    countries: `${base}/cat-countries`,
    cities: `${base}/cat-cities`,
    towns: `${base}/cat-towns`,
    zipCodes: `${base}/cat-zip-codes`,
    memberships: `${base}/cat-memberships`,
    membershipsUsers: `${base}/memberships-users`,
  },
} as const;
