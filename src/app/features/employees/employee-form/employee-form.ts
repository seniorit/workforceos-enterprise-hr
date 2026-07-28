import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../../shared/components/header/header';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/services/auth.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { Employee } from '../../../core/models/employee.model';
import { VENEZUELAN_BANKS } from '../../../core/models/bank.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [HeaderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './employee-form.html',
})
export class EmployeeFormComponent implements OnInit {
  public bankList = VENEZUELAN_BANKS;
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public empService = inject(EmployeeService);
  public auth = inject(AuthService);
  public exchangeService = inject(ExchangeRateService);

  public employeeForm!: FormGroup;
  public isEditMode = signal<boolean>(false);
  public employeeIdParam = signal<string | null>(null);
  public isSaving = signal<boolean>(false);
  public photoPreview = signal<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250');
  public showSuccessToast = signal<boolean>(false);

  ngOnInit(): void {
    const autoId = this.empService.generateNextEmployeeId();

    this.employeeForm = this.fb.group({
      // Información Personal
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      dob: ['1992-06-15'],
      gender: ['Masculino'],
      personalId: ['', Validators.required],
      taxId: [''],

      // Detalles de Empleo
      employeeId: [{ value: autoId, disabled: true }, Validators.required],
      startDate: [new Date().toISOString().substring(0, 10)],
      department: ['Ingeniería', Validators.required],
      position: ['', Validators.required],

      // Detalles de Contacto
      workEmail: ['', [Validators.required, Validators.email]],
      phone: [''],
      emergencyContact: [''],

      // Datos Bancarios
      bank: ['Banco Mercantil'],
      accountNumber: ['', [Validators.pattern('^[0-9]{20}$')]],
      accountType: ['Corriente'],

      // Datos de Pago Móvil
      mobileBankCode: ['0105'],
      mobileId: [''],
      mobilePhone: [''],
      mobileType: ['Personal'],

      // Configuración Salarial
      contractType: ['Tiempo Indeterminado'],
      conceptType: ['Sueldo Base'],
      fixedSalary: ['$ 3,200.00'],
      payFrequency: ['Quincenal'],

      status: ['Onboarded'],
    });

    // Check if edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeIdParam.set(id);
      this.loadEmployeeData(id);
    }
  }

  private loadEmployeeData(id: string) {
    const found = this.empService.employees().find(e => e.id === id);
    if (found) {
      this.employeeForm.patchValue({
        fullName: found.fullName,
        dob: found.dob || '1992-06-15',
        gender: found.gender || 'Masculino',
        personalId: found.personalId || '',
        taxId: found.taxId || '',
        startDate: found.startDate || new Date().toISOString().substring(0, 10),
        department: found.department,
        position: found.position,
        workEmail: found.workEmail,
        phone: found.phone || '',
        emergencyContact: found.emergencyContact || '',
        bank: found.bank || 'Banco Mercantil',
        accountNumber: found.accountNumber || '',
        accountType: found.accountType || 'Corriente',
        mobileBankCode: found.mobileBankCode || '0105',
        mobileId: found.mobileId || '',
        mobilePhone: found.mobilePhone || '',
        mobileType: found.mobileType || 'Personal',
        contractType: found.contractType || 'Tiempo Indeterminado',
        conceptType: found.conceptType || 'Sueldo Base',
        fixedSalary: found.fixedSalary || '$ 3,200.00',
        payFrequency: found.payFrequency || 'Quincenal',
        status: found.status || 'Onboarded',
      });
      this.employeeForm.get('employeeId')?.setValue(found.employeeId);
      if (found.photoUrl) {
        this.photoPreview.set(found.photoUrl);
      }
    }
  }

  public onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.photoPreview.set(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public async onSubmit() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const rawValue = this.employeeForm.getRawValue();

    const employeePayload: Omit<Employee, 'id'> = {
      ...rawValue,
      photoUrl: this.photoPreview(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (this.isEditMode() && this.employeeIdParam()) {
        await this.empService.updateEmployee(this.employeeIdParam()!, employeePayload);
      } else {
        await this.empService.addEmployee(employeePayload);
      }

      this.showSuccessToast.set(true);
      setTimeout(() => {
        this.router.navigate(['/employees']);
      }, 1200);
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      this.isSaving.set(false);
    }
  }

  public cancel() {
    this.router.navigate(['/employees']);
  }
}
