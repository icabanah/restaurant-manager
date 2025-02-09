import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Home</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Bienvenido!</h2>
      <p>Login exitoso</p>
    </ion-content>
  `,
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class HomeComponent {}