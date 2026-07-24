import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DepartmentModel, CreateDepartment, UpdateDepartment } from '../models/department.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly defaultDepartments: DepartmentModel[] = [
    { id: 'dept-1', name: 'Ingeniería', code: 'ENG', head_of_department: 'Alex Rivera', description: 'Desarrollo de software, infraestructura cloud y QA.', location: 'Sede Principal - Piso 4', budget: 150000, status: 'Activo', employee_count: 12 },
    { id: 'dept-2', name: 'Ventas y Marketing', code: 'SALES', head_of_department: 'Robert Tang', description: 'Estrategia comercial, captación de clientes B2B y expansión regional.', location: 'Sede Principal - Piso 2', budget: 95000, status: 'Activo', employee_count: 8 },
    { id: 'dept-3', name: 'Marketing', code: 'MKT', head_of_department: 'Alice Morgan', description: 'Posicionamiento de marca, redes sociales y campañas publicitarias.', location: 'Sede Principal - Piso 2', budget: 60000, status: 'Activo', employee_count: 5 },
    { id: 'dept-4', name: 'Operaciones', code: 'OPS', head_of_department: 'Carlos Gomez', description: 'Logística, gestión de facilidades y soporte administrativo.', location: 'Sede Anexa - Piso 1', budget: 80000, status: 'Activo', employee_count: 10 },
    { id: 'dept-5', name: 'Recursos Humanos', code: 'HR', head_of_department: 'John Doe', description: 'Gestión de talento, nómina, capacitación y clima organizacional.', location: 'Sede Principal - Piso 3', budget: 45000, status: 'Activo', employee_count: 4 }
  ];

  getDepartments(): Observable<DepartmentModel[]> {
    return from(getDocs(collection(db, 'departments'))).pipe(
      map(snapshot => {
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepartmentModel));
        }
        // Seed default departments if collection is empty
        this.defaultDepartments.forEach(dept => {
          setDoc(doc(db, 'departments', dept.id), dept).catch(e => console.error('Dept seed error:', e));
        });
        return this.defaultDepartments;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.LIST, 'departments');
      })
    );
  }

  createDepartment(department: CreateDepartment): Observable<DepartmentModel> {
    const id = 'dept-' + Date.now();
    const newDept: DepartmentModel = {
      id,
      ...department,
      employee_count: department.employee_count ?? 0
    };

    return from(
      setDoc(doc(db, 'departments', id), newDept)
        .then(() => newDept)
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `departments/${id}`);
        })
    );
  }

  updateDepartment(id: string, department: UpdateDepartment): Observable<DepartmentModel> {
    const updatedDept: DepartmentModel = {
      ...department,
      employee_count: department.employee_count ?? 0
    };
    return from(
      setDoc(doc(db, 'departments', id), updatedDept, { merge: true })
        .then(() => ({ ...updatedDept, id } as DepartmentModel))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `departments/${id}`);
        })
    );
  }

  deleteDepartment(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'departments', id))
        .then(() => ({ success: true, id }))
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `departments/${id}`);
        })
    );
  }
}

