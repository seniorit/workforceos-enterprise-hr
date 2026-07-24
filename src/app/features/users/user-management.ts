import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import {
  SystemUser,
  UserRole,
  UserPermission,
  ROLE_OPTIONS,
  ALL_PERMISSIONS
} from '../../core/models/user.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.html'
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // Constants
  readonly roleOptions = ROLE_OPTIONS;
  readonly allPermissions = ALL_PERMISSIONS;

  // Signals
  users = signal<SystemUser[]>([]);
  isLoading = signal<boolean>(true);
  searchQuery = signal<string>('');
  roleFilter = signal<string>('all');
  statusFilter = signal<string>('all');

  // Modal / Form Signals
  isFormModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingUserId = signal<string | null>(null);
  selectedPermissions = signal<UserPermission[]>([]);
  isSaving = signal<boolean>(false);

  // Password Reset Modal Signals
  isResetModalOpen = signal<boolean>(false);
  selectedUserForReset = signal<SystemUser | null>(null);
  newPasswordInput = signal<string>('pass12345');
  resetMessage = signal<string>('');

  // Alerts
  successMessage = signal<string>('');
  errorMessage = signal<string>('');

  // Form Group
  userForm = this.fb.group({
    full_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    role: ['SUPERVISOR' as UserRole, [Validators.required]],
    department: ['General', [Validators.required]],
    status: ['Active' as 'Active' | 'Inactive', [Validators.required]],
    password: ['pass12345']
  });

  // Computed KPIs
  totalUsers = computed(() => this.users().length);
  activeUsers = computed(() => this.users().filter(u => u.status === 'Active').length);
  adminUsers = computed(() => this.users().filter(u => u.role === 'ADMIN').length);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers(this.searchQuery(), this.roleFilter(), this.statusFilter()).subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Error al cargar la lista de usuarios del sistema.');
      }
    });
  }

  onSearchOrFilterChange(): void {
    this.loadUsers();
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingUserId.set(null);
    this.userForm.reset({
      full_name: '',
      email: '',
      role: 'SUPERVISOR',
      department: 'General',
      status: 'Active',
      password: 'pass12345'
    });
    // Set default permissions for SUPERVISOR
    const supervisorOption = ROLE_OPTIONS.find(r => r.value === 'SUPERVISOR');
    this.selectedPermissions.set(supervisorOption ? [...supervisorOption.defaultPermissions] : []);
    this.isFormModalOpen.set(true);
  }

  openEditModal(user: SystemUser): void {
    this.isEditing.set(true);
    this.editingUserId.set(user.id);
    this.userForm.patchValue({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      department: user.department,
      status: user.status
    });
    this.selectedPermissions.set([...user.permissions]);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
  }

  onRoleChange(event: Event): void {
    const roleValue = (event.target as HTMLSelectElement).value as UserRole;
    const roleOpt = ROLE_OPTIONS.find(r => r.value === roleValue);
    if (roleOpt && !this.isEditing()) {
      this.selectedPermissions.set([...roleOpt.defaultPermissions]);
    }
  }

  togglePermission(permKey: UserPermission): void {
    const current = this.selectedPermissions();
    if (current.includes(permKey)) {
      this.selectedPermissions.set(current.filter(p => p !== permKey));
    } else {
      this.selectedPermissions.set([...current, permKey]);
    }
  }

  isPermissionSelected(permKey: UserPermission): boolean {
    return this.selectedPermissions().includes(permKey);
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const formVal = this.userForm.value;
    const userData: Partial<SystemUser> & { password?: string } = {
      full_name: formVal.full_name!,
      email: formVal.email!,
      role: formVal.role as UserRole,
      department: formVal.department!,
      status: formVal.status as 'Active' | 'Inactive',
      permissions: this.selectedPermissions(),
      password: formVal.password || 'pass12345'
    };

    if (this.isEditing() && this.editingUserId()) {
      this.userService.updateUser(this.editingUserId()!, userData).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.closeFormModal();
          this.successMessage.set(`Usuario "${updated.full_name}" actualizado exitosamente.`);
          this.loadUsers();
          
          // If editing self, update current user signal
          if (updated.id === this.authService.currentUser()?.id) {
            this.authService.updateCurrentUserData(updated);
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(typeof err === 'string' ? err : 'Error al actualizar usuario.');
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.closeFormModal();
          this.successMessage.set(`Usuario "${created.full_name}" creado exitosamente.`);
          this.loadUsers();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.errorMessage.set(typeof err === 'string' ? err : 'Error al crear usuario.');
        }
      });
    }
  }

  toggleUserStatus(user: SystemUser): void {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    this.userService.updateUser(user.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.successMessage.set(`Estado de "${updated.full_name}" cambiado a ${newStatus === 'Active' ? 'Activo' : 'Inactivo'}.`);
        this.loadUsers();
      },
      error: () => {
        this.errorMessage.set('Error al actualizar el estado del usuario.');
      }
    });
  }

  openResetModal(user: SystemUser): void {
    this.selectedUserForReset.set(user);
    this.newPasswordInput.set('pass12345');
    this.resetMessage.set('');
    this.isResetModalOpen.set(true);
  }

  closeResetModal(): void {
    this.isResetModalOpen.set(false);
    this.selectedUserForReset.set(null);
  }

  confirmResetPassword(): void {
    const user = this.selectedUserForReset();
    if (!user) return;

    this.userService.resetPassword(user.id, this.newPasswordInput()).subscribe({
      next: (res) => {
        this.resetMessage.set(res.message);
        setTimeout(() => this.closeResetModal(), 2000);
      },
      error: () => {
        this.resetMessage.set('Error al restablecer la contraseña.');
      }
    });
  }

  deleteUser(user: SystemUser): void {
    if (user.id === this.authService.currentUser()?.id) {
      alert('No puedes eliminar tu propio usuario en uso.');
      return;
    }

    if (confirm(`¿Está seguro de eliminar al usuario "${user.full_name}"? Esta acción no se puede deshacer.`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.successMessage.set(`Usuario "${user.full_name}" eliminado.`);
          this.loadUsers();
        },
        error: () => {
          this.errorMessage.set('Error al eliminar usuario.');
        }
      });
    }
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'HR_MANAGER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAYROLL_ADMIN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUPERVISOR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  getRoleLabel(role: UserRole): string {
    const opt = ROLE_OPTIONS.find(r => r.value === role);
    return opt ? opt.label : role;
  }
}
