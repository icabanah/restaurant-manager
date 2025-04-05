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
  IonButtons,
  IonBadge,
  IonText,
  IonSegment,
  ToastController,
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
import { LogoutButtonComponent } from 'src/app/shared/logout-button/logout-button.component';
import { OrderMenuModalComponent } from '../order-menu-modal/order-menu-modal.component';

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
    IonButtons,
    IonBadge,
    IonText,
    IonSegment, 
    MenuOrderDialogComponent,
    LogoutButtonComponent
  ]
})
export class MenuListComponent implements OnInit {
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);
  private dateService = inject(DateService);
  private modalController = inject(ModalController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);

  orderedMenuIds: Set<string> = new Set();

  menus: Menu[] = [];

  async ngOnInit() {
    await this.loadMenus();
    await this.loadUserOrders();
  }

  async loadMenus() {
    try {
      const yesterday = this.dateService.setYesterday(new Date());
      console.log(yesterday);
      
      const tomorrow = this.dateService.setTomorrow(new Date());
      console.log(tomorrow);

      this.menus = await this.menuService.getMenusForDate( yesterday, tomorrow);
    } catch (error) {
      await this.showToast('Error al cargar menús', 'danger');
    }
  }

  async loadUserOrders() {
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;
      
      const userOrders = await this.orderService.getUserOrders(currentUser.id);
      
      // Guardar los IDs de los menús que ya han sido ordenados
      this.orderedMenuIds = new Set(
        userOrders.map(order => order.menuId)
      );
    } catch (error) {
      await this.showToast('Error al cargar los pedidos del usuario', 'danger');
    }
  }

  canOrder(menu: Menu): boolean {
    if (!menu.id) return false;
    
    const now = new Date();
    return menu.active &&
      menu.status === 'accepting_orders' &&
      now < menu.orderDeadline &&
      !this.orderedMenuIds.has(menu.id); // Verificar si ya ha ordenado este menú
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
        component: OrderMenuModalComponent,
        componentProps: {
          menu: menu
        }
      });
      await modal.present();

      // Manejar el resultado del modal
      const result = await modal.onDidDismiss();
      if (result?.data) {
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
        await this.loadUserOrders();
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