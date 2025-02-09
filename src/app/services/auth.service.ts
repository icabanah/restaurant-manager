import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
  companyId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  // Signals reemplazan a BehaviorSubject
  private userSignal = signal<User | null>(null);
  currentUser = computed(() => this.userSignal());

  async login(email: string, password: string): Promise<boolean> {
    const mockUser: User = {
      id: '1',
      email,
      name: 'Usuario Test',
      role: email.includes('admin') ? 'admin' : 'user',
      active: true,
      companyId: 'COMPANY_1'
    };
    
    this.userSignal.set(mockUser);
    return true;
  }

  logout(): void {
    this.userSignal.set(null);
    this.router.navigate(['/login']);
  }

  isAdmin = computed(() => this.currentUser()?.role === 'admin');
}