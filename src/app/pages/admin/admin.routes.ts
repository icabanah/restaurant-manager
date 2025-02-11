// pages/admin/admin.routes.ts
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Panel de Control'
  },
  {
    path: 'menus',
    children: [
      {
        path: '',
        loadComponent: () => import('./menus/menu-management/menu-management.component')
          .then(m => m.MenuManagementComponent),
        title: 'Gestión de Menús'
      }
    ]
  },
  {
    path: 'dishes',
    children: [
      {
        path: '',
        loadComponent: () => import('./dish/dish-management/dish-management.component')
          .then(m => m.DishManagementComponent),
        title: 'Gestión de Platillos'
      },
      {
        path: 'selector',
        loadComponent: () => import('./dish/dish-selector/dish-selector.component')
          .then(m => m.DishSelectorComponent),
        title: 'Selector de Platillos'
      }
    ]
  },
  {
    path: 'orders',
    children: [
      {
        path: '',
        loadComponent: () => import('./orders/order-list/order-list.component')
          .then(m => m.OrderListComponent),
        title: 'Lista de Pedidos'
      },
      {
        path: 'pending',
        loadComponent: () => import('./orders/pending-orders/pending-orders.component')
          .then(m => m.PendingOrdersComponent),
        title: 'Pedidos Pendientes'
      },
      {
        path: 'emergency',
        loadComponent: () => import('./orders/emergency-orders/emergency-orders.component')
          .then(m => m.EmergencyOrdersComponent),
        title: 'Pedidos de Emergencia'
      },
      {
        path: 'qr-scanner',
        loadComponent: () => import('./orders/qr-scanner/qr-scanner.component')
          .then(m => m.QrScannerComponent),
        title: 'Escáner QR'
      }
    ]
  },
  {
    path: 'users',
    loadComponent: () => import('./users/user-management/user-management.component')
      .then(m => m.UserManagementComponent),
    title: 'Gestión de Usuarios'
  },
];