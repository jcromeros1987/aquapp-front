import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants/auth.storage';
import { ApiEndpoints } from '../config/api-endpoints';

/** Solo login/registro de la app; no usar sufijos amplios (ej. /branch/register sí lleva JWT). */
function isAuthPublicUrl(url: string): boolean {
  if (url === ApiEndpoints.auth.login || url === ApiEndpoints.auth.register) {
    return true;
  }
  try {
    const path = new URL(url).pathname.replace(/\/+$/, '') || '/';
    return path === '/api/login' || path === '/api/register';
  } catch {
    return false;
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  if (isAuthPublicUrl(req.url)) {
    return next(req);
  }

  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isAuthPublicUrl(req.url)) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
