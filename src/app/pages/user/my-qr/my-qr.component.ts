// src/app/pages/user/my-qr/my-qr.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonButtons,
  IonMenuButton,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonText,
  ToastController
} from '@ionic/angular/standalone';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { Order } from '../../../shared/interfaces/models';
import { addIcons } from 'ionicons';
import {
  refreshOutline,
  restaurantOutline,
  calendarOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  qrCodeOutline
} from 'ionicons/icons';
import { QRCodeComponent } from 'angularx-qrcode';
import { RouterModule } from '@angular/router';
import { LogoutButtonComponent } from 'src/app/shared/logout-button/logout-button.component';

@Component({
  selector: 'app-my-qr',
  templateUrl: './my-qr.component.html',
  styleUrls: ['./my-qr.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    QRCodeComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonButtons,
    IonMenuButton,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonText,
    LogoutButtonComponent
  ]
})
export class MyQrComponent implements OnInit {
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toastController = inject(ToastController);

  orders: Order[] = [];
  activeOrder: Order | null = null;
  loading = true;
  qrCodeData = '';
  selectedOrderIndex = 0;

  constructor() {
    addIcons({
      refreshOutline,
      restaurantOutline,
      calendarOutline,
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      qrCodeOutline
    });
  }

  async ngOnInit() {
    await this.loadUserOrders();
  }

  async handleRefresh(event: any) {
    await this.loadUserOrders();
    event.target.complete();
  }

  // En MyQrComponent
  async loadUserOrders() {
    try {
      this.loading = true;

      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.showToast('No se ha podido cargar la información del usuario', 'warning');
        return;
      }

      // Obtener todas las órdenes del usuario
      this.orders = await this.orderService.getUserOrders(currentUser.id);

      // Filtrar solo la orden activa (debe ser una sola)
      const activeOrder = this.orders.find(order =>
        order.status === 'pending' || order.status === 'emergency'
      );

      if (activeOrder) {
        this.activeOrder = activeOrder;
        // Crear data para el QR
        const qrData = {
          orderId: activeOrder.id,
          userId: activeOrder.userId,
          menuId: activeOrder.menuId,
          qrCode: activeOrder.qrCode,
          status: activeOrder.status,
          timestamp: new Date().getTime()
        };

        this.qrCodeData = JSON.stringify(qrData);
      } else {
        this.activeOrder = null;
        this.qrCodeData = '';
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showToast('Error al cargar pedidos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  // Método simplificado
  setActiveOrder(order: Order) {
    this.activeOrder = order;

    // Crear data para el QR con información relevante del pedido
    const qrData = {
      orderId: order.id,
      userId: order.userId,
      menuId: order.menuId,
      qrCode: order.qrCode,
      status: order.status,
      timestamp: new Date().getTime()
    };

    this.qrCodeData = JSON.stringify(qrData);
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      case 'emergency': return 'Emergencia';
      default: return status;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'emergency': return 'danger';
      default: return 'medium';
    }
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