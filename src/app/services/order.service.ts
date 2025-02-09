import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from './auth.service';

interface Order {
  id: string;
  userId: string;
  menuId: string;
  orderDate: Date;
  consumptionDate: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'emergency';
  qrCode: string;
  isEmergency: boolean;
  cost: {
    total: number;
    companyShare: number;
    employeeShare: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private authService = inject(AuthService);
  private ordersSignal = signal<Order[]>([]);
  orders = computed(() => this.ordersSignal());

  // Computed signal para órdenes del usuario actual
  userOrders = computed(() => {
    const userId = this.authService.currentUser()?.id;
    return this.orders().filter(order => order.userId === userId);
  });

  async createOrder(menuId: string, consumptionDate: Date, isEmergency = false): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const newOrder: Order = {
      id: Date.now().toString(),
      userId: user.id,
      menuId,
      orderDate: new Date(),
      consumptionDate,
      status: 'pending',
      qrCode: this.generateQRCode(),
      isEmergency,
      cost: {
        total: 0,
        companyShare: 0,
        employeeShare: 0
      }
    };

    this.ordersSignal.update(orders => [...orders, newOrder]);
    return newOrder.id;
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    this.ordersSignal.update(orders => 
      orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      )
    );
  }

  private generateQRCode(): string {
    return `QR-${Date.now()}`;
  }
}