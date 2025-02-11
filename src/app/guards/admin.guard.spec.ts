// src/app/guards/admin.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let router: Router;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'isAdmin'
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    router = TestBed.inject(Router);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should allow access when user is authenticated and is admin', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(true);

    const result = await TestBed.runInInjectionContext(() => 
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(true);
    expect(authService.isAuthenticated).toHaveBeenCalled();
    expect(authService.isAdmin).toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', async () => {
    authService.isAuthenticated.and.returnValue(false);
    authService.isAdmin.and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate');

    const result = await TestBed.runInInjectionContext(() => 
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should redirect to login when user is authenticated but not admin', async () => {
    authService.isAuthenticated.and.returnValue(true);
    authService.isAdmin.and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate');

    const result = await TestBed.runInInjectionContext(() => 
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should handle navigation rejection gracefully', async () => {
    authService.isAuthenticated.and.returnValue(false);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.reject('Navigation failed')
    );

    const result = await TestBed.runInInjectionContext(() => 
      adminGuard({} as any, {} as any)
    );

    expect(result).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/auth/login']);
  });
});