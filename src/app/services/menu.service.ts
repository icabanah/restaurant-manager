import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Menu, MenuDish } from '../shared/interfaces/models';
import { DateService } from './date.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private firestore = inject(Firestore);
  private dateService = inject(DateService);

  async createMenu(menu: Omit<Menu, 'id' | 'currentOrders' | 'status'>): Promise<string> {
    const menuData = {
      ...menu,
      currentOrders: 0,
      status: 'accepting_orders',
      // Utilizamos DateService para calcular la fecha límite
      orderDeadline: this.dateService.calculateOrderDeadline(menu.date),
      // Convertimos la fecha del menú a UTC
      date: this.dateService.toUTCDate(menu.date),
      dishes: menu.dishes.map(dish => ({
        dishId: dish.dishId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        quantity: dish.quantity,
        category: dish.category
      }))
    };

    const docRef = await addDoc(collection(this.firestore, 'menus'), menuData);
    return docRef.id;
  }

  async getMenusForDate(startDate: Date, endDate: Date): Promise<Menu[]> {
    try {
      // Utilizamos el DateService para obtener el inicio y fin del día
      const startOfDay = this.dateService.getStartOfDay(startDate);
      const endOfDay = this.dateService.getEndOfDay(endDate);
      // const startOfDay = new Date(date);
      // startOfDay.setHours(0, 0, 0, 0);

      // const endOfDay = new Date(date);
      // endOfDay.setHours(23, 59, 59, 999);

      console.log('Buscando menus entre: ', startOfDay, 'y', endOfDay);

      const menuCollection = collection(this.firestore, 'menus');
      const q = query(
        menuCollection,
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay),
        // where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const menus = querySnapshot.docs.map(doc => {
        // Utilizamos el DateService para convertir las fechas de Firestore
        const data = doc.data();
        return {
          id: doc.id,
          ...data as Omit<Menu, 'id' | 'date' | 'orderDeadline'>,
          date: this.dateService.fromFirestore(data['date']),
          orderDeadline: this.dateService.fromFirestore(data['orderDeadline'])
        };
      });

      // Actualizamos el estado basándonos en la fecha límite
      const now = new Date();
      menus.forEach(menu => {
        if (now > menu.orderDeadline) {
          menu.status = 'closed';
        }
      });

      // Ordenamiento de menús
      return menus.sort((a, b) => {
        if (a.status === 'accepting_orders' && b.status !== 'accepting_orders') return -1;
        if (a.status !== 'accepting_orders' && b.status === 'accepting_orders') return 1;
        return a.date.getTime() - b.date.getTime();
      });
    } catch (error) {
      console.error('Error en getMenusForDate:', error);
      throw error;
    }
  }

  async updateMenu(id: string, updates: Partial<Menu>): Promise<void> {
    const menuRef = doc(this.firestore, 'menus', id);
    const updateData = { ...updates };

    // Si se están actualizando los platillos, asegurarse de que tengan la estructura correcta
    if (updates.dishes) {
      updateData.dishes = updates.dishes.map(dish => ({
        dishId: dish.dishId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        quantity: dish.quantity,
        category: dish.category
      }));
    }

    await updateDoc(menuRef, updateData);
  }

  // Los otros métodos permanecen igual
  async deleteMenu(id: string): Promise<void> {
    const menuRef = doc(this.firestore, 'menus', id);
    const menuDoc = await getDoc(menuRef);
    const menu = menuDoc.data() as Menu;

    if (menu.currentOrders > 0) {
      throw new Error('No se puede eliminar un menú que ya tiene pedidos');
    }

    await deleteDoc(menuRef);
  }

  canAcceptOrders(menu: Menu): boolean {
    const now = new Date();
    return menu.active &&
      menu.status === 'accepting_orders' &&
      now <= menu.orderDeadline;
  }

  canFullyEdit(menu: Menu): boolean {
    return menu.currentOrders === 0;
  }

  canDelete(menu: Menu): boolean {
    return menu.currentOrders === 0;
  }
}