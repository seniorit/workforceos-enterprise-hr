import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EmployeeModel, CreateEmployee, UpdateEmployee } from '../models/employee.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  getEmployees(filters?: { search?: string; department?: string; status?: string }): Observable<EmployeeModel[]> {
    return from(getDocs(collection(db, 'employees'))).pipe(
      map(snapshot => {
        let employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeModel));

        if (filters?.search) {
          const s = filters.search.toLowerCase();
          employees = employees.filter(e =>
            (e.full_name && e.full_name.toLowerCase().includes(s)) ||
            (e.job_title && e.job_title.toLowerCase().includes(s)) ||
            (e.work_email && e.work_email.toLowerCase().includes(s)) ||
            (e.employee_id && e.employee_id.toLowerCase().includes(s))
          );
        }
        if (filters?.department) {
          employees = employees.filter(e => e.department.toLowerCase() === filters.department?.toLowerCase());
        }
        if (filters?.status) {
          employees = employees.filter(e => e.status.toLowerCase() === filters.status?.toLowerCase());
        }
        return employees;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.LIST, 'employees');
      })
    );
  }

  getEmployeeById(id: string): Observable<EmployeeModel> {
    return from(getDoc(doc(db, 'employees', id))).pipe(
      map(docSnap => {
        if (!docSnap.exists()) {
          throw new Error('Empleado no encontrado');
        }
        return { id: docSnap.id, ...docSnap.data() } as EmployeeModel;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.GET, `employees/${id}`);
      })
    );
  }

  createEmployee(employee: CreateEmployee): Observable<EmployeeModel> {
    const id = (employee as unknown as { id?: string }).id || 'emp-' + Date.now();
    const newEmp: EmployeeModel = {
      id,
      ...employee,
      status: employee.status || 'Activo',
      created_at: new Date().toISOString()
    };

    return from(
      setDoc(doc(db, 'employees', id), newEmp)
        .then(() => newEmp)
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `employees/${id}`);
        })
    );
  }

  updateEmployee(id: string, employee: UpdateEmployee): Observable<EmployeeModel> {
    return from(
      setDoc(doc(db, 'employees', id), employee, { merge: true })
        .then(() => ({ ...employee, id } as EmployeeModel))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
        })
    );
  }


  deleteEmployee(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'employees', id))
        .then(() => ({ success: true, id }))
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `employees/${id}`);
        })
    );
  }
}

