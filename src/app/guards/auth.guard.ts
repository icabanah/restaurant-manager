// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Guard para autenticación básica
export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  return true;
};

// Guard para rutas de administrador
export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated() || !authService.isAdmin()) {
    router.navigate(['/user/menu']);
    return false;
  }
  return true;
};

// Guard para rutas públicas (login, registro)
export const publicGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const isAdmin = authService.isAdmin();
    router.navigate([isAdmin ? '/admin/dashboard' : '/user/menu']);
    return false;
  }
  return true;
};

// Guard para rutas de usuario regular
export const userGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (authService.isAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};