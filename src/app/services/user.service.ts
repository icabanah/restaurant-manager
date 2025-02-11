import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  deleteUser as deleteFirebaseUser
} from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where
} from '@angular/fire/firestore';
import { User } from '../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async getAllUsers(): Promise<User[]> {
    const usersCollection = collection(this.firestore, 'users');
    const querySnapshot = await getDocs(usersCollection); // Obtener todos los documentos de la colección

    return querySnapshot.docs.map(doc => ({ // Mapear los documentos a objetos User
      id: doc.id,
      ...doc.data() as Omit<User, 'id'> // Omitir el campo 'id' del objeto User
    }));
  }

  async createUser(userData: Omit<User, 'id'>): Promise<string> {
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        userData.email,
        'password123' // Contraseña temporal
      );

      // Crear documento del usuario en Firestore
      const userDocRef = doc(this.firestore, 'users', userCredential.user.uid);
      await setDoc(userDocRef, {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        active: userData.active
      });

      return userCredential.user.uid;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'email'>>): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, updates);
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Primero verificar si el usuario tiene pedidos activos
      const ordersQuery = query(
        collection(this.firestore, 'orders'),
        where('userId', '==', userId),
        where('status', 'in', ['pending', 'emergency'])
      );

      const orderSnapshot = await getDocs(ordersQuery);
      if (!orderSnapshot.empty) {
        throw new Error('No se puede eliminar un usuario con pedidos activos');
      }

      // Eliminar documento del usuario en Firestore
      await deleteDoc(doc(this.firestore, 'users', userId));

      // Obtener usuario de Firebase Auth
      const user = this.auth.currentUser;
      if (user) {
        // Eliminar usuario de Firebase Auth
        await deleteFirebaseUser(user);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const userDoc = await getDoc(doc(this.firestore, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<User, 'id'>
    };
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    const q = query(
      collection(this.firestore, 'users'),
      where('role', '==', role)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<User, 'id'>
    }));
  }

  async updateUserStatus(userId: string, active: boolean): Promise<void> {
    const userRef = doc(this.firestore, 'users', userId);
    await updateDoc(userRef, { active });
  }

  async resetPassword(userId: string): Promise<void> {
    // Aquí se implementaría la lógica para resetear la contraseña
    // Usando Firebase Auth sendPasswordResetEmail
    throw new Error('Método no implementado');
  }
}