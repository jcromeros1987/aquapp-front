import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { StaffUser } from '../models/api.models';

export type StaffRole = 'manager' | 'assistant' | 'delivery';

export interface StaffRegisterPayload {
  name: string;
  email: string;
  password: string;
  paternal_name: string;
  maternal_name: string;
  birthday: string;
  role: StaffRole;
  branch_id: number;
  /** Rutas de distribución donde reparte (recomendado si rol es Reparto). */
  delivery_route_ids?: number[];
}

@Injectable({ providedIn: 'root' })
export class StaffApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId?: number | null): Observable<StaffUser[]> {
    const url =
      branchId != null
        ? `${ApiEndpoints.staff.list}?branch_id=${branchId}`
        : ApiEndpoints.staff.list;
    return this.http.get<{ data?: StaffUser[] }>(url).pipe(map((r) => r.data ?? []));
  }

  register(body: StaffRegisterPayload): Observable<StaffUser> {
    return this.http
      .post<{ data?: StaffUser }>(ApiEndpoints.staff.register, body)
      .pipe(map((r) => r.data as StaffUser));
  }

  update(
    id: number,
    body: {
      name?: string;
      email?: string;
      password?: string;
      delivery_route_ids?: number[];
    },
  ): Observable<StaffUser> {
    return this.http
      .put<{ data?: StaffUser }>(ApiEndpoints.staff.one(id), body)
      .pipe(map((r) => r.data as StaffUser));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.staff.one(id));
  }
}
