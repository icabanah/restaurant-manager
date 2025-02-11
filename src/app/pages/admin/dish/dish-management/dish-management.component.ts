// dish-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonBadge,
  IonToggle,
  IonButtons,
  IonMenuButton,
  IonText,
  AlertController,
  ToastController,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { DishService } from 'src/app/services/dish.service';
import { Dish } from 'src/app/shared/interfaces/models';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  createOutline, 
  trashOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-dish-management',
  templateUrl: './dish-management.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonMenuButton,
    IonIcon,
    IonBadge,
    IonToggle,
    IonButtons,
    IonText,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText
  ]
})
export class DishManagementComponent implements OnInit {
  private dishService = inject(DishService);
  private formBuilder = inject(FormBuilder);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  dishes: Dish[] = [];
  loading = false;
  isEditing = false;
  currentDishId: string | null = null;

  dishForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    price: ['', [Validators.required, Validators.min(0)]],
    category: ['fondo', Validators.required],
    active: [true]
  });

  constructor() {
    addIcons({ 
      refreshOutline, 
      createOutline, 
      trashOutline 
    });
  }

  async ngOnInit() {
    await this.loadDishes();
  }

  async loadDishes() {
    this.loading = true;
    try {
      this.dishes = await this.dishService.getActiveDishes();
    } catch (error) {
      console.error('Error loading dishes:', error);
      await this.showToast('Error al cargar platillos', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: any) {
    try {
      await this.loadDishes();
    } finally {
      event.target.complete();
    }
  }

  async onSubmit() {
    if (!this.dishForm.valid) {
      await this.showToast('Por favor complete todos los campos requeridos', 'warning');
      return;
    }

    try {
      if (this.isEditing && this.currentDishId) {
        await this.dishService.updateDish(this.currentDishId, this.dishForm.value);
        await this.showToast('Platillo actualizado correctamente');
      } else {
        await this.dishService.createDish(this.dishForm.value);
        await this.showToast('Platillo creado correctamente');
      }
      
      this.resetForm();
      await this.loadDishes();
    } catch (error) {
      console.error('Error saving dish:', error);
      await this.showToast('Error al guardar el platillo', 'danger');
    }
  }

  editDish(dish: Dish) {
    this.isEditing = true;
    this.currentDishId = dish.id!;
    this.dishForm.patchValue({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      active: dish.active
    });
  }

  async deleteDish(dish: Dish) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el platillo "${dish.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.dishService.deleteDish(dish.id!);
              await this.showToast('Platillo eliminado correctamente');
              await this.loadDishes();
            } catch (error) {
              console.error('Error deleting dish:', error);
              await this.showToast('Error al eliminar el platillo', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  resetForm() {
    this.dishForm.reset({
      category: 'fondo',
      active: true
    });
    this.isEditing = false;
    this.currentDishId = null;
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