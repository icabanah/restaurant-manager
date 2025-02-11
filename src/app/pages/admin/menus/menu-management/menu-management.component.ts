// menu-management.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  IonItemDivider,
  IonLabel,
  IonInput,
  IonTextarea,
  IonToggle,
  IonBadge,
  IonText,
  IonListHeader,
  ToastController,
  AlertController,
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonSkeletonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  refreshOutline, 
  createOutline, 
  trashOutline, 
  addOutline, 
  removeCircleOutline, 
  addCircleOutline 
} from 'ionicons/icons';
import { Dish, Menu } from 'src/app/shared/interfaces/models';
import { DishSelectorComponent } from '../../dish/dish-selector/dish-selector.component';
import { MenuService } from 'src/app/services/menu.service';
import { DishService } from 'src/app/services/dish.service';
import { MenuPriceService } from 'src/app/services/menu-price.service';

interface MenuDish {
  dish: Dish;
  quantity: number;
}

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
    IonItemDivider,
    IonLabel,
    IonInput,
    IonTextarea,
    IonToggle,
    IonBadge,
    IonText,
    IonListHeader,
    IonRefresher,
    IonRefresherContent,
    IonMenuButton,
    DishSelectorComponent,
    IonSkeletonText
  ]
})
export class MenuManagementComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private menuService = inject(MenuService);
  private dishService = inject(DishService);
  private menuPriceService = inject(MenuPriceService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private route = inject(ActivatedRoute);

  menuForm: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: '',
    date: ['', Validators.required],
    active: [true],
    price: [0]
  });
  menus: Menu[] = [];
  selectedDishes: MenuDish[] = [];
  isEmergencyMenu = false;
  isEditing = false;
  currentMenuId: string | null = null;
  showDishSelector = false;
  loading = false;

  constructor() {
    this.initializeIcons();
    this.checkRouteParams();
  }

  public initializeIcons() {
    addIcons({ 
      refreshOutline, 
      createOutline, 
      trashOutline,
      addOutline,
      removeCircleOutline,
      addCircleOutline
    });
  }

  private checkRouteParams() {
    this.route.queryParams.subscribe(params => {
      if (params['emergency']) {
        this.isEmergencyMenu = true;
        this.setupEmergencyMenu();
      }
      if (params['menuId']) {
        this.loadMenuForEditing(params['menuId']);
      }
    });
  }

  async ngOnInit() {
    await this.loadMenus();
  }

  canSubmitForm(): boolean {
    return this.menuForm.valid && this.selectedDishes.length > 0;
  }

  private setupEmergencyMenu() {
    const today = new Date();
    this.menuForm.patchValue({
      date: today.toISOString().split('T')[0],
      name: `Menú de Emergencia - ${today.toLocaleDateString()}`,
      description: 'Menú creado para atender pedidos de emergencia'
    });
  }

  async loadMenus() {
    this.loading = true;
    try {
      const today = new Date();
      this.menus = await this.menuService.getMenusForDate(today);
    } catch (error) {
      await this.showToast('Error al cargar menús', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async handleRefresh(event: any) {
    await this.loadMenus();
    event.target.complete();
  }

  async loadMenuForEditing(menuId: string) {
    try {
      const menu = this.menus.find(m => m.id === menuId);
      if (!menu) return;

      this.isEditing = true;
      this.currentMenuId = menuId;
      this.patchFormWithMenu(menu);
    } catch (error) {
      await this.showToast('Error al cargar el menú', 'danger');
    }
  }

  private patchFormWithMenu(menu: Menu) {
    this.menuForm.patchValue({
      name: menu.name,
      description: menu.description,
      date: menu.date.toISOString().split('T')[0],
      active: menu.active
    });

    this.selectedDishes = menu.dishes.map(dish => ({
      dish: {
        id: dish.dishId,
        name: dish.name,
        price: dish.price,
        category: dish.category,
        description: dish.description,
        active: true
      },
      quantity: dish.quantity
    }));

    this.updateTotalPrice();
  }

  async onSubmit() {
    if (!this.menuForm.valid || this.selectedDishes.length === 0) {
      await this.showValidationErrors();
      return;
    }

    // Validar la composición del menú
    const menuValidation = this.menuPriceService.validateMenuComposition(
      this.selectedDishes.map(item => ({
        dishId: item.dish.id!,
        name: item.dish.name,
        description: item.dish.description,
        price: item.dish.price,
        quantity: item.quantity,
        category: item.dish.category
      }))
    );

    if (!menuValidation.isValid) {
      await this.showToast(menuValidation.message, 'warning');
      return;
    }

    try {
      const menuData = this.prepareMenuData();
      
      if (this.isEditing && this.currentMenuId) {
        await this.menuService.updateMenu(this.currentMenuId, menuData);
        await this.showToast('Menú actualizado correctamente');
      } else {
        await this.menuService.createMenu(menuData);
        await this.showToast('Menú creado correctamente');
      }

      this.resetForm();
      await this.loadMenus();
    } catch (error) {
      await this.showToast('Error al guardar el menú', 'danger');
    }
  }

  private prepareMenuData(): Omit<Menu, 'id'> {
    return {
      ...this.menuForm.value,
      date: new Date(this.menuForm.value.date),
      dishes: this.selectedDishes.map(item => ({
        dishId: item.dish.id!,
        name: item.dish.name,
        description: item.dish.description,
        price: item.dish.price,
        quantity: item.quantity,
        category: item.dish.category
      })),
      price: this.calculateTotalPrice(),
      currentOrders: 0,
      status: this.isEmergencyMenu ? 'accepting_orders' : 'accepting_orders',
      orderDeadline: this.calculateOrderDeadline(new Date(this.menuForm.value.date))
    };
  }

  private calculateOrderDeadline(menuDate: Date): Date {
    const deadline = new Date(menuDate);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(17, 0, 0, 0);
    return deadline;
  }

  private calculateTotalPrice(): number {
    const menuDishes = this.selectedDishes.map(item => ({
      dishId: item.dish.id!,
      name: item.dish.name,
      description: item.dish.description,
      price: item.dish.price,
      quantity: item.quantity,
      category: item.dish.category
    }));

    return this.menuPriceService.calculateMenuPrice(menuDishes);
  }

  private async showValidationErrors() {
    if (this.selectedDishes.length === 0) {
      await this.showToast('Debe seleccionar al menos un platillo', 'warning');
    } else {
      await this.showToast('Por favor complete todos los campos requeridos', 'warning');
    }
  }

  // Dish Management Methods
  openDishSelector() {
    this.showDishSelector = true;
  }

  onDishSelected(dish: Dish) {
    const existingDish = this.selectedDishes.find(d => d.dish.id === dish.id);
    if (existingDish) {
      existingDish.quantity++;
    } else {
      this.selectedDishes = [...this.selectedDishes, { dish, quantity: 1 }];
    }
    this.updateTotalPrice();
  }

  isFormValid(): boolean {
    // Debug log para ver el estado del formulario
    console.log('Form valid:', this.menuForm.valid);
    console.log('Form values:', this.menuForm.value);
    console.log('Selected dishes:', this.selectedDishes.length);
    
    const isValid = this.menuForm.valid && this.selectedDishes.length > 0;
    console.log('Is form valid?', isValid);
    
    return isValid;
  }

  updateQuantity(index: number, increment: number) {
    const dish = this.selectedDishes[index];
    const newQuantity = dish.quantity + increment;
    
    if (newQuantity < 1) {
      this.removeDish(index);
    } else {
      dish.quantity = newQuantity;
      this.updateTotalPrice();
    }
  }

  removeDish(index: number) {
    this.selectedDishes.splice(index, 1);
    this.updateTotalPrice();
  }

  private updateTotalPrice() {
    const total = this.calculateTotalPrice();
    // Actualizamos el precio sin usar patchValue ya que no está disabled
    this.menuForm.get('price')?.setValue(total, { emitEvent: false });
  }

  // Menu Management Methods
  canFullyEdit(menu: Menu): boolean {
    return this.menuService.canFullyEdit(menu);
  }

  canDelete(menu: Menu): boolean {
    return this.menuService.canDelete(menu);
  }

  async deleteMenu(menu: Menu) {
    if (!menu.id || !this.canDelete(menu)) {
      await this.showToast('No se puede eliminar este menú', 'warning');
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

  resetForm() {
    this.menuForm.reset({ active: true });
    this.selectedDishes = [];
    this.isEditing = false;
    this.currentMenuId = null;
    this.isEmergencyMenu = false;
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