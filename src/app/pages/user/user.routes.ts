// pages/user/user.routes.ts
import { Routes } from '@angular/router';

export const USER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full'
  },
  {
    path: 'menu',
    loadComponent: () => import('./menu-list/menu-list.component')
      .then(m => m.MenuListComponent),
    title: 'Menú del Día'
  },
  {
    path: 'orders',
    loadComponent: () => import('./order-history/order-history.component')
      .then(m => m.OrderHistoryComponent),
    title: 'Historial de Pedidos'
  },
  {
    path: 'my-qr',
    loadComponent: () => import('./my-qr/my-qr.component')
      .then(m => m.MyQrComponent),
    title: 'Mis Códigos QR'
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component')
      .then(m => m.ProfileComponent),
    title: 'Mi Perfil'
  }
];