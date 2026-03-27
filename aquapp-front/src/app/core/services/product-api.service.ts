import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { ProductRow } from '../models/api.models';

export interface ProductPayload {
  name: string;
  cost: number;
  cat_product_id: number;
}

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  constructor(private readonly http: HttpClient) {}

  list(branchId: number): Observable<ProductRow[]> {
    return this.http
      .get<{ products?: ProductRow[] }>(ApiEndpoints.branch.products(branchId))
      .pipe(map((r) => r.products ?? []));
  }

  create(branchId: number, body: ProductPayload): Observable<ProductRow> {
    return this.http
      .post<{ product: ProductRow }>(ApiEndpoints.branch.products(branchId), body)
      .pipe(map((r) => r.product));
  }

  update(
    branchId: number,
    productId: number,
    body: ProductPayload,
  ): Observable<ProductRow> {
    return this.http
      .put<{ product: ProductRow }>(
        ApiEndpoints.branch.product(branchId, productId),
        body,
      )
      .pipe(map((r) => r.product));
  }

  delete(branchId: number, productId: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.branch.product(branchId, productId));
  }
}
