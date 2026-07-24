import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../core/services/attendance.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AttendanceModel, CreateAttendance } from '../../core/models/attendance.model';
import { EmployeeModel } from '../../core/models/employee.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance.html',
  styles: []
})
export class Attendance implements OnInit {
  private readonly attendanceService = inject(AttendanceService);
  private readonly employeeService = inject(EmployeeService);

  records = signal<AttendanceModel[]>([]);
  employees = signal<EmployeeModel[]>([]);
  isLoading = signal<boolean>(true);

  // Search & Filter state
  searchQuery = signal<string>('');
  selectedStatus = signal<string>('all');
  selectedDateFilter = signal<string>('');

  // Messages
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Modal State
  isModalOpen = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingRecordId = signal<string | null>(null);

  // Form Fields
  formEmployeeId = signal<string>('');
  formDate = signal<string>(new Date().toISOString().substring(0, 10));
  formRecordType = signal<'normal' | 'inasistencia' | 'justificado'>('normal');
  
  // Official Schedule & Tolerance
  formExpectedCheckIn = signal<string>('08:00');
  formExpectedCheckOut = signal<string>('17:00');
  formToleranceMinutes = signal<number>(15);

  // Actual Times
  formActualCheckIn = signal<string>('08:00');
  formActualCheckOut = signal<string>('17:00');
  formNotes = signal<string>('');

  // Report Modal
  isReportModalOpen = signal<boolean>(false);
  reportGeneratedAt = signal<string>('');

  // Computed summary metrics
  totalRecordsCount = computed(() => this.records().length);

  countPresent = computed(() => {
    return this.records().filter(r => r.status === 'Presente' || r.status === 'Present').length;
  });

  countLate = computed(() => {
    return this.records().filter(r => r.status === 'Tardanza' || r.status === 'Late').length;
  });

  totalLateMinutesSum = computed(() => {
    return this.records().reduce((sum, r) => sum + (r.late_minutes || 0), 0);
  });

  countAbsent = computed(() => {
    return this.records().filter(r => r.status === 'Inasistente' || r.status === 'Absent').length;
  });

  countJustified = computed(() => {
    return this.records().filter(r => r.status === 'Justificado' || r.status === 'On Leave').length;
  });

  // Filtered Records
  filteredRecords = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const date = this.selectedDateFilter();

    return this.records().filter(r => {
      const matchesSearch = !query ||
        r.employee_name.toLowerCase().includes(query) ||
        (r.department && r.department.toLowerCase().includes(query)) ||
        (r.notes && r.notes.toLowerCase().includes(query));

      const matchesStatus = status === 'all' || r.status === status;
      const matchesDate = !date || r.date === date;

      return matchesSearch && matchesStatus && matchesDate;
    });
  });

  // Evaluated status logic in real-time
  evaluatedStatusInfo = computed(() => {
    const type = this.formRecordType();
    
    if (type === 'inasistencia') {
      return {
        status: 'Inasistente',
        lateMinutes: 0,
        hoursWorked: 0,
        checkInFormatted: '-',
        checkOutFormatted: '-',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        description: 'Ausencia sin justificación previa registrada'
      };
    }

    if (type === 'justificado') {
      return {
        status: 'Justificado',
        lateMinutes: 0,
        hoursWorked: 8.0,
        checkInFormatted: 'Permiso',
        checkOutFormatted: 'Permiso',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Permiso o licencia médica justificada'
      };
    }

    // Normal Marking: Calculate minutes delay against expected check in
    const expInMin = this.timeToMinutes(this.formExpectedCheckIn());
    const actInMin = this.timeToMinutes(this.formActualCheckIn());
    const actOutMin = this.timeToMinutes(this.formActualCheckOut());

    const tolerance = this.formToleranceMinutes();
    const delay = actInMin - expInMin;

    let status: 'Presente' | 'Tardanza' = 'Presente';
    let lateMinutes = 0;

    if (delay > tolerance) {
      status = 'Tardanza';
      lateMinutes = delay;
    }

    // Gross hours worked (less 1 hour lunch if >= 6 hours)
    let grossHours = (actOutMin - actInMin) / 60;
    if (grossHours >= 6) {
      grossHours = grossHours - 1; // 1 hour lunch break
    }
    const hoursWorked = Math.max(0, Number(grossHours.toFixed(1)));

    const inTimeFormatted = this.formatTime12h(this.formActualCheckIn());
    const outTimeFormatted = this.formatTime12h(this.formActualCheckOut());

    if (status === 'Tardanza') {
      return {
        status: 'Tardanza',
        lateMinutes,
        hoursWorked,
        checkInFormatted: inTimeFormatted,
        checkOutFormatted: outTimeFormatted,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        description: `Llegada con ${lateMinutes} min de retraso (Excede margen de ${tolerance} min)`
      };
    } else {
      return {
        status: 'Presente',
        lateMinutes: 0,
        hoursWorked,
        checkInFormatted: inTimeFormatted,
        checkOutFormatted: outTimeFormatted,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        description: delay > 0 
          ? `Ingreso dentro de la tolerancia de ${tolerance} min (${delay} min)`
          : `Llegada puntual o anticipada`
      };
    }
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    // Load attendance records
    this.attendanceService.getAttendance().subscribe({
      next: (data) => {
        this.records.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading attendance records', err);
        this.isLoading.set(false);
      }
    });

    // Load employees for selection dropdown
    this.employeeService.getEmployees({}).subscribe({
      next: (emps) => {
        this.employees.set(emps);
      },
      error: (err) => console.error('Error loading employees for attendance dropdown', err)
    });
  }

  openRegisterModal(): void {
    this.isEditing.set(false);
    this.editingRecordId.set(null);

    // Preselect first employee if available
    if (this.employees().length > 0) {
      this.formEmployeeId.set(this.employees()[0].id);
    }
    
    this.formDate.set(new Date().toISOString().substring(0, 10));
    this.formRecordType.set('normal');
    this.formExpectedCheckIn.set('08:00');
    this.formExpectedCheckOut.set('17:00');
    this.formToleranceMinutes.set(15);
    this.formActualCheckIn.set('08:00');
    this.formActualCheckOut.set('17:00');
    this.formNotes.set('');

    this.isModalOpen.set(true);
  }

  openEditModal(record: AttendanceModel): void {
    this.isEditing.set(true);
    this.editingRecordId.set(record.id);

    this.formEmployeeId.set(record.employee_id);
    this.formDate.set(record.date);

    if (record.status === 'Inasistente') {
      this.formRecordType.set('inasistencia');
    } else if (record.status === 'Justificado') {
      this.formRecordType.set('justificado');
    } else {
      this.formRecordType.set('normal');
    }

    this.formExpectedCheckIn.set(this.time24h(record.expected_check_in || '08:00 AM'));
    this.formExpectedCheckOut.set(this.time24h(record.expected_check_out || '05:00 PM'));
    this.formToleranceMinutes.set(15);
    this.formActualCheckIn.set(this.time24h(record.check_in));
    this.formActualCheckOut.set(this.time24h(record.check_out));
    this.formNotes.set(record.notes || '');

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveAttendanceRecord(): void {
    const emp = this.employees().find(e => e.id === this.formEmployeeId());
    const empName = emp ? emp.full_name : 'Empleado Desconocido';
    const dept = emp ? emp.department : 'General';

    const evalInfo = this.evaluatedStatusInfo();

    const payload: CreateAttendance = {
      employee_id: this.formEmployeeId(),
      employee_name: empName,
      department: dept,
      date: this.formDate(),
      expected_check_in: this.formatTime12h(this.formExpectedCheckIn()),
      expected_check_out: this.formatTime12h(this.formExpectedCheckOut()),
      check_in: evalInfo.checkInFormatted,
      check_out: evalInfo.checkOutFormatted,
      status: evalInfo.status,
      hours_worked: evalInfo.hoursWorked,
      late_minutes: evalInfo.lateMinutes,
      notes: this.formNotes()
    };

    if (this.isEditing() && this.editingRecordId()) {
      this.attendanceService.updateAttendance(this.editingRecordId()!, { ...payload, id: this.editingRecordId()! }).subscribe({
        next: () => {
          this.successMessage.set(`Marcaje actualizado para ${empName}. Estado: ${evalInfo.status}`);
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: (err) => {
          console.error('Error updating attendance', err);
          this.errorMessage.set('Error al actualizar registro de asistencia.');
        }
      });
    } else {
      this.attendanceService.createAttendance(payload).subscribe({
        next: () => {
          this.successMessage.set(`Marcaje registrado para ${empName}. Estado: ${evalInfo.status}`);
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage.set(null), 4000);
        },
        error: (err) => {
          console.error('Error creating attendance', err);
          this.errorMessage.set('Error al registrar la asistencia.');
        }
      });
    }
  }

  deleteRecord(id: string): void {
    if (!confirm('¿Está seguro de eliminar este registro de asistencia?')) return;

    this.attendanceService.deleteAttendance(id).subscribe({
      next: () => {
        this.successMessage.set('Registro de asistencia eliminado exitosamente.');
        this.loadData();
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        console.error('Error deleting attendance', err);
        this.errorMessage.set('Error al eliminar el registro.');
      }
    });
  }

  openReportModal(): void {
    this.reportGeneratedAt.set(new Date().toLocaleString('es-VE'));
    this.isReportModalOpen.set(true);
  }

  closeReportModal(): void {
    this.isReportModalOpen.set(false);
  }

  printReport(): void {
    window.print();
  }

  // --- Helper Functions ---
  private timeToMinutes(timeStr: string): number {
    if (!timeStr || timeStr === '-') return 0;
    // Format can be "08:30", "17:00", or "08:30 AM"
    const cleaned = timeStr.trim();
    if (cleaned.includes('AM') || cleaned.includes('PM')) {
      const parts = cleaned.split(' ');
      const [h, m] = parts[0].split(':').map(Number);
      let hours = h;
      if (parts[1] === 'PM' && hours < 12) hours += 12;
      if (parts[1] === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (m || 0);
    } else {
      const [h, m] = cleaned.split(':').map(Number);
      return (h || 0) * 60 + (m || 0);
    }
  }

  private time24h(time12hOr24h: string): string {
    if (!time12hOr24h || time12hOr24h === '-') return '08:00';
    if (!time12hOr24h.includes('AM') && !time12hOr24h.includes('PM')) {
      return time12hOr24h;
    }
    const parts = time12hOr24h.trim().split(' ');
    const [h, m] = parts[0].split(':').map(Number);
    let hours = h;
    if (parts[1] === 'PM' && hours < 12) hours += 12;
    if (parts[1] === 'AM' && hours === 12) hours = 0;
    const hh = hours.toString().padStart(2, '0');
    const mm = (m || 0).toString().padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private formatTime12h(time24h: string): string {
    if (!time24h || time24h === '-') return '-';
    const [h, m] = time24h.split(':').map(Number);
    if (isNaN(h)) return time24h;
    const period = h >= 12 ? 'PM' : 'AM';
    let hours12 = h % 12;
    if (hours12 === 0) hours12 = 12;
    const hh = hours12.toString().padStart(2, '0');
    const mm = (m || 0).toString().padStart(2, '0');
    return `${hh}:${mm} ${period}`;
  }
}

