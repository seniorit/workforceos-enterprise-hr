import { Component, ChangeDetectionStrategy, inject, input, output, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../core/services/employee.service';
import { AttendanceService } from '../../../core/services/attendance.service';
import { 
  AttendanceRecordType, 
  AttendanceCondition, 
  AbsenceReason 
} from '../../../core/models/attendance.model';
import { Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-attendance-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance-modal.html',
})
export class AttendanceModalComponent {
  public empService = inject(EmployeeService);
  public attService = inject(AttendanceService);

  public isOpen = input<boolean>(false);
  public preselectedEmployeeId = input<string | null>(null);

  public closeModal = output<void>();
  public recordAdded = output<string>();

  // State
  public selectedEmployeeId = signal<string>('');
  public recordType = signal<AttendanceRecordType>('ASISTENCIA');
  public recordDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Attendance Form Fields
  public checkInTime = signal<string>('08:00 AM');
  public checkOutTime = signal<string>('05:00 PM');
  public condition = signal<AttendanceCondition>('Puntual');

  // Absence Form Fields
  public absenceReason = signal<AbsenceReason>('Reposo Médico / Incapacidad');
  public isJustified = signal<boolean>(true);
  public details = signal<string>('');

  public isSubmitting = signal<boolean>(false);

  public selectedEmployee = computed<Employee | null>(() => {
    const id = this.selectedEmployeeId();
    if (!id) return null;
    return this.empService.employees().find(e => (e.id === id || e.employeeId === id)) || null;
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const preId = this.preselectedEmployeeId();
        if (preId) {
          this.selectedEmployeeId.set(preId);
        } else if (this.empService.employees().length > 0) {
          const first = this.empService.employees()[0];
          this.selectedEmployeeId.set(first.id || first.employeeId);
        }
        this.resetForm();
      }
    });
  }

  public resetForm() {
    this.recordType.set('ASISTENCIA');
    this.recordDate.set(new Date().toISOString().split('T')[0]);
    this.checkInTime.set('08:00 AM');
    this.checkOutTime.set('05:00 PM');
    this.condition.set('Puntual');
    this.absenceReason.set('Reposo Médico / Incapacidad');
    this.isJustified.set(true);
    this.details.set('');
    this.isSubmitting.set(false);
  }

  public setRecordType(type: AttendanceRecordType) {
    this.recordType.set(type);
  }

  public async onSubmit() {
    const emp = this.selectedEmployee();
    if (!emp) return;

    this.isSubmitting.set(true);

    const type = this.recordType();

    try {
      await this.attService.addRecord({
        employeeId: emp.id || emp.employeeId,
        employeeName: emp.fullName,
        employeePhoto: emp.photoUrl,
        department: emp.department,
        date: this.recordDate(),
        type: type,
        checkInTime: type === 'ASISTENCIA' ? this.checkInTime() : undefined,
        checkOutTime: type === 'ASISTENCIA' ? this.checkOutTime() : undefined,
        condition: type === 'ASISTENCIA' ? this.condition() : undefined,
        absenceReason: type === 'INASISTENCIA' ? this.absenceReason() : undefined,
        isJustified: type === 'INASISTENCIA' ? this.isJustified() : undefined,
        details: this.details().trim() || (type === 'ASISTENCIA' ? 'Registro de asistencia efectuado por supervisor' : 'Sin detalles adicionales'),
        loggedBy: 'Supervisión / RRHH',
      });

      const message = type === 'ASISTENCIA' 
        ? `Asistencia registrada para ${emp.fullName} (${this.checkInTime()} - ${this.checkOutTime()})`
        : `Inasistencia registrada para ${emp.fullName}: ${this.absenceReason()}`;

      this.recordAdded.emit(message);
      this.closeModal.emit();
    } catch (e) {
      console.error('Error recording attendance:', e);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public onClose() {
    this.closeModal.emit();
  }
}
