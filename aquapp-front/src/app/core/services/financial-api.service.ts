import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';

export type BalancePeriod = 'week' | 'month' | 'year';

/** Prorrateo del periodo / garrafón a domicilio vendido (ver `method_note` en API). */
export interface DeliveryJugPerUnitBreakdown {
  merchandise_cost: number;
  reparto: number;
  liners: number;
  tapas: number;
  /** Recibo de luz ÷ garrafones producidos en el periodo; null si no hay volumen de producción. */
  luz: number | null;
  gasolina: number;
  servicios: number;
  total_estimado: number;
}

export interface DeliveryJugUnitPayload {
  domicilio_jugs_sold: number;
  /** Garrafones producidos (ventas agua/garrafón sin envase ni botella) para prorratear luz. */
  produced_jugs_period: number;
  income_domicilio: number;
  merchandise_cost_domicilio: number;
  totals_period: {
    reparto: number;
    liners: number;
    tapas: number;
    luz: number;
    gasolina: number;
    servicios: number;
  };
  /** Suma mercancía domicilio + reparto + insumos (4 rubros) + servicios del periodo. */
  total_cost_period_estimado: number;
  per_jug: DeliveryJugPerUnitBreakdown | null;
  method_note: string;
}

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
  delivery_jug_unit?: DeliveryJugUnitPayload;
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
