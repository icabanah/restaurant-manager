// dashboard.component.ts
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
  IonBadge,
  AlertController,
  ToastController
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
  closeCircleOutline,
  refreshOutline,
  createOutline,
  arrowForwardOutline,
  addCircleOutline,
  documentTextOutline,
  fastFoodOutline
} from 'ionicons/icons';
import { inject } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { Router } from '@angular/router';
import { MenuService } from 'src/app/services/menu.service';
import { Menu, Order } from 'src/app/shared/interfaces/models';

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
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private router = inject(Router);

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
      closeCircleOutline,
      refreshOutline,
      createOutline,
      arrowForwardOutline,
      addCircleOutline,
      documentTextOutline,
      fastFoodOutline
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
      this.stats.activeMenus = this.latestMenus.filter((menu: Menu) => menu.active).length;

      // Obtener todas las órdenes y calcular estadísticas
      const orders = await this.orderService.getOrders();
      
      this.stats.totalOrders = orders.length;
      this.stats.pendingOrders = orders.filter((order: Order) => order.status === 'pending').length;
      this.stats.completedOrders = orders.filter((order: Order) => order.status === 'completed').length;
      this.stats.cancelledOrders = orders.filter((order: Order) => order.status === 'cancelled').length;
      this.stats.emergencyOrders = orders.filter((order: Order) => order.isEmergency).length;

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      await this.showToast('Error al cargar datos del dashboard', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async createEmergencyMenu() {
    const alert = await this.alertController.create({
      header: 'Crear Menú de Emergencia',
      message: '¿Deseas crear un nuevo menú de emergencia para hoy?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Crear',
          handler: () => {
            this.router.navigate(['/admin/menus/management'], { 
              queryParams: { emergency: true } 
            });
          }
        }
      ]
    });

    await alert.present();
  }

  editMenu(menu: Menu) {
    if (!menu.id) return;
    this.router.navigate(['/menus/management'], { 
      queryParams: { menuId: menu.id } 
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}