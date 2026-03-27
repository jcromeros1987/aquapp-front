import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { Customer, InventoryUnitRow } from '../models/api.models';

export interface DeliveryBatchToday {
  assigned_at: string | null;
  customer: Customer;
  units: InventoryUnitRow[];
}

export interface DeliveryTodayResponse {
  batches: DeliveryBatchToday[];
}

@Injectable({ providedIn: 'root' })
export class DeliveryApiService {
  constructor(private readonly http: HttpClient) {}

  quickAssign(
    branchId: number,
    body: { customer_id: number; inventory_unit_ids: number[] },
  ): Observable<{ message: string; items: InventoryUnitRow[] }> {
    return this.http.post<{ message: string; items: InventoryUnitRow[] }>(
      ApiEndpoints.branch.deliveryQuickAssign(branchId),
      body,
    );
  }

  today(branchId: number): Observable<DeliveryTodayResponse> {
    return this.http.get<DeliveryTodayResponse>(ApiEndpoints.branch.deliveryToday(branchId));
  }
}
