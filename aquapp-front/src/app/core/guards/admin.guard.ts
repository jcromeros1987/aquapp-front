import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Solo usuarios con rol `admin` (Spatie). */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    void router.navigate(['/login']);
    return false;
  }
  if (!auth.isAdmin()) {
    void router.navigate(['/dashboard/inicio']);
    return false;
  }
  return true;
};
