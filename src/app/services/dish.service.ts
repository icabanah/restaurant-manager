// src/app/services/dish.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc,
  doc,
  getDoc,
  getDocs,
  query, 
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Dish } from '../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class DishService {
  private firestore = inject(Firestore);

  async createDish(dishData: Omit<Dish, 'id'>): Promise<string> {
    try {
      const dish = {
        ...dishData,
        active: true,
        timesUsed: 0,
        lastUsed: null
      };

      const docRef = await addDoc(collection(this.firestore, 'dishes'), dish);
      return docRef.id;
    } catch (error) {
      console.error('Error creating dish:', error);
      throw new Error('Error al crear el platillo');
    }
  }

  async getDishById(id: string): Promise<Dish | null> {
    try {
      const docRef = doc(this.firestore, 'dishes', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data() as Omit<Dish, 'id'>
      };
    } catch (error) {
      console.error('Error getting dish:', error);
      throw new Error('Error al obtener el platillo');
    }
  }

  async getActiveDishes(): Promise<Dish[]> {
    try {
      const q = query(
        collection(this.firestore, 'dishes'),
        where('active', '==', true),
        orderBy('name', 'asc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Dish, 'id'>
      }));
    } catch (error) {
      console.error('Error getting active dishes:', error);
      throw new Error('Error al obtener los platillos activos');
    }
  }

  async getRecentDishes(limit = 5): Promise<Dish[]> {
    try {
      const dishes = await this.getActiveDishes();
      return dishes
        .filter(dish => dish.lastUsed)
        .sort((a, b) => {
          const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent dishes:', error);
      throw new Error('Error al obtener los platillos recientes');
    }
  }

  async getDishesByCategory(category: string): Promise<Dish[]> {
    try {
      const q = query(
        collection(this.firestore, 'dishes'),
        where('category', '==', category),
        where('active', '==', true)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Dish, 'id'>
      }));
    } catch (error) {
      console.error('Error getting dishes by category:', error);
      throw new Error('Error al obtener los platillos por categoría');
    }
  }

  async updateDish(id: string, updates: Partial<Omit<Dish, 'id'>>): Promise<void> {
    try {
      const dishRef = doc(this.firestore, 'dishes', id);
      await updateDoc(dishRef, updates);
    } catch (error) {
      console.error('Error updating dish:', error);
      throw new Error('Error al actualizar el platillo');
    }
  }

  async updateDishUsage(id: string): Promise<void> {
    try {
      const dishRef = doc(this.firestore, 'dishes', id);
      const dishDoc = await getDoc(dishRef);

      if (!dishDoc.exists()) {
        throw new Error('Platillo no encontrado');
      }

      const currentTimesUsed = dishDoc.data()['timesUsed'] || 0;

      await updateDoc(dishRef, {
        timesUsed: currentTimesUsed + 1,
        lastUsed: new Date()
      });
    } catch (error) {
      console.error('Error updating dish usage:', error);
      throw new Error('Error al actualizar el uso del platillo');
    }
  }

  async deleteDish(id: string): Promise<void> {
    try {
      // En lugar de eliminar físicamente, marcamos como inactivo
      await this.updateDish(id, { active: false });
    } catch (error) {
      console.error('Error deleting dish:', error);
      throw new Error('Error al eliminar el platillo');
    }
  }

  async restoreDish(id: string): Promise<void> {
    try {
      await this.updateDish(id, { active: true });
    } catch (error) {
      console.error('Error restoring dish:', error);
      throw new Error('Error al restaurar el platillo');
    }
  }

  // dish.service.ts
async getMostUsedDishes(limitCount = 10): Promise<Dish[]> {
  try {
    const q = query(
      collection(this.firestore, 'dishes'),
      where('active', '==', true),
      orderBy('timesUsed', 'desc'),
      limit(limitCount)  // Aquí usamos la función limit de Firestore
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Dish, 'id'>
    }));
  } catch (error) {
    console.error('Error getting most used dishes:', error);
    throw new Error('Error al obtener los platillos más usados');
  }
}

  async searchDishes(searchTerm: string): Promise<Dish[]> {
    try {
      // Realizamos la búsqueda en memoria para mayor flexibilidad
      const dishes = await this.getActiveDishes();
      const term = searchTerm.toLowerCase();

      return dishes.filter(dish => 
        dish.name.toLowerCase().includes(term) ||
        dish.description.toLowerCase().includes(term) ||
        dish.category.toLowerCase().includes(term)
      );
    } catch (error) {
      console.error('Error searching dishes:', error);
      throw new Error('Error al buscar platillos');
    }
  }
}