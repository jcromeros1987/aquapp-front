import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';

export type BalancePeriod = 'week' | 'month' | 'year';

export interface FinancialBalanceResponse {
  period: BalancePeriod;
  label: string;
  range_start: string | null;
  range_end: string | null;
  branch_id: number | null;
  income: number;
  expenses_merchandise: number;
  expenses_payroll: number;
  expenses_insumos: number;
  expenses_services: number;
  expenses_total: number;
  balance: number;
}

@Injectable({ providedIn: 'root' })
export class FinancialApiService {
  constructor(private readonly http: HttpClient) {}

  balance(period: BalancePeriod, branchId?: number | null): Observable<FinancialBalanceResponse> {
    let params = new HttpParams().set('period', period);
    if (branchId != null) {
      params = params.set('branch_id', String(branchId));
    }
    return this.http.get<FinancialBalanceResponse>(ApiEndpoints.financial.balance, { params });
  }
}
