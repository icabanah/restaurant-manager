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
    // Obtenemos los componentes de la fecha local
    const limaDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Lima' }));
    const year = limaDate.getFullYear();
    const month = limaDate.getMonth();
    const day = limaDate.getDate();

    // Creamos una fecha UTC para la medianoche del día en Lima
    // Cuando son las 00:00 en UTC, son las 19:00 del día anterior en Lima
    // Por lo tanto, sumamos un día para mantener la fecha calendario de Lima
    return new Date(Date.UTC(
      year,
      month,
      day + 1, // Sumamos un día, porque Date.UTC crea la fecha a las 00:00 UTC
      0,
      0,
      0,
      0
    ));
  }

  /**
 * Obtiene la fecha anterior válida (sin contar fines de semana)
 */
  setYesterday(date: Date): Date {
    const previous = new Date(date); // Creamos una nueva instancia para no modificar la original
    previous.setDate(previous.getDate() - 1);
    previous.setHours(0, 0, 0, 0);

    // Si cae en domingo, retrocedemos al viernes
    if (previous.getDay() === 0) { // 0 = domingo
      previous.setDate(previous.getDate() - 2);
    }
    // Si cae en sábado, retrocedemos al viernes
    else if (previous.getDay() === 6) { // 6 = sábado
      previous.setDate(previous.getDate() - 1);
    }

    return previous;
  }

  /**
 * Obtiene la fecha siguiente válida (sin contar fines de semana)
 */
  setTomorrow(date: Date): Date {
    const next = new Date(date); // Creamos una nueva instancia para no modificar la original
    next.setDate(next.getDate() + 1);
    next.setHours(23, 59, 59, 0);

    // Si cae en sábado, avanzamos al lunes
    if (next.getDay() === 6) { // 6 = sábado
      next.setDate(next.getDate() + 2);
    }
    // Si cae en domingo, avanzamos al lunes
    else if (next.getDay() === 0) { // 0 = domingo
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Obtiene el inicio del día en UTC
   */
  getStartOfDay(date: Date): Date {
    return this.toUTCDate(date);
  }

  /**
   * Obtiene el fin del día en UTC
   */
  getEndOfDay(date: Date): Date {
    const end = this.toUTCDate(date);
    end.setUTCHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Convierte una fecha de Firestore a fecha local
   */
  fromFirestore(timestamp: any): Date {
    if (!timestamp) return new Date();
    return timestamp.toDate();
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
    const deadline = this.toUTCDate(new Date(menuDate));

    // Retrocedemos un día
    deadline.setDate(deadline.getDate() - 1);

    // Establecemos la hora a 23:59:59.999
    deadline.setHours(23, 59, 59, 999);

    return deadline;
  }

  isBeforeDeadline(date: Date, deadline: Date): boolean {
    return date <= deadline;
  }

  formatDisplayDate(date: Date): string {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getDaysBetween(date1: Date, date2: Date): number {
    const diff = Math.abs(date2.getTime() - date1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }
}