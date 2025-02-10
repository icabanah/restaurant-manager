// src/app/services/menu.service.ts
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

export interface Menu {
  id?: string;
  name: string;
  description: string;
  date: Date;
  price: number;
  maxOrders: number;
  currentOrders: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private firestore = inject(Firestore);

  async createMenu(menu: Omit<Menu, 'id' | 'currentOrders'>): Promise<string> {
    const menuCollection = collection(this.firestore, 'menus');
    const docRef = await addDoc(menuCollection, {
      ...menu,
      currentOrders: 0,
      date: menu.date.toISOString()
    });
    return docRef.id;
  }

  async getMenusForDate(date: Date): Promise<Menu[]> {
    try {
      console.log('Consultando menús para fecha:', date);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const menuCollection = collection(this.firestore, 'menus');
      const q = query(
        menuCollection,
        where('date', '>=', startOfDay.toISOString()),
        where('date', '<=', endOfDay.toISOString())
      );

      const querySnapshot = await getDocs(q);
      const menus = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Menu, 'id'>,
        date: new Date(doc.data()['date'])
      }));

      console.log('Menús encontrados:', menus);
      return menus;

    } catch (error) {
      console.error('Error en getMenusForDate:', error);
      throw error;
    }
  }

  async updateMenu(id: string, updates: Partial<Menu>): Promise<void> {
    const menuRef = doc(this.firestore, 'menus', id);

    // Creamos una copia de las actualizaciones
    const updateData: any = { ...updates };

    // Verificamos y convertimos la fecha si existe
    if (updates.date) {
      updateData.date = (updates.date as Date).toISOString();
    }

    await updateDoc(menuRef, updateData);
  }

  async deleteMenu(id: string): Promise<void> {
    const menuRef = doc(this.firestore, 'menus', id);
    await deleteDoc(menuRef);
  }
}