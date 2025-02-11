// Dish Selector Component Fix

// dish-selector.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonModal,
  IonList,
  IonItem,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonSearchbar,
  IonBadge,
  IonIcon
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';
import { DishService } from 'src/app/services/dish.service';
import { Dish } from 'src/app/shared/interfaces/models';

@Component({
  selector: 'app-dish-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonModal,
    IonList,
    IonItem,
    IonItemGroup,
    IonItemDivider,
    IonLabel,
    IonSearchbar,
    IonBadge,
    IonIcon
  ],
  templateUrl: './dish-selector.component.html',
})

export class DishSelectorComponent {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() dishSelected = new EventEmitter<Dish>();

  private dishService = inject(DishService);

  searchTerm = '';
  allDishes: Dish[] = [];
  filteredDishes: Dish[] = [];
  recentDishes: Dish[] = [];

  ngOnInit() {
    this.loadDishes();
  }

  async loadDishes() {
    try {
      // Cargar todos los platillos activos
      this.allDishes = await this.dishService.getActiveDishes();
      this.filteredDishes = [...this.allDishes];
      
      // Cargar platillos recientes
      this.recentDishes = await this.dishService.getRecentDishes();
    } catch (error) {
      console.error('Error loading dishes:', error);
    }
  }

  handleSearch(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredDishes = this.allDishes.filter(dish =>
      dish.name.toLowerCase().includes(query) ||
      dish.description.toLowerCase().includes(query)
    );
  }

  selectDish(dish: Dish) {
    this.dishSelected.emit(dish);
    this.handleDismiss();
  }

  handleDismiss() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.searchTerm = '';
    this.filteredDishes = [...this.allDishes];
  }
}