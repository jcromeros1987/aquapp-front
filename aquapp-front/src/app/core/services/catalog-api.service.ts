import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { CatalogKind, CatProduct } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  constructor(private readonly http: HttpClient) {}

  list(catalogKind?: CatalogKind): Observable<CatProduct[]> {
    let params = new HttpParams();
    if (catalogKind) {
      params = params.set('catalog_kind', catalogKind);
    }
    return this.http
      .get<{ data?: CatProduct[] }>(ApiEndpoints.catalog.products, { params })
      .pipe(map((r) => r.data ?? []));
  }

  create(name: string, catalogKind: CatalogKind = 'PRODUCTOS'): Observable<CatProduct> {
    return this.http
      .post<{ data: CatProduct }>(ApiEndpoints.catalog.products, {
        name,
        catalog_kind: catalogKind,
      })
      .pipe(map((r) => r.data));
  }

  update(id: number, name: string): Observable<CatProduct> {
    return this.http
      .put<{ data: CatProduct }>(ApiEndpoints.catalog.product(id), { name })
      .pipe(map((r) => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.catalog.product(id));
  }
}
