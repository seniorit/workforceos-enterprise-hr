import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { HeaderComponent } from '../../shared/components/header/header';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';
import { AttendanceService } from '../../core/services/attendance.service';

export type ReportType = 'EMPLOYEES' | 'PAYROLL' | 'ATTENDANCE_LEAVES';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [HeaderComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.html',
})
export class ReportsComponent {
  public auth = inject(AuthService);
  public empService = inject(EmployeeService);
  public exchangeService = inject(ExchangeRateService);
  public attService = inject(AttendanceService);

  // Active Tab Report
  public activeReport = signal<ReportType>('EMPLOYEES');

  // Filters for Employee Report
  public empDepartmentFilter = signal<string>('ALL');
  public empStatusFilter = signal<string>('ALL');

  // Filters for Payroll Report
  public payrollPeriod = signal<string>('Quincena Actual (2da Julio 2026)');

  // Filters for Attendance & Leaves Report
  public startDate = signal<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  public endDate = signal<string>(
    new Date().toISOString().split('T')[0]
  );
  public attTypeFilter = signal<string>('ALL');
  public attEmpFilter = signal<string>('ALL');

  // Preview & Notice State
  public notice = signal<string | null>(null);

  // --- COMPUTED DATA FOR EMPLOYEES REPORT ---
  public filteredEmployees = computed(() => {
    let list = this.empService.employees();
    
    if (this.empDepartmentFilter() !== 'ALL') {
      list = list.filter(e => e.department === this.empDepartmentFilter());
    }
    if (this.empStatusFilter() !== 'ALL') {
      list = list.filter(e => e.status === this.empStatusFilter());
    }

    return list;
  });

  public totalEmployeesUsdPayroll = computed(() => {
    return this.filteredEmployees().reduce((sum, e) => {
      return sum + this.exchangeService.parseUsdValue(e.fixedSalary);
    }, 0);
  });

  public totalEmployeesBsPayroll = computed(() => {
    return this.exchangeService.usdToBs(this.totalEmployeesUsdPayroll());
  });

  // --- COMPUTED DATA FOR ATTENDANCE & LEAVES REPORT ---
  public filteredAttendanceAndLeaves = computed(() => {
    const start = this.startDate();
    const end = this.endDate();
    const type = this.attTypeFilter();
    const empId = this.attEmpFilter();

    let list = this.attService.records().filter(r => {
      return r.date >= start && r.date <= end;
    });

    if (type !== 'ALL') {
      list = list.filter(r => r.type === type);
    }

    if (empId !== 'ALL') {
      list = list.filter(r => r.employeeId === empId || r.employeeName === empId);
    }

    return list;
  });

  public totalAttendanceCount = computed(() => {
    return this.filteredAttendanceAndLeaves().filter(r => r.type === 'ASISTENCIA').length;
  });

  public totalAbsenceCount = computed(() => {
    return this.filteredAttendanceAndLeaves().filter(r => r.type === 'INASISTENCIA').length;
  });

  // Departments List
  public departments = computed(() => {
    const set = new Set<string>();
    this.empService.employees().forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  });

  // --- PDF GENERATION LOGIC ---

  // 1. Generate Employee List PDF
  public generateEmployeeListPdf() {
    const doc = new jsPDF();
    const bcvRate = this.exchangeService.bcvRate();
    const today = new Date().toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });

    // Document Header
    this.addPdfHeader(doc, 'REPORTE OFICIAL - DIRECTORIO DE EMPLEADOS', `Fecha de emisión: ${today} | Emitido por: ${this.auth.currentUser()?.displayName || 'Administración'}`);

    // Summary Box
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 38, 182, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Total Colaboradores: ${this.filteredEmployees().length}`, 18, 45);
    doc.text(`Nómina Mensual USD: $ ${this.totalEmployeesUsdPayroll().toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 75, 45);
    doc.text(`Total en Bolívares: Bs. ${this.totalEmployeesBsPayroll().toLocaleString('es-VE', { minimumFractionDigits: 2 })} (Tasa BCV: ${bcvRate})`, 75, 51);

    // Table Columns & Data
    const tableHead = [['Cédula / ID', 'Nombre Completo', 'Departamento', 'Cargo', 'Contrato', 'Sueldo USD', 'Sueldo Bs. (BCV)']];
    const tableData = this.filteredEmployees().map(emp => {
      const usd = this.exchangeService.parseUsdValue(emp.fixedSalary);
      const bs = this.exchangeService.usdToBs(usd);
      return [
        `${emp.personalId || ''}\n${emp.employeeId}`,
        emp.fullName,
        emp.department,
        emp.position,
        emp.contractType || 'Tiempo Indeterminado',
        `$ ${usd.toFixed(2)}`,
        `Bs. ${bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5 },
    });

    this.addPdfFooter(doc);
    doc.save(`Reporte_Empleados_${new Date().toISOString().split('T')[0]}.pdf`);
    this.showSuccessNotice('Reporte PDF de Lista de Empleados generado y descargado.');
  }

  // 2. Generate Generated Payroll PDF
  public generatePayrollPdf() {
    const doc = new jsPDF();
    const bcvRate = this.exchangeService.bcvRate();
    const employees = this.empService.employees();

    const totalUsd = employees.reduce((sum, e) => sum + this.exchangeService.parseUsdValue(e.fixedSalary), 0);
    const totalBs = this.exchangeService.usdToBs(totalUsd);

    // Document Header
    this.addPdfHeader(doc, 'REPORTE DETALLADO DE NÓMINA DE PAGOS', `Período: ${this.payrollPeriod()} | Tasa BCV Oficial: Bs. ${bcvRate} / USD`);

    // KPI Summary Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 38, 182, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Período de Liquidación: ${this.payrollPeriod()}`, 18, 45);
    doc.text(`Colaboradores Acreditados: ${employees.length}`, 18, 52);
    doc.text(`Total en Dólares ($): $ ${totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 105, 45);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 191, 36); // Amber
    doc.text(`Total a Dispersar (Bs.): Bs. ${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, 105, 52);

    // Table Data
    const tableHead = [['ID Empleado', 'Colaborador', 'Banco / Método', 'Cuenta / Teléfono', 'Base USD', 'Monto a Pagar (Bs.)']];
    const tableData = employees.map(emp => {
      const usd = this.exchangeService.parseUsdValue(emp.fixedSalary);
      const bs = this.exchangeService.usdToBs(usd);
      
      let bankMethod = 'Efectivo / Por asignar';
      let bankDetail = '-';
      if (emp.bank && emp.accountNumber) {
        bankMethod = emp.bank;
        bankDetail = emp.accountNumber;
      } else if (emp.mobilePhone) {
        bankMethod = `Pago Móvil (${emp.mobileBankCode || '0105'})`;
        bankDetail = emp.mobilePhone;
      }

      return [
        emp.employeeId,
        `${emp.fullName}\nCI: ${emp.personalId || 'V-00000000'}`,
        bankMethod,
        bankDetail,
        `$ ${usd.toFixed(2)}`,
        `Bs. ${bs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: 65,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5 },
    });

    this.addPdfFooter(doc);
    doc.save(`Reporte_Nomina_${this.payrollPeriod().replace(/\s+/g, '_')}.pdf`);
    this.showSuccessNotice('Reporte PDF de Nómina Generada descargado con éxito.');
  }

  // 3. Generate Unified Attendance & Leaves PDF
  public generateAttendanceLeavesPdf() {
    const doc = new jsPDF();
    const records = this.filteredAttendanceAndLeaves();

    // Document Header
    this.addPdfHeader(doc, 'INFORME UNIFICADO DE ASISTENCIAS Y PERMISOS', `Rango de Fechas: Desde ${this.startDate()} hasta ${this.endDate()}`);

    // Summary Box
    doc.setFillColor(15, 23, 42);
    doc.rect(14, 38, 182, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text(`Total Registros: ${records.length}`, 18, 45);
    doc.text(`Asistencias Registradas: ${this.totalAttendanceCount()}`, 80, 45);
    doc.text(`Inasistencias / Ausencias: ${this.totalAbsenceCount()}`, 140, 45);

    // Table Data
    const tableHead = [['Fecha', 'Empleado', 'Departamento', 'Tipo', 'Horario / Motivo', 'Estatus / Observación']];
    const tableData = records.map(rec => {
      const typeStr = rec.type === 'ASISTENCIA' ? 'ASISTENCIA' : 'INASISTENCIA';
      let detailsCol = rec.details || '-';
      let timeOrReason = '-';

      if (rec.type === 'ASISTENCIA') {
        timeOrReason = `${rec.checkInTime || '08:00 AM'} - ${rec.checkOutTime || '05:00 PM'}`;
        detailsCol = `Condición: ${rec.condition || 'Puntual'}\n${rec.details || ''}`;
      } else {
        timeOrReason = rec.absenceReason || 'Inasistencia';
        detailsCol = `${rec.isJustified ? 'JUSTIFICADA' : 'INJUSTIFICADA'}\n${rec.details || ''}`;
      }

      return [
        rec.date,
        rec.employeeName,
        rec.department || 'General',
        typeStr,
        timeOrReason,
        detailsCol
      ];
    });

    autoTable(doc, {
      startY: 60,
      head: tableHead,
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { cellPadding: 2.5 },
    });

    this.addPdfFooter(doc);
    doc.save(`Reporte_Asistencias_Permisos_${this.startDate()}_a_${this.endDate()}.pdf`);
    this.showSuccessNotice('Reporte PDF de Asistencias y Permisos emitido y descargado.');
  }

  // PDF Helpers
  private addPdfHeader(doc: jsPDF, title: string, subtitle: string) {
    // Header Bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 28, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('WORKFORCE OS ENTERPRISE', 14, 12);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(title, 14, 19);

    // Subtitle / Date
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, 14, 33);
  }

  private addPdfFooter(doc: jsPDF) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Página ${i} de ${pageCount} — Documento Oficial Generado por WorkforceOS Venezuela`, 14, 288);
    }
  }

  private showSuccessNotice(msg: string) {
    this.notice.set(msg);
    setTimeout(() => this.notice.set(null), 6000);
  }
}
