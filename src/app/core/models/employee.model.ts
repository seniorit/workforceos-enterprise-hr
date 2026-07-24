export interface EmployeeModel {
  id: string;
  full_name: string;
  birth_date: string;
  gender: string;
  personal_id: string;
  tax_id: string;
  employee_id: string;
  start_date: string;
  department: string;
  job_title: string;
  work_email: string;
  phone_number: string;
  emergency_contact: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  mobile_bank_code: string;
  mobile_tax_id: string;
  mobile_phone: string;
  mobile_pay_type: string;
  contract_type: string;
  concept_type: string;
  fixed_amount: number;
  payment_frequency: string;
  photo_url?: string;
  status: string;
  created_at?: string;
}

export interface CreateEmployee {
  full_name: string;
  birth_date: string;
  gender: string;
  personal_id: string;
  tax_id: string;
  employee_id: string;
  start_date: string;
  department: string;
  job_title: string;
  work_email: string;
  phone_number: string;
  emergency_contact: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  mobile_bank_code: string;
  mobile_tax_id: string;
  mobile_phone: string;
  mobile_pay_type: string;
  contract_type: string;
  concept_type: string;
  fixed_amount: number;
  payment_frequency: string;
  photo_url?: string;
  status: string;
}

export interface UpdateEmployee extends CreateEmployee {
  id: string;
}
