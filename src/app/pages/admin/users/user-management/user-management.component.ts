import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonBadge,
  IonToggle,
  IonButtons,
  IonText,
  AlertController,
  ToastController,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonListHeader
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createOutline, trashOutline, refreshOutline } from 'ionicons/icons';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/interfaces/models';
import { LogoutButtonComponent } from 'src/app/shared/logout-button/logout-button.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonBadge,
    IonToggle,
    IonButtons,
    IonText,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonListHeader,
    LogoutButtonComponent
  ]
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  isLoading = false;
  isEditing = false;
  currentUserId: string | null = null;

  userForm: FormGroup = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    name: ['', [Validators.required, Validators.minLength(3)]],
    role: ['user', Validators.required],
    active: [true]
  });

  constructor() {
    addIcons({ createOutline, trashOutline, refreshOutline });
  }

  async ngOnInit() {
    await this.loadUsers();
  }

  async loadUsers() {
    try {
      this.isLoading = true;
      this.users = await this.userService.getAllUsers();
      this.filterUsers();
    } catch (error) {
      await this.showToast('Error al cargar usuarios', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  filterUsers() {
    if (!this.searchTerm.trim()) { // Si no hay término de búsqueda, mostrar todos los usuarios
      this.filteredUsers = [...this.users]; // Copiar el array para evitar mutaciones
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterUsers();
  }

  async onSubmit() {
    if (this.userForm.valid) {
      try {
        const userData = this.userForm.value;

        if (this.isEditing && this.currentUserId) {
          await this.userService.updateUser(this.currentUserId, userData);
          await this.showToast('Usuario actualizado correctamente');
        } else {
          await this.userService.createUser(userData);
          await this.showToast('Usuario creado correctamente');
        }

        this.resetForm();
        await this.loadUsers();
      } catch (error) {
        await this.showToast('Error al guardar el usuario', 'danger');
      }
    }
  }

  editUser(user: User) {
    this.isEditing = true;
    this.currentUserId = user.id;
    this.userForm.patchValue({
      email: user.email,
      name: user.name,
      role: user.role,
      active: user.active
    });
    // Deshabilitar edición de email en modo edición
    this.userForm.get('email')?.disable();
  }

  async deleteUser(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar al usuario "${user.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.userService.deleteUser(user.id);
              await this.showToast('Usuario eliminado correctamente');
              await this.loadUsers();
            } catch (error) {
              await this.showToast('Error al eliminar el usuario', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  resetForm() {
    this.userForm.reset({ role: 'user', active: true });
    this.userForm.get('email')?.enable();
    this.isEditing = false;
    this.currentUserId = null;
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