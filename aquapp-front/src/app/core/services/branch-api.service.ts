import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { Branch } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class BranchApiService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<Branch[]> {
    return this.http
      .get<{ branches?: Branch[] }>(ApiEndpoints.branch.list)
      .pipe(map((r) => r.branches ?? []));
  }

  register(name: string): Observable<Branch> {
    return this.http
      .post<{ branch: Branch }>(ApiEndpoints.branch.register, { name })
      .pipe(map((r) => r.branch));
  }

  update(
    id: number,
    body: { name: string; latitude?: number | null; longitude?: number | null },
  ): Observable<Branch> {
    return this.http
      .put<{ branch: Branch }>(ApiEndpoints.branch.update(id), body)
      .pipe(map((r) => r.branch));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.branch.delete(id));
  }
}
