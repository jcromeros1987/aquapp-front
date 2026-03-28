import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { Customer } from '../models/api.models';

export interface CustomerPayload {
  name: string;
  street: string;
  num_ext: string;
  num_int: string;
  description: string;
  delivery_route_ids?: number[];
  latitude?: number | null;
  longitude?: number | null;
}

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Customer[]> {
    return this.http
      .get<{ data?: Customer[] }>(ApiEndpoints.customer.list)
      .pipe(map((r) => r.data ?? []));
  }

  register(body: CustomerPayload): Observable<Customer> {
    return this.http
      .post<{ data?: Customer }>(ApiEndpoints.customer.register, body)
      .pipe(map((r) => r.data as Customer));
  }

  update(id: number, body: Partial<CustomerPayload>): Observable<Customer> {
    return this.http
      .put<{ customer?: Customer }>(ApiEndpoints.customer.one(id), body)
      .pipe(map((r) => r.customer as Customer));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.customer.one(id));
  }
}
