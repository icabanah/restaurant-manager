// src/app/services/date.service.ts
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  /**
   * Convierte una fecha local a UTC para almacenamiento
   */
  toUTCDate(date: Date): Date {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    ));
  }

  /**
   * Obtiene el inicio del día en UTC
   */
  getStartOfDay(date: Date): Date {
    const start = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    ));
    return start;
  }

  /**
   * Obtiene el fin del día en UTC
   */
  getEndOfDay(date: Date): Date {
    const end = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23, 59, 59, 999
    ));
    return end;
  }

  /**
   * Convierte una fecha de Firestore a fecha local
   */
  fromFirestore(timestamp: any): Date {
    if (!timestamp) return new Date();
    const date = timestamp.toDate();
    return new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }

  /**
   * Calcula la fecha límite de pedidos (17:00 del día anterior)
   */
  // calculateOrderDeadline(menuDate: Date): Date {
  //   const deadline = this.toUTCDate(new Date(menuDate));
  //   deadline.setUTCDate(deadline.getUTCDate() - 1);
  //   deadline.setUTCHours(23, 59, 0, 0);
  //   return deadline;
  // }

  calculateOrderDeadline(menuDate: Date): Date {
    // Creamos una nueva fecha para no modificar la original
    const deadline = new Date(menuDate);

    // Retrocedemos un día
    deadline.setDate(deadline.getDate() - 1);

    // Establecemos la hora a 23:59:59.999
    deadline.setHours(23, 59, 59, 999);

    return deadline;
  }
}