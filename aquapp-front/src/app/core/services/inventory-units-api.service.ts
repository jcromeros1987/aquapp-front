import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { InventoryUnitRow, InventoryUnitStatus } from '../models/api.models';

export interface InventoryUnitUpdatePayload {
  status: InventoryUnitStatus;
  customer_id?: number | null;
  observations?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryUnitsApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId: number, inventoryId: number): Observable<InventoryUnitRow[]> {
    return this.http
      .get<{ items?: InventoryUnitRow[] }>(ApiEndpoints.branch.inventoryUnits(branchId, inventoryId))
      .pipe(map((r) => r.items ?? []));
  }

  /** Unidades en estado `en_planta` en cualquier renglón de inventario de la sucursal. */
  listAvailableForBranch(branchId: number): Observable<InventoryUnitRow[]> {
    return this.http
      .get<{ items?: InventoryUnitRow[] }>(ApiEndpoints.branch.inventoryUnitsAvailable(branchId))
      .pipe(map((r) => r.items ?? []));
  }

  create(
    branchId: number,
    inventoryId: number,
    body: { codigo?: string; observations?: string | null },
  ): Observable<InventoryUnitRow> {
    return this.http
      .post<{ item: InventoryUnitRow }>(ApiEndpoints.branch.inventoryUnits(branchId, inventoryId), body)
      .pipe(map((r) => r.item));
  }

  bulk(branchId: number, inventoryId: number, count: number): Observable<void> {
    return this.http.post<void>(ApiEndpoints.branch.inventoryUnitsBulk(branchId, inventoryId), { count });
  }

  update(
    branchId: number,
    inventoryId: number,
    unitId: number,
    body: InventoryUnitUpdatePayload,
  ): Observable<InventoryUnitRow> {
    return this.http
      .put<{ item: InventoryUnitRow }>(
        ApiEndpoints.branch.inventoryUnit(branchId, inventoryId, unitId),
        body,
      )
      .pipe(map((r) => r.item));
  }

  delete(branchId: number, inventoryId: number, unitId: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.branch.inventoryUnit(branchId, inventoryId, unitId));
  }
}
