import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonBadge,
  IonText,
  ToastController,
  AlertController,
  IonListHeader
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MenuService } from '../../../services/menu.service';
import { CommonModule } from '@angular/common';
import { inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { refreshOutline, createOutline, trashOutline } from 'ionicons/icons';
import { Menu } from 'src/app/shared/interfaces/models';

@Component({
  selector: 'app-menu-management',
  templateUrl: './menu-management.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonToggle,
    IonBadge,
    IonText,
    IonListHeader
    // IonDatetime
  ]
})
export class MenuManagementComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private menuService = inject(MenuService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  menuForm: FormGroup = this.formBuilder.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    date: ['', Validators.required],
    price: ['', [Validators.required, Validators.min(0), Validators.pattern(/^\d*\.?\d*$/)]],
    active: [true]
  });

  menus: Menu[] = [];
  isEditing = false;
  currentMenuId: string | null = null;

  constructor() {
    addIcons({ refreshOutline, createOutline, trashOutline });
  }

  async ngOnInit() {
    await this.loadMenus();
  }

  // Métodos públicos para el template
  canFullyEdit(menu: Menu): boolean {
    return this.menuService.canFullyEdit(menu);
  }

  canDelete(menu: Menu): boolean {
    return this.menuService.canDelete(menu);
  }

  async loadMenus() {
    try {
      const today = new Date();
      this.menus = await this.menuService.getMenusForDate(today);
    } catch (error) {
      await this.showToast('Error al cargar menús', 'danger');
    }
  }

  async onSubmit() {
    if (this.menuForm.valid) {
      try {
        const menuData = {
          ...this.menuForm.value,
          date: new Date(this.menuForm.value.date)
        };

        if (this.isEditing && this.currentMenuId) {
          await this.menuService.updateMenu(this.currentMenuId, menuData);
          await this.showToast('Menú actualizado correctamente');
        } else {
          await this.menuService.createMenu(menuData);
          await this.showToast('Menú creado correctamente');
        }

        this.menuForm.reset({ active: true });
        this.isEditing = false;
        this.currentMenuId = null;
        await this.loadMenus();
      } catch (error) {
        await this.showToast('Error al guardar el menú', 'danger');
      }
    }
  }

  editMenu(menu: Menu) {
    if (!menu.id) {
      console.error('Menu sin ID');
      return;
    }

    this.isEditing = true;
    this.currentMenuId = menu.id;
    this.menuForm.patchValue({
      name: menu.name,
      description: menu.description,
      date: menu.date.toISOString().split('T')[0],
      price: menu.price,
      active: menu.active
    });
  }

  async deleteMenu(menu: Menu) {
    if (!menu.id) return;

    if (!this.menuService.canDelete(menu)) {
      await this.showToast('No se puede eliminar un menú que ya tiene pedidos', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el menú "${menu.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.menuService.deleteMenu(menu.id!);
              await this.showToast('Menú eliminado correctamente');
              await this.loadMenus();
            } catch (error) {
              await this.showToast('Error al eliminar el menú', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
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