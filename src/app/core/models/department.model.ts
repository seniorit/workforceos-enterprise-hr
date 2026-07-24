export interface DepartmentModel {
  id: string;
  name: string;
  code: string;
  head_of_department: string;
  description?: string;
  location?: string;
  budget?: number;
  status?: 'Activo' | 'Inactivo';
  employee_count: number;
}

export interface CreateDepartment {
  name: string;
  code: string;
  head_of_department: string;
  description?: string;
  location?: string;
  budget?: number;
  status?: 'Activo' | 'Inactivo';
  employee_count?: number;
}

export interface UpdateDepartment extends CreateDepartment {
  id: string;
}

