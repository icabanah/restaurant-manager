// src/app/services/menu-price.service.ts
import { Injectable } from '@angular/core';
import { MenuDish } from '../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class MenuPriceService {
  private readonly FULL_MENU_PRICE = 11; // Entrada + Fondo
  private readonly MAIN_COURSE_PRICE = 11; // Solo Fondo (dieta)
  private readonly STARTER_PRICE = 10; // Solo Entrada

  calculateMenuPrice(dishes: MenuDish[]): number {
    const hasStarter = dishes.some(dish => dish.category === 'entrada');
    const hasMainCourse = dishes.some(dish => dish.category === 'fondo');
    const hasDessert = dishes.some(dish => dish.category === 'postre');

    // El precio base depende de la combinación de platos
    let basePrice = 0;
    if (hasStarter && hasMainCourse) {
      basePrice = this.FULL_MENU_PRICE;
    } else if (hasMainCourse) {
      basePrice = this.MAIN_COURSE_PRICE;
    } else if (hasStarter) {
      basePrice = this.STARTER_PRICE;
    }

    // Sumar el precio del postre si está incluido
    const dessertPrice = hasDessert ?
      dishes.filter(dish => dish.category === 'postre')
        .reduce((sum, dish) => sum + (dish.price * dish.quantity), 0) : 0;

    return basePrice + dessertPrice;
  }

  validateMenuComposition(dishes: MenuDish[]): {
    isValid: boolean;
    message: string
  } {
    const categories = new Set(dishes.map(dish => dish.category));
    const hasBeverage = dishes.some(dish => dish.category === 'bebida');

    if (!hasBeverage) {
      return {
        isValid: false,
        message: 'El menú debe incluir una bebida'
      };
    }

    const hasMainOrStarter = dishes.some(dish =>
      dish.category === 'fondo' || dish.category === 'entrada'
    );

    if (!hasMainOrStarter) {
      return {
        isValid: false,
        message: 'El menú debe incluir al menos una entrada o un plato de fondo'
      };
    }

    return { isValid: true, message: '' };
  }
}