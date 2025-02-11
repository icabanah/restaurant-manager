// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard, publicGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login/login.component')
          .then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register/register.component')
          .then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.component')
          .then(m => m.DashboardComponent),
        canActivate: [adminGuard, authGuard]
      },
      {
        path: 'menus',
        loadComponent: () => import('./pages/admin/menu-management/menu-management.component')
          .then(m => m.MenuManagementComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/admin/order-management/order-management.component')
          .then(m => m.OrderManagementComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin/user-management/user-management.component')
          .then(m => m.UserManagementComponent)
      },
      {
        path: 'qr-scanner',
        loadComponent: () => import('./pages/admin/qr-scanner/qr-scanner.component')
          .then(m => m.QrScannerComponent)
      }
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'menu',
        pathMatch: 'full'
      },
      {
        path: 'menu',
        loadComponent: () => import('./pages/user/menu-list/menu-list.component')
          .then(m => m.MenuListComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/user/order-history/order-history.component')
          .then(m => m.OrderHistoryComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/user/profile/profile.component')
          .then(m => m.ProfileComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];