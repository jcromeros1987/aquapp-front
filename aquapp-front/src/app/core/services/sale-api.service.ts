import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { SaleRow } from '../models/api.models';

export interface DailySummaryPoint {
  date: string;
  sales: number;
  expenses: number;
}

export interface DailySummaryResponse {
  range_days: number;
  series: DailySummaryPoint[];
  avg_daily_sales: number;
  avg_daily_expenses: number;
}

export interface SaleCreatePayload {
  product_id: number;
  client_id?: number | null;
  customer_id?: number | null;
  inventory_unit_id?: number | null;
  /** Vendedor a registrar (`sales.user_id`). Si no se envía, la API usa quien está autenticado. */
  seller_user_id?: number | null;
  date: string;
  cost: number;
  quantity: number;
  total_amount: number;
  observations?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SaleApiService {
  constructor(private readonly http: HttpClient) {}

  /** Rango de días para serie diaria (máx. ~6 años, alineado con el backend). */
  dailySummary(days = 14): Observable<DailySummaryResponse> {
    const d = Math.min(2190, Math.max(7, days));
    return this.http.get<DailySummaryResponse>(
      `${ApiEndpoints.sales.dailySummary}?days=${d}`,
    );
  }

  list(branchId?: number | null): Observable<SaleRow[]> {
    const url =
      branchId != null
        ? `${ApiEndpoints.sales.list}?branch_id=${branchId}`
        : ApiEndpoints.sales.list;
    return this.http.get<SaleRow[]>(url);
  }

  create(body: SaleCreatePayload): Observable<SaleRow> {
    return this.http.post<SaleRow>(
      ApiEndpoints.sales.register,
      {
        product_id: body.product_id,
        client_id: body.client_id ?? null,
        customer_id: body.customer_id ?? null,
        inventory_unit_id: body.inventory_unit_id ?? null,
        seller_user_id: body.seller_user_id ?? null,
        date: body.date,
        cost: body.cost,
        quantity: body.quantity,
        total_amount: body.total_amount,
        observations: body.observations ?? null,
      },
    );
  }

  update(id: number, body: Partial<SaleCreatePayload>): Observable<SaleRow> {
    return this.http.put<SaleRow>(ApiEndpoints.sales.one(id), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.sales.one(id));
  }
}
