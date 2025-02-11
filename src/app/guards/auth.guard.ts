// src/app/guards/auth.guard.ts
import { type CanActivateFn } from '@angular/router';

// Guard para rutas que requieren autenticación (temporalmente deshabilitado)
export const authGuard: CanActivateFn = async () => {
  return true; // Permitir acceso a todas las rutas
};

// Guard para rutas que requieren rol de administrador
export const adminGuard: CanActivateFn = async () => {
  return true; // Permitir acceso a todas las rutas de admin
};

// Guard para rutas públicas (login, registro)
export const publicGuard: CanActivateFn = async () => {
  return true; // Permitir acceso a rutas públicas
};

// Guard para rutas de usuario regular
export const userGuard: CanActivateFn = async () => {
  return true; // Permitir acceso a rutas de usuario
};