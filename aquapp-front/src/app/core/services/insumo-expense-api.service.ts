import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { InsumoExpenseRow } from '../models/api.models';

export interface InsumoExpenseCreatePayload {
  branch_id: number;
  cat_product_id: number;
  amount: number;
  pay_date: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InsumoExpenseApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId?: number | null): Observable<InsumoExpenseRow[]> {
    const url =
      branchId != null
        ? `${ApiEndpoints.insumoExpenses.list}?branch_id=${branchId}`
        : ApiEndpoints.insumoExpenses.list;
    return this.http.get<InsumoExpenseRow[]>(url);
  }

  create(body: InsumoExpenseCreatePayload): Observable<InsumoExpenseRow> {
    return this.http.post<InsumoExpenseRow>(ApiEndpoints.insumoExpenses.list, body);
  }

  update(
    id: number,
    body: Partial<Pick<InsumoExpenseCreatePayload, 'cat_product_id' | 'amount' | 'pay_date' | 'notes'>>,
  ): Observable<InsumoExpenseRow> {
    return this.http.put<InsumoExpenseRow>(ApiEndpoints.insumoExpenses.one(id), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.insumoExpenses.one(id));
  }
}
