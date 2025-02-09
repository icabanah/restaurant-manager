import { Injectable, signal, computed } from '@angular/core';

interface Menu {
  id: string;
  date: Date;
  name: string;
  description: string;
  price: number;
  maxOrders: number;
  currentOrders: number;
  active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menusSignal = signal<Menu[]>([]);
  menus = computed(() => this.menusSignal());

  async getMenuForDate(date: Date): Promise<Menu[]> {
    return this.menus().filter(menu => 
      menu.date.toDateString() === date.toDateString()
    );
  }

  async createMenu(menu: Omit<Menu, 'id'>): Promise<string> {
    const newMenu = {
      ...menu,
      id: Date.now().toString(),
      currentOrders: 0
    };
    
    this.menusSignal.update(menus => [...menus, newMenu]);
    return newMenu.id;
  }

  async updateMenu(id: string, updates: Partial<Menu>): Promise<void> {
    this.menusSignal.update(menus => 
      menus.map(menu => menu.id === id ? { ...menu, ...updates } : menu)
    );
  }
}