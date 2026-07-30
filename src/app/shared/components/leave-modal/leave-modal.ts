import { Component, ChangeDetectionStrategy, inject, input, output, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { Employee } from '../../../core/models/employee.model';
import { LeaveRequest } from '../../../core/models/attendance.model';

export interface LeaveRequestData {
  id?: string;
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
  public editingRequest = input<LeaveRequest | null>(null);
  
  public closeModal = output<void>();
  public requestSaved = output<LeaveRequestData>();

  // Form State
  public selectedEmployeeId = signal<string>('');
  public leaveType = signal<string>('Permiso Personal');
  public startDate = signal<string>('');
  public endDate = signal<string>('');
  public reason = signal<string>('');
  public isSubmitting = signal<boolean>(false);

  // Today in YYYY-MM-DD
  public todayStr = computed<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  public selectedEmployee = computed<Employee | null>(() => {
    const id = this.selectedEmployeeId();
    if (!id) return null;
    return this.empService.employees().find(e => (e.id === id || e.employeeId === id)) || null;
  });

  // Validation: Past dates blocked
  public dateError = computed<string | null>(() => {
    const today = this.todayStr();
    const start = this.startDate();
    const end = this.endDate();

    if (!start || !end) return null;

    if (start < today) {
      return `La fecha de inicio (${start}) no puede ser anterior a la fecha actual (${today}).`;
    }
    if (end < today) {
      return `La fecha de fin (${end}) no puede ser anterior a la fecha actual (${today}).`;
    }
    if (end < start) {
      return `La fecha de fin (${end}) no puede ser anterior a la fecha de inicio (${start}).`;
    }

    return null;
  });

  // Validation: Status check (Cannot edit if Aprobada or Rechazada)
  public statusError = computed<string | null>(() => {
    const req = this.editingRequest();
    if (req && req.status !== 'Registrada') {
      return `No se puede editar una solicitud en estado final (${req.status}).`;
    }
    return null;
  });

  public isFormInvalid = computed<boolean>(() => {
    return !this.selectedEmployee() || 
           !this.reason().trim() || 
           !!this.dateError() || 
           !!this.statusError() || 
           this.isSubmitting();
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const req = this.editingRequest();
        if (req) {
          this.selectedEmployeeId.set(req.employeeId || '');
          this.leaveType.set(req.type);
          this.startDate.set(req.startDate);
          this.endDate.set(req.endDate);
          this.reason.set(req.reason);
        } else {
          this.resetForm();
          if (this.empService.employees().length > 0 && !this.selectedEmployeeId()) {
            const first = this.empService.employees()[0];
            this.selectedEmployeeId.set(first.id || first.employeeId);
          }
        }
      }
    });
  }

  public resetForm() {
    this.leaveType.set('Permiso Personal');
    const today = this.todayStr();
    this.startDate.set(today);
    this.endDate.set(today);
    this.reason.set('');
    this.isSubmitting.set(false);
  }

  public onSubmit() {
    if (this.isFormInvalid()) return;

    const emp = this.selectedEmployee();
    if (!emp) return;

    this.isSubmitting.set(true);

    const data: LeaveRequestData = {
      id: this.editingRequest()?.id,
      employeeId: emp.id || emp.employeeId,
      employeeName: emp.fullName,
      type: this.leaveType(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      reason: this.reason().trim(),
    };

    this.requestSaved.emit(data);
    this.closeModal.emit();
    this.isSubmitting.set(false);
  }

  public onClose() {
    this.closeModal.emit();
  }
}

