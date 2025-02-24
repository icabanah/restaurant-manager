import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

// navigation.service.ts
@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private readonly routes = {
    admin: '/admin/dashboard',
    user: '/user/menu',
    login: '/auth/login'
  };

  constructor(private router: Router) {}

  async navigateByRole(role: 'admin' | 'user'): Promise<void> {
    await this.router.navigate([this.routes[role]]);
  }

  async navigateToLogin(): Promise<void> {
    await this.router.navigate([this.routes.login]);
  }
}