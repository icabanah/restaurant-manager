import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const loadingGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const MAX_WAIT_TIME = 5000;
  const startTime = Date.now();

  while (authService.isLoading()) {
    if(Date.now() - startTime > MAX_WAIT_TIME) {
      console.warn('Loading time exceeded');
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return true;
};
