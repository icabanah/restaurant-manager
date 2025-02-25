// src/app/components/admin/orders/order-list/order-list.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  AlertController,
  ToastController,
  IonButtons,
  IonMenuButton,
  IonText,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  closeOutline,
  refreshOutline,
  alertCircleOutline,
  menuOutline
} from 'ionicons/icons';
import { OrderService } from '../../../../services/order.service';
import { MenuService } from '../../../../services/menu.service';
import { Order } from '../../../../shared/interfaces/models';
import { LogoutButtonComponent } from 'src/app/shared/logout-button/logout-button.component';

type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'emergency';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
    IonButtons,
    IonMenuButton,
    IonText,
    IonNote,
    LogoutButtonComponent
  ],
})
export class OrderListComponent implements OnInit {
  private orderService = inject(OrderService);
  // private toastServe = inject(ToastService);
  private menuService = inject(MenuService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  orders: Order[] = [];
  loading = true;
  selectedSegment: OrderStatus | 'all' = 'pending'; // 'pending' | 'completed' | 'cancelled' | 'emergency' | 'all'

  constructor() {
    addIcons({
      checkmarkOutline,
      closeOutline,
      refreshOutline,
      alertCircleOutline,
      menuOutline
    });
  }

  ngOnInit() {
    this.loadOrders();
  }

  async loadOrders() {
    this.loading = true;
    try {
      this.orders = await this.orderService.getOrders();
      this.orders.sort((a, b) => b.consumptionDate.getTime() - a.consumptionDate.getTime());
    } catch (error) {
      await this.showToast('Error al cargar pedidos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: { target: { complete: () => void } }) {
    try {
      await this.loadOrders();
    } catch (error) {
      // Manejo del error, por ejemplo:
      console.error('Error al recargar órdenes:', error);
      this.showToast('Error al actualizar los datos', 'danger');
    } finally {
      // Aseguramos que el refresher siempre se complete
      event.target.complete();
    }
  }

  async updateOrderStatus(order: Order, newStatus: OrderStatus) {
    try {
      await this.orderService.updateOrderStatus(order.id, newStatus);
      await this.loadOrders();
      await this.showToast('Estado del pedido actualizado');
    } catch (error) {
      await this.showToast('Error al actualizar el estado', 'danger');
    }
  }

  async confirmStatusChange(order: Order, newStatus: OrderStatus) {
    const alert = await this.alertController.create({
      header: 'Confirmar cambio',
      message: `¿Deseas cambiar el estado del pedido a ${this.getStatusText(newStatus)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => this.updateOrderStatus(order, newStatus),
        },
      ],
    });

    await alert.present();
  }

  getStatusText(status: OrderStatus): string {
    const statusMap: Record<OrderStatus, string> = {
      pending: 'Pendiente',
      completed: 'Completado',
      cancelled: 'Cancelado',
      emergency: 'Emergencia',
    };
    return statusMap[status];
  }

  getStatusColor(status: OrderStatus): string {
    const colorMap: Record<OrderStatus, string> = {
      pending: 'warning',
      completed: 'success',
      cancelled: 'danger',
      emergency: 'danger',
    };
    return colorMap[status];
  }

  getEmptyMessage(): string {
    if (this.selectedSegment === 'all') {
      return 'No hay pedidos';
    }
    return `No hay pedidos en estado ${this.getStatusText(this.selectedSegment as OrderStatus)}`;
  }

  filterOrders(): Order[] {
    if (this.selectedSegment === 'all') return this.orders;
    return this.orders.filter(order => order.status === this.selectedSegment);
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}