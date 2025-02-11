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
import { AuthService } from './auth.service';
import { Order } from '../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  async createOrder(menuId: string, consumptionDate: Date, isEmergency = false): Promise<string> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const orderData: Omit<Order, 'id'> = {
      userId: user.id,
      menuId,
      orderDate: new Date(),
      consumptionDate,
      status: isEmergency ? 'emergency' : 'pending',
      qrCode: this.generateQRCode(),
      isEmergency,
      cost: {
        total: 0, // Se calculará basado en el menú
        companyShare: 0,
        employeeShare: 0
      }
    };

    const docRef = await addDoc(collection(this.firestore, 'orders'), orderData);
    return docRef.id;
  }

  async getUserOrders(): Promise<Order[]> {
    const user = this.authService.currentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const q = query(
      collection(this.firestore, 'orders'),
      where('userId', '==', user.id)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Order, 'id'>,
      orderDate: new Date(doc.data()['orderDate']),
      consumptionDate: new Date(doc.data()['consumptionDate'])
    }));
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(this.firestore, 'orders', orderId);
    await updateDoc(orderRef, { status });
  }

  async createEmergencyOrder(menuId: string): Promise<string> {
    return this.createOrder(menuId, new Date(), true);
  }

  private generateQRCode(): string { // Genera un código QR único
    const user = this.authService.currentUser();
    return `ORDER-${user?.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}