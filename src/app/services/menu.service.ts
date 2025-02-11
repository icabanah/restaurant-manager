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
import { Menu } from '../shared/interfaces/models';

type UpdateableMenuFields = Pick<Menu, 'description' | 'orderDeadline' | 'active'>;

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
     orderDeadline: new Date(menu.date)
   };
   
   // Configurar la hora límite (5pm del día anterior)
   menuData.orderDeadline.setDate(menuData.orderDeadline.getDate() - 1);
   menuData.orderDeadline.setHours(17, 0, 0, 0);

   const docRef = await addDoc(collection(this.firestore, 'menus'), menuData);
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

 async deleteMenu(id: string): Promise<void> {
   const menuRef = doc(this.firestore, 'menus', id);
   const menuDoc = await getDoc(menuRef);
   const menu = menuDoc.data() as Menu;

   if (menu.currentOrders > 0) {
     throw new Error('No se puede eliminar un menú que ya tiene pedidos');
   }

   await deleteDoc(menuRef);
 }

 async updateMenu(id: string, updates: Partial<Menu>): Promise<void> {
   const menuRef = doc(this.firestore, 'menus', id);
   const menuDoc = await getDoc(menuRef);
   const menu = menuDoc.data() as Menu;

   if (menu.currentOrders > 0) {
     // Creamos un objeto con solo los campos permitidos que no sean undefined
     const filteredUpdates: Partial<UpdateableMenuFields> = {};
     
     if (updates.description !== undefined) {
       filteredUpdates.description = updates.description;
     }
     if (updates.orderDeadline !== undefined) {
       filteredUpdates.orderDeadline = updates.orderDeadline;
     }
     if (updates.active !== undefined) {
       filteredUpdates.active = updates.active;
     }

     await updateDoc(menuRef, filteredUpdates);
   } else {
     // Si no hay pedidos, permitir actualizar todo
     if (updates.date) {
       updates.date = new Date(updates.date);
     }
     await updateDoc(menuRef, updates);
   }
 }

 async closeOrders(menuId: string): Promise<void> {
   const menuRef = doc(this.firestore, 'menus', menuId);
   await updateDoc(menuRef, { 
     status: 'closed',
     active: false 
   });
 }

 async confirmOrders(menuId: string): Promise<void> {
   const menuRef = doc(this.firestore, 'menus', menuId);
   await updateDoc(menuRef, { 
     status: 'confirmed'
   });
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