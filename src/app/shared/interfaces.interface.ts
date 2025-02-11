// shared/interfaces/models.ts
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

  export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    active: boolean;
  }