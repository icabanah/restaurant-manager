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
  IonSegment
} from '@ionic/angular/standalone';
import { MenuService } from '../../../services/menu.service';
import { OrderService } from '../../../services/order.service';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { Menu } from 'src/app/shared/interfaces/models';
import { AuthService } from 'src/app/services/auth.service';

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
    IonSegment
  ]
})
export class MenuListComponent implements OnInit {
  private menuService = inject(MenuService);
  private orderService = inject(OrderService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private authService = inject(AuthService);

  menus: Menu[] = [];

  async ngOnInit() {
    await this.loadMenus();
  }

  async loadMenus() {
    try {
      const tomorrow = new Date();
      // tomorrow.setDate(tomorrow.getDate() + 1);
      this.menus = await this.menuService.getMenusForDate(tomorrow);
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
      // Obtener el usuario actual
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        await this.showToast('Debes iniciar sesión para realizar pedidos', 'warning');
        return;
      }

      if (!this.canOrder(menu)) {
        await this.showToast('No se pueden realizar pedidos para este menú', 'warning');
        return;
      }

      const alert = await this.alertController.create({
        header: 'Confirmar pedido',
        message: `¿Deseas ordenar el menú "${menu.name}"?
                 Precio: S/${menu.price}`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Ordenar',
            handler: async () => {
              try {
                // Crear la orden con el ID del usuario
                await this.orderService.createOrder(
                  menu.id!, 
                  menu.date, // Usar la fecha del menú
                  false, // No es orden de emergencia
                  currentUser.id // Añadir el ID del usuario
                );
                
                await this.showToast('Pedido realizado con éxito');
                await this.loadMenus();
              } catch (error: any) {
                let message = 'Error al realizar el pedido';
                if (error.message) {
                  message = error.message;
                }
                await this.showToast(message, 'danger');
              }
            }
          }
        ]
      });

      await alert.present();
    } catch (error) {
      await this.showToast('Error inesperado', 'danger');
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