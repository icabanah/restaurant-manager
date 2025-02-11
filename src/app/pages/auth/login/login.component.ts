// src/app/pages/auth/login/login.component.ts
import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { 
  IonButton, 
  IonIcon, 
  IonSpinner,
  IonText,
  IonInput,
  IonContent,
  IonLabel,
  IonItem,
  IonList,
  IonAlert,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle, mailOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonInput,
    IonContent,
    IonLabel,
    IonItem,
    // IonList,
    IonAlert
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  showResetPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({ logoGoogle, mailOutline, lockClosedOutline });

    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{6,}$')
      ]]
    });

    // Suscribirse a cambios en el estado de autenticación
    effect(() => {
      this.isLoading = this.authService.isLoading();
      const error = this.authService.error();
      if (error) {
        this.errorMessage = error;
        this.showError(error);
      }
    });
  }

  async onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      const { email, password } = this.loginForm.value;
      
      try {
        await this.authService.login(email, password);
        await this.showToast('Inicio de sesión exitoso', 'success');
        // La redirección la maneja el guard
      } catch (error: any) {
        this.loginForm.get('password')?.reset();
        if (error.code === 'auth/too-many-requests') {
          this.showResetPassword = true;
        }
      }
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  async loginWithGoogle() {
    if (this.isLoading) return;
    
    try {
      await this.authService.loginWithGoogle();
      await this.showToast('Inicio de sesión con Google exitoso', 'success');
    } catch (error) {
      // El servicio ya maneja los errores
    }
  }

  async resetPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      await this.showToast('Por favor, ingresa tu email', 'warning');
      return;
    }

    try {
      await this.authService.resetPassword(email);
      await this.showToast(
        'Se ha enviado un correo para restablecer tu contraseña', 
        'success'
      );
      this.showResetPassword = false;
    } catch (error) {
      // El servicio ya maneja los errores
    }
  }

  // Helpers para el formulario
  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);
    if (!control?.errors || !control.touched) return '';

    const errors = control.errors;
    if (errors['required']) return `El ${controlName} es requerido`;
    if (errors['email']) return 'El email no es válido';
    if (errors['pattern']) {
      if (controlName === 'email') return 'El email no tiene un formato válido';
      if (controlName === 'password') {
        return 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
      }
    }
    if (errors['minlength']) {
      return `El ${controlName} debe tener al menos ${errors['minlength'].requiredLength} caracteres`;
    }
    
    return 'Campo inválido';
  }

  private markFormGroupTouched(formGroup: FormGroup) { // Marcar todos los controles como tocados
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  private async showToast(
    message: string, 
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{
        text: 'Cerrar',
        role: 'cancel'
      }]
    });
    await toast.present();
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger',
      position: 'top',
      buttons: [{
        text: 'Cerrar',
        role: 'cancel'
      }]
    });
    await toast.present();
  }

  // Computed properties para validaciones
  get isEmailInvalid(): boolean {
    const control = this.loginForm.get('email');
    return !!control?.errors && control.touched;
  }

  get isPasswordInvalid(): boolean {
    const control = this.loginForm.get('password');
    return !!control?.errors && control.touched;
  }

  get emailErrorMessage(): string {
    return this.getErrorMessage('email');
  }

  get passwordErrorMessage(): string {
    return this.getErrorMessage('password');
  }

  get isFormInvalid(): boolean {
    return !this.loginForm.valid || this.isLoading;
  }

  // Botones para el alert de reset password
  resetPasswordButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => { this.showResetPassword = false; }
    },
    {
      text: 'Aceptar',
      handler: () => this.resetPassword()
    }
  ];

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  openResetPassword(): void {
    this.showResetPassword = true;
  }
}