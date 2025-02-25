// order-menu-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonContent,
  IonItemDivider,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonItem,
  IonNote,
  IonText,
  ModalController,
  ToastController
} from '@ionic/angular/standalone';
import { MenuPriceService } from '../../../services/menu-price.service';
import { Menu, MenuDish } from '../../../shared/interfaces/models';

interface OrderFormModel {
  starter: string;
  mainCourse: string;
  beverage: string;
  dessert: string;
}

@Component({
  selector: 'app-order-menu-modal',
  templateUrl: './order-menu-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonTitle,
    IonContent,
    IonItemDivider,
    IonLabel,
    IonRadioGroup,
    IonRadio,
    IonItem,
    IonNote,
    IonText
  ]
})
export class OrderMenuModalComponent implements OnInit {
  @Input() menu!: Menu;

  orderForm: FormGroup = this.formBuilder.group({
    starter: ['none'],
    mainCourse: ['none'],
    beverage: ['', [Validators.required]],
    dessert: ['none']
  });

  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private menuPriceService: MenuPriceService,
    private toastController: ToastController
  ) {}
    

  ngOnInit(): void {
    // Si necesitamos realizar alguna inicialización adicional
    this.validateMenuInput();
  }

  private validateMenuInput(): void {
    if (!this.menu || !this.menu.dishes || this.menu.dishes.length === 0) {
      console.error('Menu input is invalid or empty');
      this.dismiss();
    }
  }

  getDishesByCategory(category: string): MenuDish[] {
    return this.menu.dishes.filter(dish => dish.category === category);
  }

  hasDeserts(): boolean {
    return this.getDishesByCategory('postre').length > 0;
  }

  calculateTotal(): number {
    const selectedDishes = this.getSelectedDishes();
    return this.menuPriceService.calculateMenuPrice(selectedDishes);
  }

  isValidOrder(): boolean {
    if (!this.orderForm.valid) return false;

    const hasStarter = this.orderForm.get('starter')?.value !== 'none';
    const hasMainCourse = this.orderForm.get('mainCourse')?.value !== 'none';
    const hasBeverage = this.orderForm.get('beverage')?.value !== '';

    return (hasStarter || hasMainCourse) && hasBeverage;
  }

  private getSelectedDishes(): MenuDish[] {
    const selectedDishes: MenuDish[] = [];
    const formValues = this.orderForm.value;

    // Procesar cada selección del formulario
    Object.entries(formValues).forEach(([key, dishId]) => {
      if (dishId && dishId !== 'none') {
        const dish = this.menu.dishes.find(d => d.dishId === dishId);
        if (dish) {
          selectedDishes.push({ ...dish, quantity: 1 });
        }
      }
    });

    return selectedDishes;
  }

  async confirmOrder(): Promise<void> {
    if (!this.isValidOrder()) {
      await this.showToast(
        'Por favor selecciona al menos un plato principal o entrada, y una bebida',
        'warning'
      );
      return;
    }

    const selectedDishes = this.getSelectedDishes();
    const orderValidation = this.menuPriceService.validateMenuComposition(selectedDishes);

    if (!orderValidation.isValid) {
      await this.showToast(orderValidation.message, 'warning');
      return;
    }

    await this.modalCtrl.dismiss({
      confirmed: true,
      dishes: selectedDishes,
      total: this.calculateTotal()
    });
  }

  async dismiss(): Promise<void> {
    await this.modalCtrl.dismiss({
      confirmed: false
    });
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}