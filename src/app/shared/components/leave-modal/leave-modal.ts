import { Component, ChangeDetectionStrategy, inject, input, output, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';

export interface LeaveRequestData {
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

@Component({
  selector: 'app-leave-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './leave-modal.html',
})
export class LeaveModalComponent {
  public empService = inject(EmployeeService);

  public isOpen = input<boolean>(false);
  public closeModal = output<void>();
  public requestCreated = output<LeaveRequestData>();

  // State
  public selectedEmployeeId = signal<string>('');
  public leaveType = signal<string>('Permiso Personal');
  public startDate = signal<string>(new Date().toISOString().split('T')[0]);
  public endDate = signal<string>(new Date().toISOString().split('T')[0]);
  public reason = signal<string>('');
  public isSubmitting = signal<boolean>(false);

  public selectedEmployee = computed<Employee | null>(() => {
    const id = this.selectedEmployeeId();
    if (!id) return null;
    return this.empService.employees().find(e => (e.id === id || e.employeeId === id)) || null;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        if (this.empService.employees().length > 0 && !this.selectedEmployeeId()) {
          const first = this.empService.employees()[0];
          this.selectedEmployeeId.set(first.id || first.employeeId);
        }
        this.resetForm();
      }
    });
  }

  public resetForm() {
    this.leaveType.set('Permiso Personal');
    const today = new Date().toISOString().split('T')[0];
    this.startDate.set(today);
    this.endDate.set(today);
    this.reason.set('');
    this.isSubmitting.set(false);
  }

  public onSubmit() {
    const emp = this.selectedEmployee();
    if (!emp || !this.reason().trim()) return;

    this.isSubmitting.set(true);

    const data: LeaveRequestData = {
      employeeId: emp.id || emp.employeeId,
      employeeName: emp.fullName,
      type: this.leaveType(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      reason: this.reason().trim(),
    };

    this.requestCreated.emit(data);
    this.closeModal.emit();
    this.isSubmitting.set(false);
  }

  public onClose() {
    this.closeModal.emit();
  }
}
