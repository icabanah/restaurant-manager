// src/app/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para rutas que requieren rol de administrador
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado y es admin
  if (!authService.isAuthenticated() || !authService.isAdmin()) {
    await router.navigate(['/auth/login']);
    return false;
  }

  return true;
};