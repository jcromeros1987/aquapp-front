import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiEndpoints } from '../config/api-endpoints';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants/auth.storage';
import { DashboardBranchContextService } from './dashboard-branch-context.service';

export interface LoginResponse {
  success: boolean;
  jwt?: string;
  user?: Record<string, unknown>;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private branchCtx: DashboardBranchContextService,
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.httpClient
      .post<LoginResponse>(ApiEndpoints.auth.login, { email, password })
      .pipe(
        tap((response) => {
          if (response.success && response.jwt) {
            localStorage.setItem(AUTH_TOKEN_KEY, response.jwt);
            if (response.user) {
              localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
            }
          }
        }),
      );
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  /** Usuario guardado en login (persistido en localStorage). */
  getStoredUser(): Record<string, unknown> | null {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  getStoredUserId(): number | null {
    const u = this.getStoredUser();
    const id = u?.['id'];
    if (typeof id === 'number' && !Number.isNaN(id)) return id;
    if (typeof id === 'string' && /^\d+$/.test(id)) return parseInt(id, 10);
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      return Date.now() < exp;
    } catch {
      return false;
    }
  }

  /**
   * Roles del usuario en sesión (login guarda `roles[]` con `name`).
   * Puede ser `web` o `api` según Spatie; comparamos solo por nombre.
   */
  hasRole(roleName: string): boolean {
    const u = this.getStoredUser();
    const roles = u?.['roles'] as Array<{ name?: string }> | undefined;
    if (!Array.isArray(roles)) return false;
    return roles.some((r) => (r?.name || '').toLowerCase() === roleName.toLowerCase());
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  logout(): void {
    const token = this.getToken();
    if (!token) {
      this.clearLocalSession();
      return;
    }
    this.httpClient.post(ApiEndpoints.auth.logout, {}).subscribe({
      next: () => this.clearLocalSession(),
      error: () => this.clearLocalSession(),
    });
  }

  private clearLocalSession(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    this.branchCtx.resetAfterLogout();
    void this.router.navigate(['/login']);
  }
}
