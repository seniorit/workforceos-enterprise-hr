import { Component, ChangeDetectionStrategy, inject, input, output, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../../core/models/employee.model';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { VENEZUELAN_BANKS, getBankByCode, getBankByName } from '../../../core/models/bank.model';

export interface PagoMovilTransaction {
  employeeId: string;
  employeeName: string;
  isTemporary: boolean;
  bankCode: string;
  bankName: string;
  phone: string;
  personalId: string;
  recipientName: string;
  amountUsd: number;
  amountBs: number;
  bcvRate: number;
  referenceNumber: string;
  referenceNote: string;
}

@Component({
  selector: 'app-pago-movil-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pago-movil-modal.html',
})
export class PagoMovilModalComponent {
  public exchangeService = inject(ExchangeRateService);
  public bankList = VENEZUELAN_BANKS;

  public isOpen = input<boolean>(false);
  public employee = input<Employee | null>(null);

  public closeModal = output<void>();
  public confirmPayment = output<PagoMovilTransaction>();

  // Form & Mode State
  public isTemporary = signal<boolean>(false);
  public isProcessing = signal<boolean>(false);
  public showSuccessStep = signal<boolean>(false);
  public lastTransaction = signal<PagoMovilTransaction | null>(null);

  // Editable Form Fields
  public bankCode = signal<string>('0102');
  public phone = signal<string>('');
  public personalId = signal<string>('');
  public recipientName = signal<string>('');
  public referenceNumber = signal<string>('');
  public referenceNote = signal<string>('Pago de Nómina Quincenal');

  // Helper to generate a realistic 6-8 digit bank transaction reference number
  public generateRandomReference(): string {
    const num = Math.floor(10000000 + Math.random() * 90000000);
    return num.toString();
  }

  // Computed Bank Name from selected code
  public bankName = computed(() => {
    const code = this.bankCode();
    const bank = getBankByCode(code);
    return bank ? bank.name : 'Banco de Venezuela';
  });

  // Computed Financials
  public amountUsd = computed(() => {
    const emp = this.employee();
    return emp ? this.exchangeService.parseUsdValue(emp.fixedSalary) : 0;
  });

  public amountBs = computed(() => {
    return this.exchangeService.usdToBs(this.amountUsd());
  });

  constructor() {
    // Whenever employee input changes, re-populate registered Pago Móvil data
    effect(() => {
      const emp = this.employee();
      if (emp && this.isOpen()) {
        this.resetFormWithEmployeeData(emp);
      }
    });
  }

  public resetFormWithEmployeeData(emp: Employee) {
    this.isTemporary.set(false);
    this.showSuccessStep.set(false);
    this.isProcessing.set(false);

    // Resolve Bank Code
    let resolvedCode = '0102';
    if (emp.mobileBankCode) {
      resolvedCode = emp.mobileBankCode;
    } else if (emp.bank) {
      const b = getBankByName(emp.bank);
      if (b) resolvedCode = b.code;
    }
    this.bankCode.set(resolvedCode);

    // Resolve Phone
    this.phone.set(emp.mobilePhone || '0412-0000000');

    // Resolve Personal ID / RIF
    this.personalId.set(emp.mobileId || emp.personalId || 'V-00000000');

    // Resolve Recipient Name
    this.recipientName.set(emp.fullName || '');

    // Default Reference Number & Note
    this.referenceNumber.set(this.generateRandomReference());
    this.referenceNote.set(`Nómina - ${emp.fullName}`);
  }

  public toggleTemporaryMode(useTemp: boolean) {
    this.isTemporary.set(useTemp);
    if (!useTemp && this.employee()) {
      this.resetFormWithEmployeeData(this.employee()!);
    }
  }

  public onSubmitPayment() {
    const emp = this.employee();
    if (!emp) return;

    this.isProcessing.set(true);

    const refNum = this.referenceNumber().trim() || this.generateRandomReference();

    const transaction: PagoMovilTransaction = {
      employeeId: emp.id || emp.employeeId,
      employeeName: emp.fullName,
      isTemporary: this.isTemporary(),
      bankCode: this.bankCode(),
      bankName: this.bankName(),
      phone: this.phone(),
      personalId: this.personalId(),
      recipientName: this.recipientName(),
      amountUsd: this.amountUsd(),
      amountBs: this.amountBs(),
      bcvRate: this.exchangeService.bcvRate(),
      referenceNumber: refNum,
      referenceNote: this.referenceNote(),
    };

    setTimeout(() => {
      this.isProcessing.set(false);
      this.lastTransaction.set(transaction);
      this.showSuccessStep.set(true);
      this.confirmPayment.emit(transaction);
    }, 800);
  }

  public copyToClipboard(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }

  public onClose() {
    this.showSuccessStep.set(false);
    this.closeModal.emit();
  }
}
