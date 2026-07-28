import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ExchangeRateService } from '../../core/services/exchange-rate.service';
import { Employee } from '../../core/models/employee.model';
import { PagoMovilModalComponent, PagoMovilTransaction } from '../../shared/components/pago-movil-modal/pago-movil-modal';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [HeaderComponent, PagoMovilModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payroll.html',
})
export class PayrollComponent {
  public empService = inject(EmployeeService);
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);

  public processedNotice = signal<string | null>(null);
  public selectedPayslipEmp = signal<Employee | null>(null);

  // Pago Móvil State
  public selectedPagoMovilEmp = signal<Employee | null>(null);
  public showPagoMovilModal = signal<boolean>(false);

  public totalEmployees = computed(() => this.empService.employees().length);
  public bankCount = computed(() => this.empService.employees().filter(e => e.bank && e.accountNumber).length);
  public mobilePayCount = computed(() => this.empService.employees().filter(e => e.mobilePhone || e.mobileBankCode).length);

  // Computed total payroll in USD
  public totalPayrollUsd = computed(() => {
    return this.empService.employees().reduce((acc, emp) => {
      return acc + this.exchangeService.parseUsdValue(emp.fixedSalary);
    }, 0);
  });

  // Computed total payroll in Bolívares at current BCV rate
  public totalPayrollBs = computed(() => {
    return this.exchangeService.usdToBs(this.totalPayrollUsd());
  });

  public processBatchPayroll() {
    const totalBsStr = this.exchangeService.formatBs(this.totalPayrollBs());
    const totalUsdStr = this.exchangeService.formatUsd(this.totalPayrollUsd());
    this.processedNotice.set(`Nómina quincenal procesada exitosamente. Lotes de pago generados por ${totalBsStr} (${totalUsdStr} a Tasa BCV: Bs. ${this.exchangeService.bcvRate()}).`);
    setTimeout(() => this.processedNotice.set(null), 6000);
  }

  public openPayslip(emp: Employee) {
    this.selectedPayslipEmp.set(emp);
  }

  public closePayslip() {
    this.selectedPayslipEmp.set(null);
  }

  public openPagoMovilModal(emp: Employee) {
    this.selectedPagoMovilEmp.set(emp);
    this.showPagoMovilModal.set(true);
  }

  public closePagoMovilModal() {
    this.showPagoMovilModal.set(false);
    this.selectedPagoMovilEmp.set(null);
  }

  public onConfirmPagoMovil(tx: PagoMovilTransaction) {
    const totalBsStr = this.exchangeService.formatBs(tx.amountBs);
    const tempTag = tx.isTemporary ? ' [Datos Temporales]' : '';
    this.processedNotice.set(`¡Pago Móvil emitido${tempTag}! Ref: #${tx.referenceNumber} | Acreditados ${totalBsStr} a ${tx.recipientName} (${tx.bankCode} - ${tx.bankName}, Teléf: ${tx.phone}). Tasa BCV: Bs. ${tx.bcvRate}.`);
    this.selectedPayslipEmp.set(null);
    setTimeout(() => this.processedNotice.set(null), 7000);
  }

  public processSinglePayment(emp: Employee) {
    // Direct trigger opens the Pago Móvil modal for full verification
    this.openPagoMovilModal(emp);
  }
}
