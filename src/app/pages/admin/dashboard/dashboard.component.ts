import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonMenuButton,
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonIcon,
  IonMenu,
  IonList,
  IonItem,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonSpinner,
  IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  menuOutline, 
  peopleOutline, 
  restaurantOutline, 
  listOutline,
  alertOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import { inject } from '@angular/core';
import { MenuService } from 'src/app/services/menu.service';
import { OrderService } from 'src/app/services/order.service';
import { Menu } from 'src/app/shared/interfaces/models';

interface DashboardStats {
  activeMenus: number;
  pendingOrders: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  emergencyOrders: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonBadge,
    IonButtons,
    IonButton,
    IonMenuButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonMenu,
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonSpinner
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);

  loading = true;
  stats: DashboardStats = {
    activeMenus: 0,
    pendingOrders: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    emergencyOrders: 0
  };
  latestMenus: Menu[] = [];

  constructor() {
    addIcons({ 
      logOutOutline, 
      menuOutline, 
      peopleOutline, 
      restaurantOutline, 
      listOutline,
      alertOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

  async ngOnInit() {
    await this.loadDashboardData();
  }

  async handleRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  async loadDashboardData() {
    this.loading = true;
    try {
      // Cargar menús de los próximos días
      const today = new Date();
      this.latestMenus = await this.menuService.getMenusForDate(today);
      
      // Calcular estadísticas de menús activos
      this.stats.activeMenus = this.latestMenus.filter(menu => menu.active).length;

      // Obtener todas las órdenes y calcular estadísticas
      const orders = await this.orderService.getUserOrders();
      
      this.stats.totalOrders = orders.length;
      this.stats.pendingOrders = orders.filter(order => order.status === 'pending').length;
      this.stats.completedOrders = orders.filter(order => order.status === 'completed').length;
      this.stats.cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      this.stats.emergencyOrders = orders.filter(order => order.isEmergency).length;

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }
}