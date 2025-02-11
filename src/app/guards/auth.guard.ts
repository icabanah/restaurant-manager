// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Función auxiliar para esperar la carga de datos del usuario
const waitForUserData = (authService: AuthService): Promise<void> => {
  return new Promise((resolve) => {
    // Si ya hay un usuario, resolvemos inmediatamente
    if (authService.currentUser() !== null) {
      resolve();
      return;
    }

    // Verificar periódicamente si el usuario ya está cargado
    const checkUser = setInterval(() => {
      if (authService.currentUser() !== null) {
        clearInterval(checkUser);
        resolve();
      }
    }, 100);

    // Timeout de seguridad después de 5 segundos
    setTimeout(() => {
      clearInterval(checkUser);
      resolve();
    }, 5000);
  });
};

// Guard para rutas que requieren autenticación
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que los datos del usuario estén disponibles
  await waitForUserData(authService);

  if (!authService.isAuthenticated()) {
    await router.navigate(['/auth/login']);
    return false;
  }
  return true;
};

// Guard para rutas que requieren rol de administrador
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que los datos del usuario estén disponibles
  await waitForUserData(authService);

  if (!authService.isAdmin()) {
    await router.navigate(['/user/menu']);
    return false;
  }
  return true;
};

// Guard para rutas públicas (login, registro)
export const publicGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que los datos del usuario estén disponibles
  await waitForUserData(authService);

  if (authService.isAuthenticated()) {
    // Si el usuario ya está autenticado, redirigir según su rol
    const isAdmin = authService.isAdmin();
    await router.navigate([isAdmin ? '/admin/dashboard' : '/user/menu']);
    return false;
  }
  return true;
};

// Guard para rutas de usuario regular
export const userGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar a que los datos del usuario estén disponibles
  await waitForUserData(authService);

  if (authService.isAdmin()) {
    await router.navigate(['/admin/dashboard']);
    return false;
  }
  return true;
};