import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { DeliveryRoute } from '../models/api.models';

export interface DeliveryRoutePayload {
  name: string;
  sort_order?: number;
}

@Injectable({ providedIn: 'root' })
export class DeliveryRoutesApiService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<DeliveryRoute[]> {
    return this.http.get<DeliveryRoute[]>(ApiEndpoints.deliveryRoutes.list);
  }

  register(body: DeliveryRoutePayload): Observable<DeliveryRoute> {
    return this.http
      .post<{ data?: DeliveryRoute }>(ApiEndpoints.deliveryRoutes.register, body)
      .pipe(map((r) => r.data as DeliveryRoute));
  }

  update(id: number, body: Partial<DeliveryRoutePayload>): Observable<DeliveryRoute> {
    return this.http
      .put<{ data?: DeliveryRoute }>(ApiEndpoints.deliveryRoutes.one(id), body)
      .pipe(map((r) => r.data as DeliveryRoute));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.deliveryRoutes.one(id));
  }
}
