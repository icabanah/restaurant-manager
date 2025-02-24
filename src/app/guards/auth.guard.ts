// auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no está autenticado, redirigir al login
  if (!authService.isAuthenticated()) {
    await router.navigate(['/auth/login']);
    return false;
  }
  
  return true; // Usuario autenticado
};

export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si no es admin, redirigir al menú de usuario
  if (!authService.isAdmin()) {
    await router.navigate(['/user/menu']);
    return false;
  }
  
  return true; // Usuario es admin
};

export const publicGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado, redirigir según rol
  if (authService.isAuthenticated()) {
    if (authService.isAdmin()) {
      await router.navigate(['/admin/dashboard']);
    } else {
      await router.navigate(['/user/menu']);
    }
    return false;
  }
  
  return true; // Permitir acceso a rutas públicas
};

export const userGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si es admin, redirigir al dashboard
  if (authService.isAdmin()) {
    await router.navigate(['/admin/dashboard']);
    return false;
  }
  
  return true; // Usuario normal
};