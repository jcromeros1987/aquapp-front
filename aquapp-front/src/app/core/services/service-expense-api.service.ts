import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { ServiceExpenseRow, ServiceExpenseTypeRow } from '../models/api.models';

export interface ServiceExpenseCreatePayload {
  branch_id: number;
  service_expense_type_id: number;
  amount: number;
  pay_date: string;
  period_start?: string | null;
  period_end?: string | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ServiceExpenseApiService {
  constructor(private readonly http: HttpClient) {}

  listTypes(): Observable<ServiceExpenseTypeRow[]> {
    return this.http.get<ServiceExpenseTypeRow[]>(ApiEndpoints.serviceExpenseTypes.list);
  }

  list(branchId?: number | null): Observable<ServiceExpenseRow[]> {
    const url =
      branchId != null
        ? `${ApiEndpoints.serviceExpenses.list}?branch_id=${branchId}`
        : ApiEndpoints.serviceExpenses.list;
    return this.http.get<ServiceExpenseRow[]>(url);
  }

  create(body: ServiceExpenseCreatePayload): Observable<ServiceExpenseRow> {
    return this.http.post<ServiceExpenseRow>(ApiEndpoints.serviceExpenses.list, body);
  }

  update(
    id: number,
    body: Partial<
      Pick<
        ServiceExpenseCreatePayload,
        | 'service_expense_type_id'
        | 'amount'
        | 'pay_date'
        | 'period_start'
        | 'period_end'
        | 'notes'
      >
    >,
  ): Observable<ServiceExpenseRow> {
    return this.http.put<ServiceExpenseRow>(ApiEndpoints.serviceExpenses.one(id), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.serviceExpenses.one(id));
  }
}
