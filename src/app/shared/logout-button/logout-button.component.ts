// src/app/shared/components/logout-button/logout-button.component.ts
import { Component, inject } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';

@Component({
  selector: 'app-logout-button',
  templateUrl:'./logout-button.component.html',
  standalone: true,
  imports: [IonButton, IonIcon]
})
export class LogoutButtonComponent {
  private authService = inject(AuthService);

  constructor() {
    addIcons({ logOutOutline });
  }

  async logout() {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}