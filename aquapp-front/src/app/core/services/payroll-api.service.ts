import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { PayrollExpenseRow } from '../models/api.models';

export interface PayrollExpenseCreatePayload {
  branch_id: number;
  user_id: number;
  amount: number;
  pay_date: string;
  pay_schedule_note?: string | null;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PayrollApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId?: number | null): Observable<PayrollExpenseRow[]> {
    const url =
      branchId != null
        ? `${ApiEndpoints.payrollExpenses.list}?branch_id=${branchId}`
        : ApiEndpoints.payrollExpenses.list;
    return this.http.get<PayrollExpenseRow[]>(url);
  }

  create(body: PayrollExpenseCreatePayload): Observable<PayrollExpenseRow> {
    return this.http.post<PayrollExpenseRow>(ApiEndpoints.payrollExpenses.list, body);
  }

  update(
    id: number,
    body: Partial<Omit<PayrollExpenseCreatePayload, 'branch_id'>>,
  ): Observable<PayrollExpenseRow> {
    return this.http.put<PayrollExpenseRow>(ApiEndpoints.payrollExpenses.one(id), body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.payrollExpenses.one(id));
  }
}
