import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  Timestamp,
  DocumentData
} from '@angular/fire/firestore';
import { MenuService } from './menu.service';
import { MenuPriceService } from './menu-price.service';
import { Order, Menu } from '../shared/interfaces/models';
import { AuthService } from './auth.service';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);
  private menuService = inject(MenuService);
  private menuPriceService = inject(MenuPriceService);
  private authService = inject(AuthService);
  private dateService = inject(DateService);

  async createOrder(menuId: string, consumptionDate: Date, isEmergency = false, userId: string): Promise<string> {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      const menu = await this.getMenuById(menuId);
      if (!menu) {
        throw new Error('Menú no encontrado');
      }

      // Validar que el usuario no tenga ya una orden para este menú
      const existingOrder = await this.getUserOrderForMenu(userId, menuId);
      if (existingOrder) {
        throw new Error('Ya tienes un pedido para este menú');
      }

      if (!isEmergency && !this.menuService.canAcceptOrders(menu)) {
        throw new Error('Este menú no está aceptando pedidos');
      }

      const totalCost = this.menuPriceService.calculateMenuPrice(menu.dishes);
      const companyShare = totalCost * 0.7;
      const employeeShare = totalCost * 0.3;

      const orderData: Omit<Order, 'id'> = {
        userId: currentUser.id,
        menuId,
        orderDate: this.dateService.toUTCDate(new Date()),
        consumptionDate: this.dateService.toUTCDate(consumptionDate),
        status: isEmergency ? 'emergency' : 'pending',
        qrCode: this.generateQRCode(),
        isEmergency,
        cost: {
          total: totalCost,
          companyShare,
          employeeShare
        }
      };

      const docRef = await addDoc(collection(this.firestore, 'orders'), orderData);

      await this.menuService.updateMenu(menuId, {
        currentOrders: menu.currentOrders + 1
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Error al crear el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  async getOrders(): Promise<Order[]> {
    try {
      const q = query(
        collection(this.firestore, 'orders'),
        orderBy('orderDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.mapOrderDocument(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting orders:', error);
      throw new Error('Error al obtener los pedidos');
    }
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(this.firestore, 'orders'),
        where('userId', '==', userId),
        orderBy('orderDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.mapOrderDocument(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting user orders:', error);
      throw new Error('Error al obtener los pedidos del usuario');
    }
  }

  // Método auxiliar para verificar órdenes existentes
  private async getUserOrderForMenu(userId: string, menuId: string): Promise<Order | null> {
    const q = query(
      collection(this.firestore, 'orders'),
      where('userId', '==', userId),
      where('menuId', '==', menuId)
    );

    const snapshot = await getDocs(q); // Obtenemos los documentos
    if (snapshot.empty) return null;

    return { // Mapeamos el primer documento
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data() as Omit<Order, 'id'>
    };
  }

  async getPendingOrders(): Promise<Order[]> {
    try {
      const q = query(
        collection(this.firestore, 'orders'),
        where('status', '==', 'pending'),
        orderBy('orderDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.mapOrderDocument(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting pending orders:', error);
      throw new Error('Error al obtener los pedidos pendientes');
    }
  }

  async getEmergencyOrders(): Promise<Order[]> {
    try {
      const q = query(
        collection(this.firestore, 'orders'),
        where('isEmergency', '==', true),
        where('status', 'in', ['pending', 'emergency']),
        orderBy('orderDate', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.mapOrderDocument(doc.id, doc.data()));
    } catch (error) {
      console.error('Error getting emergency orders:', error);
      throw new Error('Error al obtener los pedidos de emergencia');
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      const orderRef = doc(this.firestore, 'orders', orderId);
      await updateDoc(orderRef, {
        status,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Error al actualizar el estado del pedido');
    }
  }

  async cancelOrder(orderId: string): Promise<void> {
    try {
      const orderRef = doc(this.firestore, 'orders', orderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = orderDoc.data();
      const menu = await this.getMenuById(orderData['menuId']);

      if (menu) {
        await this.menuService.updateMenu(menu.id!, {
          currentOrders: Math.max(0, menu.currentOrders - 1) // En español: máximo entre 0 y (menos 1) para evitar números negativos
        });
      }

      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: new Date(),
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw new Error('Error al cancelar el pedido');
    }
  }

  private async getMenuById(menuId: string): Promise<Menu | null> {
    try {
      const menuRef = doc(this.firestore, 'menus', menuId);
      const menuDoc = await getDoc(menuRef);

      if (!menuDoc.exists()) { // Si el documento no existe
        return null;
      }

      const data = menuDoc.data(); // Obtenemos los datos del documento

      return {
        id: menuDoc.id,
        name: data['name'], // Accedemos a la propiedad 'name' de los datos
        description: data['description'],
        date: data['date'].toDate(),
        price: data['price'],
        active: data['active'],
        orderDeadline: data['orderDeadline'].toDate(),
        status: data['status'],
        currentOrders: data['currentOrders'],
        dishes: data['dishes'].map((dish: any) => ({ // Mapeamos los platos
          dishId: dish.dishId,
          name: dish.name,
          description: dish.description,
          price: dish.price,
          quantity: dish.quantity,
          category: dish.category
        }))
      };
    } catch (error) {
      console.error('Error getting menu by ID:', error);
      throw new Error('Error al obtener el menú');
    }
  }

  private mapOrderDocument(id: string, data: DocumentData): Order {
    return {
      id,
      userId: data['userId'],
      menuId: data['menuId'],
      orderDate: this.dateService.fromFirestore(data['orderDate']),
      consumptionDate: this.dateService.fromFirestore(data['consumptionDate']),
      status: data['status'],
      qrCode: data['qrCode'],
      isEmergency: data['isEmergency'],
      cost: data['cost']
    };
  }

  private generateQRCode(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ORDER-${timestamp}-${random}`;
  }
}