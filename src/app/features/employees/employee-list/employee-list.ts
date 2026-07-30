import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [HeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-list.html',
})
export class EmployeeListComponent {
  public empService = inject(EmployeeService);
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);
  private router = inject(Router);

  public searchTerm = signal<string>('');
  public selectedDept = signal<string>('todos');
  public selectedStatus = signal<string>('todos');

  public deleteTarget = signal<Employee | null>(null);
  public isDeleting = signal<boolean>(false);

  public filteredEmployees = computed(() => {
    let list = this.empService.employees();
    const search = this.searchTerm().toLowerCase().trim();
    const dept = this.selectedDept();
    const status = this.selectedStatus();

    if (search) {
      list = list.filter(e => 
        e.fullName.toLowerCase().includes(search) ||
        e.employeeId.toLowerCase().includes(search) ||
        e.workEmail.toLowerCase().includes(search) ||
        e.department.toLowerCase().includes(search) ||
        e.position.toLowerCase().includes(search)
      );
    }

    if (dept !== 'todos') {
      list = list.filter(e => e.department === dept);
    }

    if (status !== 'todos') {
      list = list.filter(e => e.status === status);
    }

    return list;
  });

  public departments = computed(() => {
    const depts = new Set<string>();
    this.empService.employees().forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  });

  public onSearchChange(term: string) {
    this.searchTerm.set(term);
  }

  public filterDept(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedDept.set(value);
  }

  public filterStatus(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
  }

  public editEmployee(emp: Employee) {
    this.router.navigate(['/employees/edit', emp.id]);
  }

  public promptDelete(emp: Employee) {
    this.deleteTarget.set(emp);
  }

  public cancelDelete() {
    this.deleteTarget.set(null);
  }

  public async confirmDelete() {
    const target = this.deleteTarget();
    if (!target || !target.id) return;

    this.isDeleting.set(true);
    try {
      await this.empService.deleteEmployee(target.id);
      this.deleteTarget.set(null);
    } catch (e) {
      console.error('Delete error:', e);
    } finally {
      this.isDeleting.set(false);
    }
  }
}
