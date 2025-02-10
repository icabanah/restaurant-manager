import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth, 
  signInWithEmailAndPassword,
  signOut,
  authState 
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc 
} from '@angular/fire/firestore';

interface User {
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
    authState(this.auth).subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(this.firestore, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          this.currentUser.set({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            ...userDoc.data() as Omit<User, 'id' | 'email'>
          });
        }
      } else {
        this.currentUser.set(null);
      }
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      return !!result.user;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error en logout:', error);
    }
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }
}