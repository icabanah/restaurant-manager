// src/app/services/auth.service.ts
import { Injectable, NgZone, inject, signal, computed } from '@angular/core';
import {
  Auth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  User as FirebaseUser,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '../shared/interfaces/models';
import { NavigationService } from './navigation.service';

export interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private navigationService = inject(NavigationService);

  // Estado de autenticación usando signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _error = signal<string | null>(null);

  // Computed signals para estados derivados
  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly currentUser = computed(() => this._currentUser());
  readonly error = computed(() => this._error());
  readonly isLoading = computed(() => this._isLoading());

  // Máximo de intentos de login fallidos antes de bloquear la cuenta
  private readonly MAX_LOGIN_ATTEMPTS = 5;

  constructor() {
    this.initializeAuthState();
  }

  private initializeAuthState() { // Inicializar estado de autenticación
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      this._isLoading.set(true);

      try {
        if (firebaseUser) {
          await this.loadUserData(firebaseUser);
        } else {
          this._currentUser.set(null);
        }
      } catch (error) {
        console.error('Error initializing auth state:', error);
        this._error.set('Error al cargar datos del usuario');
      } finally {
        this._isLoading.set(false);
      }
    });
  }

  private async loadUserData(firebaseUser: FirebaseUser): Promise<void> {
    try {
      console.log('Intentando cargar datos para usuario:', firebaseUser.uid);
      const userDocRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        console.error('No existe documento para el usuario en Firestore');

        // Verificar que tenemos un email
        if (!firebaseUser.email) {
          throw new Error('El usuario debe tener un email válido');
        }

        const initialUserData: Omit<User, 'id'> = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || '',
          role: 'user',
          active: true,
          lastLogin: new Date(),
          failedLoginAttempts: 0,
          locked: false,
          createdAt: new Date()
        };

        await setDoc(userDocRef, initialUserData);

        this._currentUser.set({
          id: firebaseUser.uid,
          ...initialUserData
        });
        return;
      }

      const userData = userDoc.data() as Omit<User, 'id' | 'email'>;

      if (userData.locked) {
        await this.logout();
        throw new Error('Tu cuenta está bloqueada. Contacta al administrador.');
      }

      // Actualizar último login
      try {
        await updateDoc(userDocRef, {
          lastLogin: new Date(),
          failedLoginAttempts: 0
        });
      } catch (updateError) {
        console.warn('No se pudo actualizar lastLogin:', updateError);
      }

      // Asegurarnos de que tenemos un email válido
      if (!firebaseUser.email) {
        throw new Error('El usuario debe tener un email válido');
      }

      this._currentUser.set({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData
      });

    } catch (error) {
      console.error('Error detallado cargando datos:', error);
      throw new Error('Error al cargar los datos del usuario');
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);

      if (result.user) {
        await this.loadUserData(result.user);

        // Redireccionar según el rol
        if (this.isAdmin()) {
          await this.navigationService.navigateByRole('admin');
        } else {
          await this.navigationService.navigateByRole('user');
        }

        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error detallado en login:', error);

      if (error.code === 'auth/wrong-password') {
        await this.incrementFailedLoginAttempts(email);
      }

      this._error.set(this.getErrorMessage(error.code));
      return false;  // Añadimos el return false en el catch
    } finally {
      this._isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);

      if (result.user) {
        // Verificar si el usuario ya existe en Firestore
        const userDoc = await getDoc(doc(this.firestore, 'users', result.user.uid));

        if (!userDoc.exists()) {
          // Crear nuevo usuario en Firestore
          await setDoc(doc(this.firestore, 'users', result.user.uid), {
            name: result.user.displayName || '',
            email: result.user.email,
            role: 'user',
            active: true,
            lastLogin: new Date()
          });
        }

        await this.loadUserData(result.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error en login con Google:', error);
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this._currentUser.set(null);
      this._error.set(null);
      await this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error en logout:', error);
      this._error.set('Error al cerrar sesión');
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Error al enviar email de reset:', error);
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  async updateUserPassword(newPassword: string): Promise<void> {
    if (!this.auth.currentUser) {
      throw new Error('No hay usuario autenticado');
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      await updatePassword(this.auth.currentUser, newPassword);
    } catch (error: any) {
      console.error('Error al actualizar contraseña:', error);
      this._error.set(this.getErrorMessage(error.code));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // Implementar búsqueda de usuario por email en Firestore
    // Este es un ejemplo simplificado
    return null;
  }

  private async incrementFailedLoginAttempts(email: string): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user?.id) return;

    const userRef = doc(this.firestore, 'users', user.id);
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;

    await updateDoc(userRef, {
      failedLoginAttempts: failedAttempts,
      locked: failedAttempts >= this.MAX_LOGIN_ATTEMPTS
    });
  }

  private getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/user-disabled':
        return 'Usuario deshabilitado';
      case 'auth/requires-recent-login':
        return 'Por favor, vuelve a iniciar sesión para realizar esta acción';
      case 'auth/popup-closed-by-user':
        return 'Ventana de autenticación cerrada por el usuario';
      case 'auth/cancelled-popup-request':
        return 'Operación cancelada';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este email usando otro método de inicio de sesión';
      default:
        return 'Error en la autenticación';
    }
  }
}