export interface PayrollModel {
  id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  payment_date: string;
  payment_status: string;
  payment_method: string;
  bank_name?: string;
  account_number?: string;
  mobile_phone?: string;
  recipient_id?: string;
  reference_number?: string;
  payment_rate?: number;
  notes?: string;
}

export interface CreatePayroll {
  employee_id: string;
  employee_name: string;
  department: string;
  base_salary: number;
  bonuses: number;
  deductions: number;
  net_pay: number;
  payment_date: string;
  payment_status: string;
  payment_method: string;
  bank_name?: string;
  account_number?: string;
  mobile_phone?: string;
  recipient_id?: string;
  reference_number?: string;
  payment_rate?: number;
  notes?: string;
}

export interface UpdatePayroll extends CreatePayroll {
  id: string;
}
