// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, publicGuard, userGuard } from './guards/auth.guard';
import { loadingGuard } from './guards/loading.guard';

export const routes: Routes = [
  // Ruta por defecto
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: '',
    canActivate: [loadingGuard],
    children: [
      // Rutas de autenticación
      {
        path: 'auth',
        canActivate: [publicGuard],
        loadChildren: () => import('./pages/auth/auth.routes').then(m => m.AUTH_ROUTES)
      },

      // Rutas de administración
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadChildren: () => import('./pages/admin/admin.routes').then(m => m.ADMIN_ROUTES)
      },

      // Rutas de usuario
      {
        path: 'user',
        canActivate: [authGuard, userGuard],
        loadChildren: () => import('./pages/user/user.routes').then(m => m.USER_ROUTES)
      },

      // Ruta para manejar 404
      {
        path: '404',
        loadComponent: () => import('./pages/not-found/not-found.component')
          .then(m => m.NotFoundComponent)
      },

      // Redirigir rutas no encontradas a 404
      {
        path: '**',
        redirectTo: '404'
      }
    ]
  },

];