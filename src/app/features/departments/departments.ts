import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartmentService } from '../../core/services/department.service';
import { EmployeeService } from '../../core/services/employee.service';
import { DepartmentModel, CreateDepartment, UpdateDepartment } from '../../core/models/department.model';
import { EmployeeModel } from '../../core/models/employee.model';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './departments.html',
  styles: []
})
export class Departments implements OnInit {
  private readonly departmentService = inject(DepartmentService);
  private readonly employeeService = inject(EmployeeService);
  private readonly router = inject(Router);

  // Core Data Signals
  departments = signal<DepartmentModel[]>([]);
  allEmployees = signal<EmployeeModel[]>([]);
  isLoading = signal<boolean>(true);

  // Filters
  searchTerm = signal<string>('');
  statusFilter = signal<string>('all');

  // Add/Edit Modal State
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<string | null>(null);

  // Form State
  formName = signal<string>('');
  formCode = signal<string>('');
  formHead = signal<string>('');
  formDescription = signal<string>('');
  formLocation = signal<string>('');
  formBudget = signal<number>(0);
  formStatus = signal<'Activo' | 'Inactivo'>('Activo');

  // Personnel Modal State
  selectedDepartment = signal<DepartmentModel | null>(null);
  departmentEmployees = signal<EmployeeModel[]>([]);
  isEmployeesModalOpen = signal<boolean>(false);
  isLoadingEmployees = signal<boolean>(false);
  employeeSearchTerm = signal<string>('');

  // Delete Confirmation Modal State
  deleteConfirmDept = signal<DepartmentModel | null>(null);
  isDeleteModalOpen = signal<boolean>(false);

  // Feedback Notification
  notification = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Computed Properties
  filteredDepartments = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const status = this.statusFilter();

    return this.departments().filter(dept => {
      const matchesSearch = !search ||
        dept.name.toLowerCase().includes(search) ||
        dept.code.toLowerCase().includes(search) ||
        (dept.head_of_department && dept.head_of_department.toLowerCase().includes(search)) ||
        (dept.location && dept.location.toLowerCase().includes(search));

      const matchesStatus = status === 'all' ||
        (status === 'active' && (dept.status === 'Activo' || !dept.status)) ||
        (status === 'inactive' && dept.status === 'Inactivo');

      return matchesSearch && matchesStatus;
    });
  });

  totalEmployeesCount = computed(() => {
    const totalFromEmployeesList = this.allEmployees().length;
    const totalFromDepts = this.departments().reduce((sum, d) => sum + (d.employee_count || 0), 0);
    return Math.max(totalFromEmployeesList, totalFromDepts);
  });

  totalBudget = computed(() => {
    return this.departments().reduce((sum, d) => sum + (d.budget || 0), 0);
  });

  activeDepartmentsCount = computed(() => {
    return this.departments().filter(d => d.status === 'Activo' || !d.status).length;
  });

  filteredDepartmentEmployees = computed(() => {
    const search = this.employeeSearchTerm().toLowerCase().trim();
    if (!search) return this.departmentEmployees();
    return this.departmentEmployees().filter(emp =>
      emp.full_name.toLowerCase().includes(search) ||
      emp.job_title.toLowerCase().includes(search) ||
      (emp.work_email && emp.work_email.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);

    this.departmentService.getDepartments().subscribe({
      next: (depts) => {
        this.departments.set(depts);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching departments', err);
        this.showNotification('error', 'Error al cargar los departamentos.');
        this.isLoading.set(false);
      }
    });

    this.employeeService.getEmployees().subscribe({
      next: (emps) => {
        this.allEmployees.set(emps);
      },
      error: (err) => {
        console.error('Error fetching employees', err);
      }
    });
  }

  getRealEmployeeCount(deptName: string, fallbackCount: number): number {
    if (!this.allEmployees().length) return fallbackCount || 0;
    const matched = this.allEmployees().filter(e =>
      e.department?.toLowerCase().trim() === deptName.toLowerCase().trim()
    );
    return matched.length > 0 ? matched.length : (fallbackCount || 0);
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.editingId.set(null);
    this.formName.set('');
    this.formCode.set('');
    this.formHead.set('');
    this.formDescription.set('');
    this.formLocation.set('Sede Principal - Piso 1');
    this.formBudget.set(50000);
    this.formStatus.set('Activo');
    this.isModalOpen.set(true);
  }

  openEditModal(dept: DepartmentModel): void {
    this.isEditing.set(true);
    this.editingId.set(dept.id);
    this.formName.set(dept.name);
    this.formCode.set(dept.code);
    this.formHead.set(dept.head_of_department || '');
    this.formDescription.set(dept.description || '');
    this.formLocation.set(dept.location || 'Sede Principal');
    this.formBudget.set(dept.budget || 0);
    this.formStatus.set(dept.status || 'Activo');
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveDepartment(): void {
    const name = this.formName().trim();
    const code = this.formCode().trim().toUpperCase();

    if (!name || !code) {
      this.showNotification('error', 'Por favor complete el nombre y el código del departamento.');
      return;
    }

    if (this.isEditing() && this.editingId()) {
      const payload: UpdateDepartment = {
        id: this.editingId()!,
        name: name,
        code: code,
        head_of_department: this.formHead().trim() || 'Sin asignar',
        description: this.formDescription().trim(),
        location: this.formLocation().trim(),
        budget: Number(this.formBudget()) || 0,
        status: this.formStatus(),
        employee_count: this.getRealEmployeeCount(name, 0)
      };

      this.departmentService.updateDepartment(this.editingId()!, payload).subscribe({
        next: () => {
          this.showNotification('success', 'Departamento actualizado con éxito.');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error updating department', err);
          this.showNotification('error', 'Error al actualizar el departamento.');
        }
      });
    } else {
      const payload: CreateDepartment = {
        name: name,
        code: code,
        head_of_department: this.formHead().trim() || 'Sin asignar',
        description: this.formDescription().trim(),
        location: this.formLocation().trim(),
        budget: Number(this.formBudget()) || 0,
        status: this.formStatus(),
        employee_count: 0
      };

      this.departmentService.createDepartment(payload).subscribe({
        next: () => {
          this.showNotification('success', 'Departamento creado correctamente.');
          this.closeModal();
          this.loadData();
        },
        error: (err) => {
          console.error('Error creating department', err);
          this.showNotification('error', 'Error al crear el departamento.');
        }
      });
    }
  }

  openDeleteModal(dept: DepartmentModel): void {
    this.deleteConfirmDept.set(dept);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
    this.deleteConfirmDept.set(null);
  }

  confirmDeleteDepartment(): void {
    const dept = this.deleteConfirmDept();
    if (!dept) return;

    this.departmentService.deleteDepartment(dept.id).subscribe({
      next: () => {
        this.showNotification('success', `Departamento "${dept.name}" eliminado correctamente.`);
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err) => {
        console.error('Error deleting department', err);
        this.showNotification('error', 'No se pudo eliminar el departamento.');
      }
    });
  }

  openEmployeesModal(dept: DepartmentModel): void {
    this.selectedDepartment.set(dept);
    this.isLoadingEmployees.set(true);
    this.employeeSearchTerm.set('');
    this.isEmployeesModalOpen.set(true);

    this.employeeService.getEmployees({ department: dept.name }).subscribe({
      next: (emps) => {
        if (emps && emps.length > 0) {
          this.departmentEmployees.set(emps);
        } else {
          // Fallback filter locally if backend filter returns empty due to casing or substring
          const localEmps = this.allEmployees().filter(e =>
            e.department?.toLowerCase().trim() === dept.name.toLowerCase().trim()
          );
          this.departmentEmployees.set(localEmps);
        }
        this.isLoadingEmployees.set(false);
      },
      error: (err) => {
        console.error('Error fetching department employees', err);
        const localEmps = this.allEmployees().filter(e =>
          e.department?.toLowerCase().trim() === dept.name.toLowerCase().trim()
        );
        this.departmentEmployees.set(localEmps);
        this.isLoadingEmployees.set(false);
      }
    });
  }

  closeEmployeesModal(): void {
    this.isEmployeesModalOpen.set(false);
    this.selectedDepartment.set(null);
    this.departmentEmployees.set([]);
  }

  navigateToEmployeeList(deptName: string): void {
    this.closeEmployeesModal();
    this.router.navigate(['/employees'], { queryParams: { department: deptName } });
  }

  showNotification(type: 'success' | 'error', message: string): void {
    this.notification.set({ type, message });
    setTimeout(() => {
      this.notification.set(null);
    }, 4000);
  }
}
