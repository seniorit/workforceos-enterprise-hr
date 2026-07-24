import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../core/services/employee.service';
import { CurrencyService } from '../../core/services/currency.service';
import { EmployeeModel } from '../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-list.html',
  styles: []
})
export class EmployeeList implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  public readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  employees = signal<EmployeeModel[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Filters
  searchQuery = signal<string>('');
  selectedDepartment = signal<string>('all');
  selectedStatus = signal<string>('all');

  // Selected for View Modal
  selectedEmployee = signal<EmployeeModel | null>(null);

  // Active Employees Report
  activeReportModalOpen = signal<boolean>(false);
  activeReportEmployees = signal<EmployeeModel[]>([]);
  isReportLoading = signal<boolean>(false);
  reportGeneratedAt = signal<string>('');

  totalActiveSalariesUSD = computed(() => {
    return this.activeReportEmployees().reduce((sum, emp) => sum + (emp.fixed_amount || 0), 0);
  });

  totalActiveSalariesVES = computed(() => {
    return this.currencyService.toVES(this.totalActiveSalariesUSD());
  });

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading.set(true);
    this.employeeService.getEmployees({
      search: this.searchQuery(),
      department: this.selectedDepartment(),
      status: this.selectedStatus()
    }).subscribe({
      next: (data) => {
        this.employees.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching employees', err);
        this.errorMessage.set('No se pudo cargar la lista de empleados desde el servidor.');
        this.isLoading.set(false);
      }
    });
  }

  // Generate Report of Active Employees
  generateActiveEmployeesReport(): void {
    this.isReportLoading.set(true);
    this.activeReportModalOpen.set(true);
    
    // Fetch all employees without filters to filter strictly active employees
    this.employeeService.getEmployees({}).subscribe({
      next: (allEmps) => {
        const activeOnly = allEmps.filter(
          e => e.status === 'Activo' || e.status === 'Active'
        );
        this.activeReportEmployees.set(activeOnly);
        this.reportGeneratedAt.set(new Date().toLocaleString('es-VE'));
        this.isReportLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading report data', err);
        this.isReportLoading.set(false);
      }
    });
  }

  closeActiveReportModal(): void {
    this.activeReportModalOpen.set(false);
  }

  printReport(): void {
    window.print();
  }

  onFilterChange(): void {
    this.loadEmployees();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedDepartment.set('all');
    this.selectedStatus.set('all');
    this.loadEmployees();
  }

  viewEmployeeDetails(employee: EmployeeModel): void {
    this.selectedEmployee.set(employee);
  }

  closeModal(): void {
    this.selectedEmployee.set(null);
  }

  editEmployee(id: string): void {
    this.router.navigate(['/employees/edit', id]);
  }

  deleteEmployee(employee: EmployeeModel): void {
    if (confirm(`¿Estás seguro de eliminar a ${employee.full_name} del sistema? Esta acción es irreversible.`)) {
      this.employeeService.deleteEmployee(employee.id).subscribe({
        next: () => {
          this.successMessage.set(`Empleado ${employee.full_name} eliminado correctamente.`);
          this.loadEmployees();
          setTimeout(() => this.successMessage.set(null), 3000);
        },
        error: (err) => {
          console.error('Error deleting employee', err);
          this.errorMessage.set('No se pudo eliminar al empleado.');
          setTimeout(() => this.errorMessage.set(null), 3000);
        }
      });
    }
  }

  navigateToAdd(): void {
    this.router.navigate(['/employees/new']);
  }
}
