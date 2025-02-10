import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: 'menus',
        loadComponent: () => import('./pages/admin/menu-management/menu-management.component')
          .then(m => m.MenuManagementComponent)
      }
    ]
  },
  {
    path: 'user',
    canActivate: [authGuard],
    children: [
      {
        path: 'menus',
        loadComponent: () => import('./pages/user/menu-list/menu-list.component').then(m => m.MenuListComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/user/order-history/order-history.component').then(m => m.OrderHistoryComponent)
      },
      {
        path: 'my-qr',
        loadComponent: () => import('./pages/user/my-qr/my-qr.component').then(m => m.MyQrComponent)
      }
    ]
  }
];