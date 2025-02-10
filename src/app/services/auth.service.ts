// src/app/services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc 
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  currentUser = signal<User | null>(null);

  constructor() {
    // Observar cambios en el estado de autenticación
    this.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await this.loadUserData(firebaseUser);
      } else {
        this.currentUser.set(null);
      }
    });
  }

  private async loadUserData(firebaseUser: FirebaseUser) { // Cargar datos del usuario
    const userDoc = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as Omit<User, 'id' | 'email'>;
      this.currentUser.set({
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        ...userData
      });
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      if (result.user) {
        await this.loadUserData(result.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.currentUser.set(null);
      await this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }
}