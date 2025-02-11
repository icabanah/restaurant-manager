// src/app/services/auth.service.ts
import { Injectable, NgZone, inject, signal } from '@angular/core';
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
  currentUser = signal<User | null>(null);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  constructor() {
    this.auth.onAuthStateChanged((firebaseUser) => {
      this.ngZone.run(async () => {
        if (firebaseUser) {
          await this.loadUserData(firebaseUser);
        } else {
          this.currentUser.set(null);
        }
      });
    });
  }

  private async loadUserData(firebaseUser: FirebaseUser) {
    console.log('Loading user data for:', firebaseUser.uid);
    const userDoc = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
    console.log('User doc exists:', userDoc.exists());
    if (userDoc.exists()) {
      const userData = userDoc.data() as Omit<User, 'id' | 'email'>;
      console.log('User data:', userData);
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