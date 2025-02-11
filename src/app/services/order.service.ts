import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc 
} from '@angular/fire/firestore';

export interface Order {
  id: string;
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

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);

  async createOrder(menuId: string, consumptionDate: Date, isEmergency = false): Promise<string> {
    const orderData: Omit<Order, 'id'> = {
      menuId,
      orderDate: new Date(),
      consumptionDate,
      status: isEmergency ? 'emergency' : 'pending',
      qrCode: this.generateQRCode(),
      isEmergency,
      cost: {
        total: 0,
        companyShare: 0,
        employeeShare: 0
      }
    };

    const docRef = await addDoc(collection(this.firestore, 'orders'), orderData);
    return docRef.id;
  }

  async getOrders(): Promise<Order[]> {
    const q = query(collection(this.firestore, 'orders'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Order, 'id'>,
      orderDate: doc.data()['orderDate'].toDate(),
      consumptionDate: doc.data()['consumptionDate'].toDate()
    }));
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(this.firestore, 'orders', orderId);
    await updateDoc(orderRef, { status });
  }

  private generateQRCode(): string {
    return `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}