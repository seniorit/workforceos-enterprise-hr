import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { AttendanceModalComponent } from '../../shared/components/attendance-modal/attendance-modal';
import { LeaveModalComponent, LeaveRequestData } from '../../shared/components/leave-modal/leave-modal';

interface LeaveRequest {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [HeaderComponent, FormsModule, AttendanceModalComponent, LeaveModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './attendance.html',
})
export class AttendanceComponent {
  public auth = inject(AuthService);
  public empService = inject(EmployeeService);
  public attService = inject(AttendanceService);

  // Modal Controls
  public showModal = signal<boolean>(false);
  public showLeaveModal = signal<boolean>(false);
  public preselectedEmpId = signal<string | null>(null);

  // Notice Toast
  public notice = signal<string | null>(null);

  // Search & Filter
  public searchTerm = signal<string>('');
  public filterType = signal<'ALL' | 'ASISTENCIA' | 'INASISTENCIA'>('ALL');

  // Leave Requests State
  public leaveRequests = signal<LeaveRequest[]>([
    {
      id: 'leave-1',
      employeeName: 'Alice Morgan',
      type: 'Permiso Personal',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      reason: 'Cita médica especialista',
      status: 'Pendiente',
    },
    {
      id: 'leave-2',
      employeeName: 'Robert Tang',
      type: 'Vacaciones',
      startDate: '2026-08-10',
      endDate: '2026-08-20',
      reason: 'Período vacacional acumulado',
      status: 'Pendiente',
    },
  ]);

  // Computed Metrics
  public todayRecords = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.attService.records().filter(r => r.date === today);
  });

  public totalPresentToday = computed(() => {
    return this.todayRecords().filter(r => r.type === 'ASISTENCIA').length;
  });

  public totalAbsentToday = computed(() => {
    return this.todayRecords().filter(r => r.type === 'INASISTENCIA').length;
  });

  public pendingLeavesCount = computed(() => {
    return this.leaveRequests().filter(r => r.status === 'Pendiente').length;
  });

  // Filtered Log
  public filteredRecords = computed(() => {
    let list = this.attService.records();

    const type = this.filterType();
    if (type !== 'ALL') {
      list = list.filter(r => r.type === type);
    }

    const q = this.searchTerm().toLowerCase().trim();
    if (q) {
      list = list.filter(r => 
        r.employeeName.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.details && r.details.toLowerCase().includes(q)) ||
        (r.absenceReason && r.absenceReason.toLowerCase().includes(q))
      );
    }

    return list;
  });

  public openRegistrationModal(employeeId?: string) {
    if (employeeId) {
      this.preselectedEmpId.set(employeeId);
    } else {
      this.preselectedEmpId.set(null);
    }
    this.showModal.set(true);
  }

  public closeModal() {
    this.showModal.set(false);
  }

  public onRecordAdded(msg: string) {
    this.notice.set(msg);
    setTimeout(() => this.notice.set(null), 6000);
  }

  public async deleteRecord(id: string) {
    if (confirm('¿Desea eliminar este registro de asistencia/inasistencia?')) {
      await this.attService.deleteRecord(id);
      this.notice.set('Registro eliminado correctamente.');
      setTimeout(() => this.notice.set(null), 4000);
    }
  }

  public updateLeaveStatus(id: string, newStatus: 'Aprobado' | 'Rechazado') {
    this.leaveRequests.update(list => 
      list.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
    this.notice.set(`Solicitud de permiso ${newStatus.toLowerCase()} exitosamente.`);
    setTimeout(() => this.notice.set(null), 5000);
  }

  public openLeaveModal() {
    this.showLeaveModal.set(true);
  }

  public closeLeaveModal() {
    this.showLeaveModal.set(false);
  }

  public onLeaveRequestCreated(data: LeaveRequestData) {
    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeName: data.employeeName,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason,
      status: 'Pendiente',
    };

    this.leaveRequests.update(list => [newReq, ...list]);
    this.notice.set(`Solicitud de ${data.type} creada exitosamente para ${data.employeeName}. Pendiente por aprobación.`);
    setTimeout(() => this.notice.set(null), 6000);
  }
}
