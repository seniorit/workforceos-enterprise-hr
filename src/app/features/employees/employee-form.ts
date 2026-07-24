import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { EmployeeService } from '../../core/services/employee.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CreateEmployee, UpdateEmployee } from '../../core/models/employee.model';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './employee-form.html',
  styles: []
})
export class EmployeeForm implements OnInit {
  private readonly employeeService = inject(EmployeeService);
  public readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isEditMode = signal<boolean>(false);
  employeeId = signal<string | null>(null);
  isSubmitting = signal<boolean>(false);
  isLoadingData = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  photoPreview = signal<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');

  // Reactive Form definition matching strict constraints
  employeeForm = new FormGroup({
    full_name: new FormControl('', [Validators.required]),
    birth_date: new FormControl('1995-06-15', [Validators.required]),
    gender: new FormControl('female', [Validators.required]),
    personal_id: new FormControl('', [Validators.required]),
    tax_id: new FormControl('', [Validators.required]),
    employee_id: new FormControl('WF-7729-AUTO', [Validators.required]),
    start_date: new FormControl(new Date().toISOString().substring(0, 10), [Validators.required]),
    department: new FormControl('Engineering', [Validators.required]),
    job_title: new FormControl('', [Validators.required]),
    work_email: new FormControl('', [Validators.required, Validators.email]),
    phone_number: new FormControl('', [Validators.required]),
    emergency_contact: new FormControl('', [Validators.required]),
    
    // Bank info
    bank_name: new FormControl('Chase Bank', [Validators.required]),
    account_number: new FormControl('', [Validators.required, Validators.minLength(10)]),
    account_type: new FormControl('corriente', [Validators.required]),
    
    // Mobile pay info
    mobile_bank_code: new FormControl('0102', [Validators.required]),
    mobile_tax_id: new FormControl('', [Validators.required]),
    mobile_phone: new FormControl('', [Validators.required]),
    mobile_pay_type: new FormControl('personal', [Validators.required]),

    // Salary config
    contract_type: new FormControl('indeterminado', [Validators.required]),
    concept_type: new FormControl('sueldo', [Validators.required]),
    fixed_amount: new FormControl<number>(3500, [Validators.required, Validators.min(0)]),
    payment_frequency: new FormControl('quincenal', [Validators.required]),
    
    photo_url: new FormControl(''),
    status: new FormControl('Activo', [Validators.required])
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.employeeId.set(id);
      this.loadEmployeeData(id);
    } else {
      // Auto-generate employee code for new employee
      const autoCode = `WF-${Math.floor(1000 + Math.random() * 9000)}-AUTO`;
      this.employeeForm.patchValue({ employee_id: autoCode });
    }
  }

  loadEmployeeData(id: string): void {
    this.isLoadingData.set(true);
    this.employeeService.getEmployeeById(id).subscribe({
      next: (emp) => {
        this.employeeForm.patchValue({
          full_name: emp.full_name,
          birth_date: emp.birth_date,
          gender: emp.gender,
          personal_id: emp.personal_id,
          tax_id: emp.tax_id,
          employee_id: emp.employee_id,
          start_date: emp.start_date,
          department: emp.department,
          job_title: emp.job_title,
          work_email: emp.work_email,
          phone_number: emp.phone_number,
          emergency_contact: emp.emergency_contact,
          bank_name: emp.bank_name,
          account_number: emp.account_number,
          account_type: emp.account_type,
          mobile_bank_code: emp.mobile_bank_code,
          mobile_tax_id: emp.mobile_tax_id,
          mobile_phone: emp.mobile_phone,
          mobile_pay_type: emp.mobile_pay_type,
          contract_type: emp.contract_type,
          concept_type: emp.concept_type,
          fixed_amount: emp.fixed_amount,
          payment_frequency: emp.payment_frequency,
          photo_url: emp.photo_url,
          status: emp.status
        });
        if (emp.photo_url) {
          this.photoPreview.set(emp.photo_url);
        }
        this.isLoadingData.set(false);
      },
      error: (err) => {
        console.error('Error loading employee', err);
        this.errorMessage.set('No se pudo cargar la información del empleado.');
        this.isLoadingData.set(false);
      }
    });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.photoPreview.set(result);
        this.employeeForm.patchValue({ photo_url: result });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      this.errorMessage.set('Por favor completa todos los campos requeridos correctamente.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValues = this.employeeForm.value;

    if (this.isEditMode() && this.employeeId()) {
      const updatePayload: UpdateEmployee = {
        id: this.employeeId()!,
        full_name: formValues.full_name || '',
        birth_date: formValues.birth_date || '',
        gender: formValues.gender || 'male',
        personal_id: formValues.personal_id || '',
        tax_id: formValues.tax_id || '',
        employee_id: formValues.employee_id || '',
        start_date: formValues.start_date || '',
        department: formValues.department || '',
        job_title: formValues.job_title || '',
        work_email: formValues.work_email || '',
        phone_number: formValues.phone_number || '',
        emergency_contact: formValues.emergency_contact || '',
        bank_name: formValues.bank_name || '',
        account_number: formValues.account_number || '',
        account_type: formValues.account_type || '',
        mobile_bank_code: formValues.mobile_bank_code || '',
        mobile_tax_id: formValues.mobile_tax_id || '',
        mobile_phone: formValues.mobile_phone || '',
        mobile_pay_type: formValues.mobile_pay_type || '',
        contract_type: formValues.contract_type || '',
        concept_type: formValues.concept_type || '',
        fixed_amount: Number(formValues.fixed_amount || 0),
        payment_frequency: formValues.payment_frequency || 'quincenal',
        photo_url: this.photoPreview(),
        status: formValues.status || 'Activo'
      };

      this.employeeService.updateEmployee(this.employeeId()!, updatePayload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Empleado actualizado con éxito en el backend.');
          setTimeout(() => this.router.navigate(['/employees']), 1200);
        },
        error: (err) => {
          console.error('Error updating employee', err);
          this.errorMessage.set('Ocurrió un error al actualizar el empleado.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      const createPayload: CreateEmployee = {
        full_name: formValues.full_name || '',
        birth_date: formValues.birth_date || '',
        gender: formValues.gender || 'male',
        personal_id: formValues.personal_id || '',
        tax_id: formValues.tax_id || '',
        employee_id: formValues.employee_id || '',
        start_date: formValues.start_date || '',
        department: formValues.department || '',
        job_title: formValues.job_title || '',
        work_email: formValues.work_email || '',
        phone_number: formValues.phone_number || '',
        emergency_contact: formValues.emergency_contact || '',
        bank_name: formValues.bank_name || '',
        account_number: formValues.account_number || '',
        account_type: formValues.account_type || '',
        mobile_bank_code: formValues.mobile_bank_code || '',
        mobile_tax_id: formValues.mobile_tax_id || '',
        mobile_phone: formValues.mobile_phone || '',
        mobile_pay_type: formValues.mobile_pay_type || '',
        contract_type: formValues.contract_type || '',
        concept_type: formValues.concept_type || '',
        fixed_amount: Number(formValues.fixed_amount || 0),
        payment_frequency: formValues.payment_frequency || 'quincenal',
        photo_url: this.photoPreview(),
        status: formValues.status || 'Activo'
      };

      this.employeeService.createEmployee(createPayload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Empleado guardado con éxito en el backend.');
          setTimeout(() => this.router.navigate(['/employees']), 1200);
        },
        error: (err) => {
          console.error('Error creating employee', err);
          this.errorMessage.set('Ocurrió un error al guardar el nuevo empleado.');
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/employees']);
  }
}
