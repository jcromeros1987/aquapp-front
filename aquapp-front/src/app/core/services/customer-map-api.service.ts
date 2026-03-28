import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';

export interface CustomerMapPeriod {
  timezone?: string;
  week_start?: string;
  week_end?: string;
  month_start?: string;
  month_end?: string;
  year_start?: string;
  year_end?: string;
}

export interface CustomerMapPin {
  id: number;
  name: string | null;
  latitude: number;
  longitude: number;
  street: string | null;
  num_ext: string | null;
  num_int: string | null;
  garrafones_week: number;
  garrafones_month: number;
  garrafones_year: number;
}

@Injectable({ providedIn: 'root' })
export class CustomerMapApiService {
  constructor(private readonly http: HttpClient) {}

  mapStats(branchId?: number | null): Observable<{
    data: CustomerMapPin[];
    period: CustomerMapPeriod;
  }> {
    let params = new HttpParams();
    if (branchId != null) {
      params = params.set('branch_id', String(branchId));
    }
    return this.http
      .get<{
        status?: string;
        data?: CustomerMapPin[];
        period?: CustomerMapPeriod;
      }>(ApiEndpoints.customer.mapStats, { params })
      .pipe(
        map((r) => ({
          data: r.data ?? [],
          period: r.period ?? {},
        })),
      );
  }
}
