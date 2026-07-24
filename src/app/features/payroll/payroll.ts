import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PayrollService } from '../../core/services/payroll.service';
import { CurrencyService } from '../../core/services/currency.service';
import { EmployeeService } from '../../core/services/employee.service';
import { PayrollModel, CreatePayroll } from '../../core/models/payroll.model';
import { EmployeeModel } from '../../core/models/employee.model';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payroll.html',
  styles: []
})
export class Payroll implements OnInit {
  private readonly payrollService = inject(PayrollService);
  private readonly employeeService = inject(EmployeeService);
  public readonly currencyService = inject(CurrencyService);

  payrolls = signal<PayrollModel[]>([]);
  employees = signal<EmployeeModel[]>([]);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modals
  receiptModalOpen = signal<boolean>(false);
  selectedReceipt = signal<PayrollModel | null>(null);
  receiptEmployee = signal<EmployeeModel | null>(null);

  newPayrollModalOpen = signal<boolean>(false);
  
  // New Payroll Form
  selectedEmployeeId = signal<string>('');
  newBaseSalaryUSD = signal<number>(0);
  newBonusesUSD = signal<number>(0);
  newDeductionsUSD = signal<number>(0);
  newPaymentDate = signal<string>(new Date().toISOString().substring(0, 10));
  newPaymentMethod = signal<string>('Pago Móvil');

  // Computed Totals in USD & VES
  totalNetUSD = computed(() => {
    return this.payrolls().reduce((acc, p) => acc + (p.net_pay || 0), 0);
  });

  totalNetVES = computed(() => {
    return this.currencyService.toVES(this.totalNetUSD());
  });

  totalPaidUSD = computed(() => {
    return this.payrolls()
      .filter(p => p.payment_status === 'Paid')
      .reduce((acc, p) => acc + (p.net_pay || 0), 0);
  });

  totalPaidVES = computed(() => {
    return this.currencyService.toVES(this.totalPaidUSD());
  });

  totalPendingUSD = computed(() => {
    return this.payrolls()
      .filter(p => p.payment_status !== 'Paid')
      .reduce((acc, p) => acc + (p.net_pay || 0), 0);
  });

  totalPendingVES = computed(() => {
    return this.currencyService.toVES(this.totalPendingUSD());
  });

  // Individual Payment Processing Modal State
  payModalOpen = signal<boolean>(false);
  selectedPayrollForPayment = signal<PayrollModel | null>(null);
  payEmployee = signal<EmployeeModel | null>(null);
  payMode = signal<'registered' | 'custom'>('registered');

  // Registered info from employee
  registeredBank = signal<string>('');
  registeredPhone = signal<string>('');
  registeredAccount = signal<string>('');
  registeredRecipientId = signal<string>('');
  registeredMethod = signal<string>('Pago Móvil');

  // Form fields for custom or confirmed payment details
  payBankName = signal<string>('');
  payAccountNumber = signal<string>('');
  payMobilePhone = signal<string>('');
  payRecipientId = signal<string>('');
  payPaymentMethod = signal<string>('Pago Móvil');
  payReferenceNumber = signal<string>('');
  payDate = signal<string>(new Date().toISOString().substring(0, 10));
  payNotes = signal<string>('');

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.payrollService.getPayrolls().subscribe({
      next: (data) => {
        this.payrolls.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching payrolls', err);
        this.errorMessage.set('No se pudieron cargar los registros de nómina.');
        this.isLoading.set(false);
      }
    });

    this.employeeService.getEmployees({}).subscribe({
      next: (emps) => this.employees.set(emps),
      error: (err) => console.error('Error loading employees', err)
    });
  }

  // Open modal to process individual payment with choice of registered or custom data
  openProcessPaymentModal(payroll: PayrollModel): void {
    if (payroll.payment_status === 'Paid') return;

    this.selectedPayrollForPayment.set(payroll);
    const emp = this.employees().find(
      e => e.id === payroll.employee_id || e.full_name === payroll.employee_name
    );
    this.payEmployee.set(emp || null);

    // Default registered info
    const bank = emp?.bank_name || 'Banco de Venezuela';
    const phone = emp?.mobile_phone || emp?.phone_number || '';
    const account = emp?.account_number || '';
    const recipientId = emp?.mobile_tax_id || emp?.personal_id || 'V-00000000';
    const method = emp?.mobile_pay_type || 'Pago Móvil';

    this.registeredBank.set(bank);
    this.registeredPhone.set(phone);
    this.registeredAccount.set(account);
    this.registeredRecipientId.set(recipientId);
    this.registeredMethod.set(method);

    // Pre-populate custom form with registered data so user can modify if needed
    this.payBankName.set(bank);
    this.payMobilePhone.set(phone);
    this.payAccountNumber.set(account);
    this.payRecipientId.set(recipientId);
    this.payPaymentMethod.set(method);
    
    // Auto-generate a realistic transaction reference code for Venezuela (e.g. PM-948271)
    const randomRef = `PM-${Math.floor(100000 + Math.random() * 900000)}`;
    this.payReferenceNumber.set(randomRef);
    this.payDate.set(new Date().toISOString().substring(0, 10));
    this.payNotes.set('');
    
    this.payMode.set('registered');
    this.payModalOpen.set(true);
  }

  closeProcessPaymentModal(): void {
    this.payModalOpen.set(false);
    this.selectedPayrollForPayment.set(null);
    this.payEmployee.set(null);
  }

  setPayMode(mode: 'registered' | 'custom'): void {
    this.payMode.set(mode);
  }

  confirmPaymentProcess(): void {
    const item = this.selectedPayrollForPayment();
    if (!item) return;

    const isRegistered = this.payMode() === 'registered';
    
    const finalBank = isRegistered ? this.registeredBank() : this.payBankName();
    const finalPhone = isRegistered ? this.registeredPhone() : this.payMobilePhone();
    const finalAccount = isRegistered ? this.registeredAccount() : this.payAccountNumber();
    const finalRecipientId = isRegistered ? this.registeredRecipientId() : this.payRecipientId();
    const finalMethod = isRegistered ? this.registeredMethod() : this.payPaymentMethod();
    const finalRef = this.payReferenceNumber() || `REF-${Date.now().toString().slice(-6)}`;

    const netVES = this.currencyService.toVES(item.net_pay);

    const updated: PayrollModel = {
      ...item,
      payment_status: 'Paid',
      payment_date: this.payDate(),
      payment_method: finalMethod,
      bank_name: finalBank,
      mobile_phone: finalPhone,
      account_number: finalAccount,
      recipient_id: finalRecipientId,
      reference_number: finalRef,
      payment_rate: this.currencyService.currentRate(),
      notes: this.payNotes()
    };

    this.payrollService.updatePayroll(item.id, updated).subscribe({
      next: () => {
        this.successMessage.set(
          `Pago de Bs. ${netVES.toLocaleString('es-VE')} ($${item.net_pay} USD) procesado exitosamente para ${item.employee_name}. Ref: ${finalRef}`
        );
        this.closeProcessPaymentModal();
        this.loadData();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (err) => {
        console.error('Error processing payment', err);
        this.errorMessage.set('Error al procesar el pago de nómina.');
      }
    });
  }

  // Open Payment Receipt in Bolívares
  viewReceipt(payroll: PayrollModel): void {
    this.selectedReceipt.set(payroll);
    const emp = this.employees().find(e => e.id === payroll.employee_id || e.full_name === payroll.employee_name);
    this.receiptEmployee.set(emp || null);
    this.receiptModalOpen.set(true);
  }

  closeReceiptModal(): void {
    this.receiptModalOpen.set(false);
    this.selectedReceipt.set(null);
    this.receiptEmployee.set(null);
  }

  printReceipt(): void {
    window.print();
  }

  // New Payroll Generation Modal
  openNewPayrollModal(): void {
    if (this.employees().length > 0) {
      const first = this.employees()[0];
      this.selectedEmployeeId.set(first.id);
      this.newBaseSalaryUSD.set(first.fixed_amount || 1000);
    }
    this.newBonusesUSD.set(0);
    this.newDeductionsUSD.set(0);
    this.newPayrollModalOpen.set(true);
  }

  closeNewPayrollModal(): void {
    this.newPayrollModalOpen.set(false);
  }

  onEmployeeSelectChange(): void {
    const emp = this.employees().find(e => e.id === this.selectedEmployeeId());
    if (emp) {
      this.newBaseSalaryUSD.set(emp.fixed_amount || 0);
    }
  }

  calculateNewNetUSD(): number {
    return (Number(this.newBaseSalaryUSD()) || 0) +
           (Number(this.newBonusesUSD()) || 0) -
           (Number(this.newDeductionsUSD()) || 0);
  }

  calculateNewNetVES(): number {
    return this.currencyService.toVES(this.calculateNewNetUSD());
  }

  createPayroll(): void {
    const emp = this.employees().find(e => e.id === this.selectedEmployeeId());
    if (!emp) return;

    const netUSD = this.calculateNewNetUSD();

    const payload: CreatePayroll = {
      employee_id: emp.id,
      employee_name: emp.full_name,
      department: emp.department,
      base_salary: Number(this.newBaseSalaryUSD()),
      bonuses: Number(this.newBonusesUSD()),
      deductions: Number(this.newDeductionsUSD()),
      net_pay: netUSD,
      payment_date: this.newPaymentDate(),
      payment_status: 'Pending',
      payment_method: this.newPaymentMethod()
    };

    this.payrollService.createPayroll(payload).subscribe({
      next: () => {
        this.successMessage.set(`Nómina generada exitosamente para ${emp.full_name} por Bs. ${this.currencyService.toVES(netUSD).toLocaleString('es-VE')} ($${netUSD} USD).`);
        this.closeNewPayrollModal();
        this.loadData();
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        console.error('Error creating payroll', err);
        this.errorMessage.set('Error al generar el registro de nómina.');
      }
    });
  }
}
