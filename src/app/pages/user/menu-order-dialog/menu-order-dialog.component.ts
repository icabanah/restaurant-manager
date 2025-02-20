import { Component, Input } from '@angular/core';
import { MenuDish, Menu } from 'src/app/shared/interfaces/models';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { MenuPriceService } from 'src/app/services/menu-price.service';
import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonRadio,
  IonContent,
  IonItem,
  IonLabel,
  IonItemGroup,
  IonItemDivider,
  IonRadioGroup,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-order-dialog',
  templateUrl: './menu-order-dialog.component.html',
  styleUrls: ['./menu-order-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonButton,
    IonButtons,
    IonRadio,
    IonContent,
    IonItem,
    IonLabel,
    IonItemGroup,
    IonItemDivider,
    IonRadioGroup,
    IonText,
    IonHeader,
    IonToolbar,
    IonTitle,
  ]
})
export class MenuOrderDialogComponent {
  @Input() menu!: Menu;
  orderForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private menuPriceService: MenuPriceService,
    private modalCtrl: ModalController
  ) {
    this.orderForm = this.fb.group({
      starter: ['none'],
      mainCourse: ['none'],
      beverage: ['', Validators.required],
      dessert: ['none']
    });
  }

  getDishesByCategory(category: string): MenuDish[] {
    return this.menu.dishes.filter(dish => dish.category === category);
  }

  hasDeserts(): boolean {
    return this.getDishesByCategory('postre').length > 0;
  }

  calculateTotal(): number {
    const hasStarter = this.orderForm.get('starter')?.value !== 'none';
    const hasMainCourse = this.orderForm.get('mainCourse')?.value !== 'none';

    if (hasStarter && hasMainCourse) {
      return 11; // Entrada + Fondo
    } else if (hasMainCourse) {
      return 11; // Solo Fondo (dieta)
    } else if (hasStarter) {
      return 10; // Solo Entrada
    }
    return 0;
  }

  isValidOrder(): boolean {
    const hasStarter = this.orderForm.get('starter')?.value !== 'none';
    const hasMainCourse = this.orderForm.get('mainCourse')?.value !== 'none';
    const hasBeverage = this.orderForm.get('beverage')?.value !== '';

    return (hasStarter || hasMainCourse) && hasBeverage;
  }

  async confirmOrder() {
    if (!this.isValidOrder()) return;

    const selectedDishes: MenuDish[] = [];

    // Agregar entrada seleccionada
    const starterId = this.orderForm.get('starter')?.value;
    if (starterId !== 'none') {
      const starter = this.menu.dishes.find(d => d.dishId === starterId);
      if (starter) selectedDishes.push({ ...starter, quantity: 1 });
    }

    // Agregar plato principal seleccionado
    const mainCourseId = this.orderForm.get('mainCourse')?.value;
    if (mainCourseId !== 'none') {
      const mainCourse = this.menu.dishes.find(d => d.dishId === mainCourseId);
      if (mainCourse) selectedDishes.push({ ...mainCourse, quantity: 1 });
    }

    // Agregar bebida (obligatoria)
    const beverageId = this.orderForm.get('beverage')?.value;
    const beverage = this.menu.dishes.find(d => d.dishId === beverageId);
    if (beverage) selectedDishes.push({ ...beverage, quantity: 1 });

    // Agregar postre si fue seleccionado
    const dessertId = this.orderForm.get('dessert')?.value;
    if (dessertId !== 'none') {
      const dessert = this.menu.dishes.find(d => d.dishId === dessertId);
      if (dessert) selectedDishes.push({ ...dessert, quantity: 1 });
    }

    await this.modalCtrl.dismiss({
      dishes: selectedDishes,
      total: this.calculateTotal()
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}
