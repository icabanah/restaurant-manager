// shared/interfaces/models.ts

// Mantener las interfaces existentes
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
  lastLogin: Date;
  failedLoginAttempts: number;
  locked: boolean;
  createdAt?: Date;
}

// Interfaz para los platillos en el menú
export interface MenuDish {
  dishId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
}

// Actualización de la interfaz Menu
export interface Menu {
  id?: string;
  name: string;
  description: string;
  date: Date;
  price: number;
  active: boolean;
  orderDeadline: Date;
  status: 'accepting_orders' | 'closed' | 'confirmed';
  currentOrders: number;
  dishes: MenuDish[];  // Nueva propiedad
}

export interface Order {
  id: string;
  userId: string;
  menuId: string;
  orderDate: Date;
  consumptionDate: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'emergency';
  qrCode: string;
  isEmergency: boolean;
  selectedDishes: MenuDish[];
  cost: {
    total: number;
    companyShare: number;
    employeeShare: number;
  };
}

export interface Dish {
  id?: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  category: string;
  lastUsed?: Date;
  timesUsed?: number;
}