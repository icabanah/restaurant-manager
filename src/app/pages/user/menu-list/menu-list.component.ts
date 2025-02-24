import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonBadge,
  IonText,
  AlertController,
  ToastController,
  IonSegment,
  ModalController
} from '@ionic/angular/standalone';
import { MenuService } from '../../../services/menu.service';
import { OrderService } from '../../../services/order.service';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Menu } from 'src/app/shared/interfaces/models';
import { AuthService } from 'src/app/services/auth.service';
import { DateService } from 'src/app/services/date.service';
import { MenuOrderDialogComponent } from '../menu-order-dialog/menu-order-dialog.component';

@Component({
  selector: 'app-menu-list',
  templateUrl: './menu-list.component.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonBadge,
    IonText,
    IonSegment, 
    MenuOrderDialogComponent
  ]
})
export class MenuListComponent implements OnInit {
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);
  private dateService = inject(DateService);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);

  menus: Menu[] = [];

  async ngOnInit() {
    await this.loadMenus();
  }

  async loadMenus() {
    try {
      const yesterday = this.dateService.setYesterday(new Date());
      const tomorrow = this.dateService.setTomorrow(new Date());

      this.menus = await this.menuService.getMenusForDate( yesterday, tomorrow);
    } catch (error) {
      await this.showToast('Error al cargar menús', 'danger');
    }
  }

  canOrder(menu: Menu): boolean {
    const now = new Date();
    return menu.active &&
      menu.status === 'accepting_orders' &&
      now < menu.orderDeadline;
  }

  async orderMenu(menu: Menu) {
    if (!menu.id) return;

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        await this.showToast('Debes iniciar sesión para realizar pedidos', 'warning');
        return;
      }

      if (!this.canOrder(menu)) {
        await this.showToast('No se pueden realizar pedidos para este menú', 'warning');
        return;
      }

      // Crear y presentar el modal de selección de platillos
      const modal = await this.modalController.create({
        component: MenuOrderDialogComponent,
        componentProps: {
          menu: menu
        }
      });

      await modal.present();

      // Manejar el resultado del modal
      const result = await modal.onDidDismiss();
      if (result.data) {
        await this.orderService.createOrder(
          menu.id,
          menu.date,
          result.data.dishes,
          result.data.total,
          false,
          currentUser.id
        );
        await this.showToast('Pedido realizado con éxito');
        await this.loadMenus();
      }
    } catch (error: any) {
      await this.showToast(error.message || 'Error al realizar el pedido', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}