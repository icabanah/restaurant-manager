// shared/interfaces/models.ts

// User actualizado
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  active: boolean;
  lastLogin: Date;          // Nuevo campo
  failedLoginAttempts: number;  // Nuevo campo
  locked: boolean;          // Nuevo campo
  createdAt?: Date;         // Nuevo campo opcional
}

// Los otros interfaces permanecen igual
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
  cost: {
    total: number;
    companyShare: number;
    employeeShare: number;
  };
}