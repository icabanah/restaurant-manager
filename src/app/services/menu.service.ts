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

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private firestore = inject(Firestore);

  async createMenu(menu: Omit<Menu, 'id' | 'currentOrders' | 'status'>): Promise<string> {
    const menuData = {
      ...menu,
      currentOrders: 0,
      status: 'accepting_orders',
      orderDeadline: new Date(menu.date),
      // Asegurarse de que los platillos tengan la estructura correcta
      dishes: menu.dishes.map(dish => ({
        dishId: dish.dishId,
        name: dish.name,
        description: dish.description,
        price: dish.price,
        quantity: dish.quantity,
        category: dish.category
      }))
    };
    
    menuData.orderDeadline.setDate(menuData.orderDeadline.getDate() - 1);
    menuData.orderDeadline.setHours(17, 0, 0, 0);

    const docRef = await addDoc(collection(this.firestore, 'menus'), menuData);
    return docRef.id;
  }

  async getMenusForDate(date: Date): Promise<Menu[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

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
        date: doc.data()['date'].toDate(),
        orderDeadline: doc.data()['orderDeadline'].toDate()
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