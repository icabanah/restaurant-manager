import { TestBed } from '@angular/core/testing';

import { MenuPriceService } from './menu-price.service';

describe('MenuPriceService', () => {
  let service: MenuPriceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuPriceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
