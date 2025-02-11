// src/app/guards/auth.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard, authGuard, publicGuard, userGuard } from './auth.guard';
import { signal } from '@angular/core';

describe('Auth Guards', () => {
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'isAdmin'], {
      currentUser: signal(null)
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', async () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.currentUser.set({ id: '1', email: 'test@test.com', name: 'Test User', role: 'user', active: true });

      const result = await TestBed.runInInjectionContext(() => 
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(authService.isAuthenticated).toHaveBeenCalled();
    });

    it('should redirect to login when user is not authenticated', async () => {
      authService.isAuthenticated.and.returnValue(false);
      const navigateSpy = spyOn(router, 'navigate');

      const result = await TestBed.runInInjectionContext(() => 
        authGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  describe('adminGuard', () => {
    it('should allow access when user is admin', async () => {
      authService.isAdmin.and.returnValue(true);
      authService.currentUser.set({ id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin', active: true });

      const result = await TestBed.runInInjectionContext(() => 
        adminGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(authService.isAdmin).toHaveBeenCalled();
    });

    it('should redirect to user menu when user is not admin', async () => {
      authService.isAdmin.and.returnValue(false);
      const navigateSpy = spyOn(router, 'navigate');

      const result = await TestBed.runInInjectionContext(() => 
        adminGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/user/menu']);
    });
  });

  describe('publicGuard', () => {
    it('should allow access when user is not authenticated', async () => {
      authService.isAuthenticated.and.returnValue(false);

      const result = await TestBed.runInInjectionContext(() => 
        publicGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
    });

    it('should redirect admin users to admin dashboard', async () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.isAdmin.and.returnValue(true);
      const navigateSpy = spyOn(router, 'navigate');

      const result = await TestBed.runInInjectionContext(() => 
        publicGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
    });

    it('should redirect regular users to user menu', async () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.isAdmin.and.returnValue(false);
      const navigateSpy = spyOn(router, 'navigate');

      const result = await TestBed.runInInjectionContext(() => 
        publicGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/user/menu']);
    });
  });

  describe('userGuard', () => {
    it('should allow access when user is not admin', async () => {
      authService.isAdmin.and.returnValue(false);
      authService.currentUser.set({ id: '1', email: 'user@test.com', name: 'User', role: 'user', active: true });

      const result = await TestBed.runInInjectionContext(() => 
        userGuard({} as any, {} as any)
      );

      expect(result).toBe(true);
      expect(authService.isAdmin).toHaveBeenCalled();
    });

    it('should redirect to admin dashboard when user is admin', async () => {
      authService.isAdmin.and.returnValue(true);
      const navigateSpy = spyOn(router, 'navigate');

      const result = await TestBed.runInInjectionContext(() => 
        userGuard({} as any, {} as any)
      );

      expect(result).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/admin/dashboard']);
    });
  });

  describe('waitForUserData', () => {
    it('should resolve immediately if user data is already available', async () => {
      authService.currentUser.set({ id: '1', email: 'test@test.com', name: 'Test User', role: 'user', active: true });
      
      const startTime = Date.now();
      await TestBed.runInInjectionContext(() => 
        authGuard({} as any, {} as any)
      );
      const endTime = Date.now();

      // Verificar que la resolución fue rápida (menos de 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should wait for user data to become available', async () => {
      // Simular carga asíncrona de datos de usuario
      setTimeout(() => {
        authService.currentUser.set({ id: '1', email: 'test@test.com', name: 'Test User', role: 'user', active: true });
      }, 100);

      const result = await TestBed.runInInjectionContext(() => 
        authGuard({} as any, {} as any)
      );

      expect(authService.currentUser()).not.toBeNull();
    });

    it('should timeout after 5 seconds if user data never arrives', async () => {
      const startTime = Date.now();
      
      await TestBed.runInInjectionContext(() => 
        authGuard({} as any, {} as any)
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verificar que la duración fue de aproximadamente 5 segundos
      expect(duration).toBeGreaterThanOrEqual(4900);
      expect(duration).toBeLessThan(5500);
    });
  });
});