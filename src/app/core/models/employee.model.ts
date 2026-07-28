export type EmployeeStatus = 'Onboarded' | 'In Training' | 'Pending' | 'Active';

export interface Employee {
  id?: string;
  // Información Personal
  fullName: string;
  dob?: string;
  gender?: string;
  personalId?: string;
  taxId?: string;

  // Detalles de Empleo
  employeeId: string; // e.g. WF-7729-AUTO
  startDate?: string;
  department: string;
  position: string;

  // Detalles de Contacto
  workEmail: string;
  phone?: string;
  emergencyContact?: string;

  // Información de Pago - Datos Bancarios
  bank?: string;
  accountNumber?: string;
  accountType?: string;

  // Información de Pago - Datos de Pago Móvil
  mobileBankCode?: string;
  mobileId?: string;
  mobilePhone?: string;
  mobileType?: string;

  // Configuración Salarial
  contractType?: string;
  conceptType?: string;
  fixedSalary?: string;
  payFrequency?: string;

  // Extra
  photoUrl?: string;
  status: EmployeeStatus;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}
