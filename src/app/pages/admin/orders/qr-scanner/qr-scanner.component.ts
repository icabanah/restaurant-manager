// src/app/pages/admin/orders/qr-scanner/qr-scanner.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  AlertController,
  ToastController,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  scanOutline,
  flashlightOutline,
  cameraReverseOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  warningOutline
} from 'ionicons/icons';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { OrderService } from 'src/app/services/order.service';
import { Order, MenuDish } from 'src/app/shared/interfaces/models';
import { FormsModule } from '@angular/forms';
import { LogoutButtonComponent } from 'src/app/shared/logout-button/logout-button.component';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZXingScannerModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonMenuButton,
    IonList,
    IonItem,
    IonLabel,
    IonText,
    LogoutButtonComponent
  ]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  // Scanner configs
  allowedFormats = [BarcodeFormat.QR_CODE];
  scannerEnabled = true;
  hasDevices = false;
  hasPermission = false;
  availableDevices: MediaDeviceInfo[] = [];
  currentDevice: MediaDeviceInfo | undefined;
  torchEnabled = false;

  // Scanned order
  scannedOrder: Order | null = null;
  scannerErrorMessage = '';
  lastScannedOrderId = '';
  recentlyScannedOrders: {order: Order, timestamp: Date}[] = [];

  constructor() {
    addIcons({
      scanOutline,
      flashlightOutline,
      cameraReverseOutline,
      closeCircleOutline,
      checkmarkCircleOutline,
      warningOutline
    });
  }

  ngOnInit() {
    this.loadRecentlyScannedOrders();
  }

  ngOnDestroy() {
    this.scannerEnabled = false;
  }

  camerasFoundHandler(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = Boolean(devices && devices.length);
    
    // Set default device as the first one found
    if (this.hasDevices && !this.currentDevice) {
      this.currentDevice = devices[0];
    }
  }

  camerasPermissionHandler(permission: boolean): void {
    this.hasPermission = permission;
    if (!permission) {
      this.scannerErrorMessage = 'Se requiere acceso a la cámara para escanear códigos QR';
    } else {
      this.scannerErrorMessage = '';
    }
  }

  cameraScanErrorHandler(error: Error): void {
    console.error('Error en el scanner:', error);
    this.scannerErrorMessage = `Error al escanear: ${error.message}`;
  }

  async scanSuccessHandler(result: string): Promise<void> {
    if (!result) return;
    
    // Evitar escaneos duplicados rápidos
    if (this.lastScannedOrderId && Date.now() - this.lastScanTimestamp < 3000) {
      return;
    }

    try {
      const qrData = JSON.parse(result);
      
      // Verificar que el QR contiene los datos necesarios
      if (!qrData.orderId || !qrData.qrCode) {
        await this.showToast('Código QR inválido', 'danger');
        return;
      }

      // Deshabilitar scanner temporalmente
      this.scannerEnabled = false;
      
      // Mostrar loader
      const loading = await this.loadingController.create({
        message: 'Verificando pedido...',
        duration: 5000
      });
      await loading.present();

      try {
        // Obtener el pedido
        this.scannedOrder = await this.orderService.getOrderById(qrData.orderId);
        
        if (!this.scannedOrder) {
          throw new Error('Pedido no encontrado');
        }

        // Verificar que el código QR coincide
        if (this.scannedOrder.qrCode !== qrData.qrCode) {
          throw new Error('Código QR no válido para este pedido');
        }

        // Guardar para evitar escaneos duplicados
        this.lastScannedOrderId = this.scannedOrder.id;
        this.lastScanTimestamp = Date.now();
        
        // Añadir a la lista de pedidos escaneados recientes
        this.addToRecentlyScannedOrders(this.scannedOrder);
        
        // Mostrar confirmación
        await this.showOrderConfirmation(this.scannedOrder);
      } catch (error) {
        console.error('Error al procesar el QR:', error);
        await this.showToast(error instanceof Error ? error.message : 'Error al procesar el código QR', 'danger');
      } finally {
        loading.dismiss();
        // Reactivar scanner después de un breve tiempo
        setTimeout(() => {
          this.scannerEnabled = true;
        }, 1500);
      }
    } catch (error) {
      await this.showToast('Formato de QR inválido', 'danger');
    }
  }

  async showOrderConfirmation(order: Order) {
    const alert = await this.alertController.create({
      header: 'Pedido Encontrado',
      message: `
        <h4>Pedido #${order.id.substring(0, 6)}</h4>
        <p><strong>Estado:</strong> ${this.getStatusText(order.status)}</p>
        <p><strong>Fecha:</strong> ${new Date(order.consumptionDate).toLocaleDateString('es-ES')}</p>
        <p><strong>Platos:</strong></p>
        <ul>
          ${order.selectedDishes.map(dish => `<li>${dish.name}</li>`).join('')}
        </ul>
      `,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        },
        {
          text: 'Marcar Completado',
          cssClass: 'success',
          handler: () => {
            this.updateOrderStatus(order.id, 'completed');
          }
        }
      ]
    });

    await alert.present();
  }

  async updateOrderStatus(orderId: string, status: 'completed' | 'cancelled') {
    const loading = await this.loadingController.create({
      message: 'Actualizando estado...',
      duration: 5000
    });
    await loading.present();

    try {
      await this.orderService.updateOrderStatus(orderId, status);
      await this.showToast(`Pedido marcado como ${status === 'completed' ? 'completado' : 'cancelado'}`, 'success');
      
      // Actualizar la lista de recientes
      this.updateRecentlyScannedOrder(orderId, status);
      
      // Limpiar pedido actual
      if (this.scannedOrder?.id === orderId) {
        this.scannedOrder = null;
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      await this.showToast('Error al actualizar el estado del pedido', 'danger');
    } finally {
      loading.dismiss();
    }
  }

  toggleTorch(): void {
    this.torchEnabled = !this.torchEnabled;
  }

  changeDevice(deviceId: string): void {
    const selectedDevice = this.availableDevices.find(device => device.deviceId === deviceId);
    if (selectedDevice) {
      this.currentDevice = selectedDevice;
    }
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

  // Manejo de pedidos recientes escaneados
  private lastScanTimestamp = 0;

  private addToRecentlyScannedOrders(order: Order) {
    // Añadir al principio de la lista
    this.recentlyScannedOrders.unshift({
      order: { ...order },
      timestamp: new Date()
    });
    
    // Limitar a 10 pedidos recientes
    if (this.recentlyScannedOrders.length > 10) {
      this.recentlyScannedOrders.pop();
    }
    
    // Guardar en localStorage
    this.saveRecentlyScannedOrders();
  }

  private updateRecentlyScannedOrder(orderId: string, status: 'pending' | 'completed' | 'cancelled' | 'emergency') {
    const orderIndex = this.recentlyScannedOrders.findIndex(item => item.order.id === orderId);
    if (orderIndex !== -1) {
      this.recentlyScannedOrders[orderIndex].order.status = status;
      this.saveRecentlyScannedOrders();
    }
  }

  private saveRecentlyScannedOrders() {
    try {
      localStorage.setItem('recentlyScannedOrders', JSON.stringify(this.recentlyScannedOrders));
    } catch (e) {
      console.error('Error al guardar pedidos recientes:', e);
    }
  }

  private loadRecentlyScannedOrders() {
    try {
      const saved = localStorage.getItem('recentlyScannedOrders');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.recentlyScannedOrders = parsed.map((item: any) => ({
          order: item.order,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (e) {
      console.error('Error al cargar pedidos recientes:', e);
      this.recentlyScannedOrders = [];
    }
  }

  clearRecentlyScannedOrders() {
    this.recentlyScannedOrders = [];
    localStorage.removeItem('recentlyScannedOrders');
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