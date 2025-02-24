import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { loadingGuard } from './loading.guard';

describe('loadingGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => loadingGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
