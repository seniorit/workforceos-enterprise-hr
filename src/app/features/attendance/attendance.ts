import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { AttendanceModalComponent } from '../../shared/components/attendance-modal/attendance-modal';
import { LeaveModalComponent, LeaveRequestData } from '../../shared/components/leave-modal/leave-modal';
import { LeaveRequest } from '../../core/models/attendance.model';

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
  public editingLeaveRequest = signal<LeaveRequest | null>(null);
  public preselectedEmpId = signal<string | null>(null);

  // Notice Toast
  public notice = signal<string | null>(null);

  // Search & Filter
  public searchTerm = signal<string>('');
  public filterType = signal<'ALL' | 'ASISTENCIA' | 'INASISTENCIA'>('ALL');

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

  public registeredLeavesCount = computed(() => {
    return this.attService.leaveRequests().filter(r => r.status === 'Registrada').length;
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

  // Leave Request Methods
  public openLeaveModal(req?: LeaveRequest) {
    if (req) {
      if (req.status !== 'Registrada') {
        this.notice.set(`No se puede editar una solicitud en estado final (${req.status}).`);
        setTimeout(() => this.notice.set(null), 5000);
        return;
      }
      this.editingLeaveRequest.set(req);
    } else {
      this.editingLeaveRequest.set(null);
    }
    this.showLeaveModal.set(true);
  }

  public closeLeaveModal() {
    this.showLeaveModal.set(false);
    this.editingLeaveRequest.set(null);
  }

  public async onLeaveRequestSaved(data: LeaveRequestData) {
    if (data.id) {
      // Edit existing
      await this.attService.updateLeaveRequest(data.id, {
        employeeName: data.employeeName,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
      this.notice.set(`Solicitud de ${data.type} actualizada exitosamente para ${data.employeeName}.`);
    } else {
      // Create new
      await this.attService.addLeaveRequest({
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason,
      });
      this.notice.set(`Solicitud de ${data.type} registrada exitosamente para ${data.employeeName} en estado 'Registrada'.`);
    }
    setTimeout(() => this.notice.set(null), 6000);
  }

  public async updateLeaveStatus(id: string, newStatus: 'Aprobada' | 'Rechazada') {
    if (!this.auth.permissions().canApproveTimeOff) {
      this.notice.set('No tiene permisos de administración o supervisión para aprobar/rechazar solicitudes.');
      setTimeout(() => this.notice.set(null), 5000);
      return;
    }

    await this.attService.updateLeaveStatus(id, newStatus);
    this.notice.set(`Solicitud de permiso ${newStatus.toLowerCase()} exitosamente.`);
    setTimeout(() => this.notice.set(null), 5000);
  }

  public async deleteLeaveRequest(req: LeaveRequest) {
    if (req.status !== 'Registrada') {
      this.notice.set(`No se puede eliminar una solicitud en estado final (${req.status}).`);
      setTimeout(() => this.notice.set(null), 5000);
      return;
    }

    if (confirm(`¿Está seguro de eliminar la solicitud de ${req.type} para ${req.employeeName}?`)) {
      await this.attService.deleteLeaveRequest(req.id);
      this.notice.set('Solicitud de permiso eliminada correctamente.');
      setTimeout(() => this.notice.set(null), 4000);
    }
  }
}

