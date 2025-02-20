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
      date: this.dateService.toUTCDate(menu.date),
      orderDeadline: this.dateService.calculateOrderDeadline(menu.date)
    };

    const docRef = await addDoc(collection(this.firestore, 'menus'), menuData);
    return docRef.id;
  }

  async getMenusForDate(date: Date): Promise<Menu[]> {
    try {
      const startOfDay = this.dateService.getStartOfDay(date);
      const endOfDay = this.dateService.getEndOfDay(date);

      const menuCollection = collection(this.firestore, 'menus');
      const q = query(
        menuCollection,
        where('date', '>=', startOfDay),
        where('date', '<=', endOfDay)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Menu, 'id'>,
        date: this.dateService.fromFirestore(doc.data()['date']),
        orderDeadline: this.dateService.fromFirestore(doc.data()['orderDeadline'])
      }));
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
      now < menu.orderDeadline;
  }

  canFullyEdit(menu: Menu): boolean {
    return menu.currentOrders === 0;
  }

  canDelete(menu: Menu): boolean {
    return menu.currentOrders === 0;
  }
}