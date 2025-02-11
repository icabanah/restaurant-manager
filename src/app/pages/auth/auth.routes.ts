// pages/auth/auth.routes.ts
import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component')
      .then(m => m.LoginComponent),
    title: 'Iniciar Sesión'
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component')
      .then(m => m.RegisterComponent),
    title: 'Registro'
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent),
    title: 'Restablecer Contraseña'
  }
];