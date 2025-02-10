import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { IonicModule } from '@ionic/angular/standalone';
import {
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton, 
  IonIcon,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonToast,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonBadge,
  IonText
} from '@ionic/angular/standalone';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MenuService, Menu } from '../../../services/menu.service';
import { inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { checkmarkOutline, createOutline, refreshOutline, trashOutline, warningOutline } from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular';

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
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonToggle,
    // IonToast, 
    IonDatetimeButton,
    IonDatetime,
    IonModal,
    IonText,
    IonBadge,

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
    price: ['', [
      Validators.required,
      Validators.min(0),
      Validators.pattern(/^\d*\.?\d*$/)
    ]],
    maxOrders: ['', [
      Validators.required,
      Validators.min(1),
      Validators.pattern(/^\d+$/)
    ]],
    active: [true]
  });

  menus: Menu[] = [];
  isEditing = false; // Flag to determine if we are editing an existing menu
  currentMenuId: string | null = null;

  selectedDate = new Date().toISOString();

  constructor() {
    addIcons({
      refreshOutline, 
      createOutline, 
      trashOutline,
      warningOutline,
      checkmarkOutline
     });
  }

  // Método para mostrar mensajes
  private async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
      icon: color === 'success' ? 'checkmark-outline' : 'warning-outline'
    });
    await toast.present();
  }

  async ngOnInit() {
    console.log('Cargando menus...');
    await this.loadMenus();
  }

  async onDateChange(event: CustomEvent) {
    this.selectedDate = event.detail.value;
    await this.loadMenus(new Date(this.selectedDate));
  }
  
  async loadMenus(date: Date = new Date()) {
    try {
      this.menus = await this.menuService.getMenusForDate(date);
    } catch (error) {
      await this.showToast('Error al cargar los menús', 'danger');
    }
  }
  async onSubmit() {
    if (this.menuForm.valid) {
      try {
        const menuData = { // Convert form data to Menu object
          ...this.menuForm.value,
          date: new Date(this.menuForm.value.date)
        };

        if (this.isEditing && this.currentMenuId) { // Update existing menu
          await this.menuService.updateMenu(this.currentMenuId, menuData);
          await this.showToast('Menú actualizado correctamente');
        } else {
          await this.menuService.createMenu(menuData);
          await this.showToast('Menú creado correctamente');
        }

        this.menuForm.reset({ active: true }); // Reset form
        this.isEditing = false;
        this.currentMenuId = null;
        await this.loadMenus();
      } catch (error) {
        await this.showToast('Error al guardar el menú', 'danger');
      }
    }
  }

  async editMenu(menu: Menu) {
    if (!menu.id) {
      console.error('Menu must have an id to be edited', menu);
      return
    } // Menu must have an id to be edited

    this.isEditing = true;
    this.currentMenuId = menu.id;
    this.menuForm.patchValue({
      name: menu.name,
      description: menu.description,
      date: menu.date.toISOString().split('T')[0], // Convert Date object to string
      price: menu.price,
      maxOrders: menu.maxOrders,
      active: menu.active
    });
  }

  async deleteMenu(id: string) {
    if (!id) {
      console.error('Menu must have an id to be deleted');
      return
    } // Menu must have an id to be deleted

    try {
      await this.menuService.deleteMenu(id);
      await this.loadMenus(); // Reload menus
    } catch (error) {
      console.error('Error deleting menu', error);
    }
  }

  // Método para confirmar eliminación
  async confirmDelete(menu: Menu) {
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
          role: 'confirm',
          cssClass: 'danger',
          handler: async () => {
            try {
              await this.deleteMenu(menu.id!);
              await this.showToast('Menú eliminado correctamente');
            } catch (error) {
              await this.showToast('Error al eliminar el menú', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
