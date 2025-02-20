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
import { Order, Menu, MenuDish } from '../shared/interfaces/models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);
  private menuService = inject(MenuService);
  private menuPriceService = inject(MenuPriceService);
  private authService = inject(AuthService);

  /*
   * Crea una nueva orden en el sistema
   * @param menuId ID del menú seleccionado
   * @param consumptionDate Fecha en que se consumirá el pedido
   * @param selectedDishes Platillos seleccionados por el usuario
   * @param total Precio total calculado
   * @param isEmergency Indica si es un pedido de emergencia
   * @param userId ID del usuario que realiza el pedido
   */

  async createOrder(
    menuId: string,
    consumptionDate: Date,
    selectedDishes: MenuDish[],
    total: number,
    isEmergency = false,
    userId: string
  ): Promise<string> {
    try {
      // Verificar autenticación del usuario
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener y validar el menú
      const menu = await this.getMenuById(menuId);
      if (!menu) {
        throw new Error('Menú no encontrado');
      }

      // Validar que el usuario no tenga una orden existente para este menú
      const existingOrder = await this.getUserOrderForMenu(userId, menuId);
      if (existingOrder) {
        throw new Error('Ya tienes un pedido para este menú');
      }

      // Validar que el menú está aceptando pedidos (excepto para emergencias)
      if (!isEmergency && !this.menuService.canAcceptOrders(menu)) {
        throw new Error('Este menú no está aceptando pedidos');
      }

      // Validar la composición del pedido
      const orderValidation = this.menuPriceService.validateMenuComposition(selectedDishes);
      if (!orderValidation.isValid) {
        throw new Error(orderValidation.message);
      }

      // Crear el objeto de la orden
      const orderData: Omit<Order, 'id'> = {
        userId: currentUser.id,
        menuId,
        orderDate: new Date(),
        consumptionDate,
        status: isEmergency ? 'emergency' : 'pending',
        qrCode: this.generateQRCode(),
        isEmergency,
        selectedDishes, // Platillos específicos seleccionados
        cost: {
          total,
          companyShare: total * 0.7, // 70% asumido por la empresa
          employeeShare: total * 0.3  // 30% pagado por el empleado
        }
      };

      // Crear la orden en Firestore
      const docRef = await addDoc(collection(this.firestore, 'orders'), orderData);

      // Actualizar el contador de órdenes en el menú
      await this.menuService.updateMenu(menuId, {
        currentOrders: menu.currentOrders + 1
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new Error('Error al crear el pedido: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }

  /**
   * Obtiene todas las órdenes del sistema
   */
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

  /**
   * Obtiene las órdenes de un usuario específico
   */
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

  /**
   * Verifica si un usuario ya tiene una orden para un menú específico
   */
  private async getUserOrderForMenu(userId: string, menuId: string): Promise<Order | null> {
    const q = query(
      collection(this.firestore, 'orders'),
      where('userId', '==', userId),
      where('menuId', '==', menuId)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    return this.mapOrderDocument(snapshot.docs[0].id, snapshot.docs[0].data());
  }

  /**
   * Obtiene las órdenes pendientes
   */
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

  /**
   * Obtiene las órdenes de emergencia
   */
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

  /**
   * Actualiza el estado de una orden
   */
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

  /**
   * Cancela una orden y actualiza el contador del menú
   */
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
          currentOrders: Math.max(0, menu.currentOrders - 1)
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

  /**
   * Obtiene un menú por su ID
   */
  private async getMenuById(menuId: string): Promise<Menu | null> {
    try {
      const menuRef = doc(this.firestore, 'menus', menuId);
      const menuDoc = await getDoc(menuRef);

      if (!menuDoc.exists()) {
        return null;
      }

      const data = menuDoc.data();

      return {
        id: menuDoc.id,
        name: data['name'],
        description: data['description'],
        date: data['date'].toDate(),
        price: data['price'],
        active: data['active'],
        orderDeadline: data['orderDeadline'].toDate(),
        status: data['status'],
        currentOrders: data['currentOrders'],
        dishes: data['dishes'].map((dish: any) => ({
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

  /**
   * Mapea un documento de Firestore a un objeto Order
   */
  private mapOrderDocument(id: string, data: DocumentData): Order {
    return {
      id,
      userId: data['userId'],
      menuId: data['menuId'],
      orderDate: data['orderDate'].toDate(),
      consumptionDate: data['consumptionDate'].toDate(),
      status: data['status'],
      qrCode: data['qrCode'],
      isEmergency: data['isEmergency'],
      selectedDishes: data['selectedDishes'] || [], // Manejo de compatibilidad con órdenes antiguas
      cost: data['cost']
    };
  }

  /**
   * Genera un código QR único para la orden
   */
  private generateQRCode(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ORDER-${timestamp}-${random}`;
  }
}