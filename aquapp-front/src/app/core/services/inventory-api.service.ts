import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { InventoryRow } from '../models/api.models';

export interface InventoryPayload {
  cat_product_id: number;
  quantity: number;
  observations?: string | null;
}

export interface InventoryUpdatePayload {
  quantity: number;
  observations?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId: number): Observable<InventoryRow[]> {
    return this.http
      .get<{ items?: InventoryRow[] }>(ApiEndpoints.branch.inventory(branchId))
      .pipe(map((r) => r.items ?? []));
  }

  create(branchId: number, body: InventoryPayload): Observable<InventoryRow> {
    return this.http
      .post<{ item: InventoryRow }>(ApiEndpoints.branch.inventory(branchId), body)
      .pipe(map((r) => r.item));
  }

  update(
    branchId: number,
    inventoryId: number,
    body: InventoryUpdatePayload,
  ): Observable<InventoryRow> {
    return this.http
      .put<{ item: InventoryRow }>(
        ApiEndpoints.branch.inventoryItem(branchId, inventoryId),
        body,
      )
      .pipe(map((r) => r.item));
  }

  delete(branchId: number, inventoryId: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.branch.inventoryItem(branchId, inventoryId));
  }
}
