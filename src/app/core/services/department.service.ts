import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { DepartmentModel, CreateDepartment, UpdateDepartment } from '../models/department.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/departments';

  getDepartments(): Observable<DepartmentModel[]> {
    return from(getDocs(collection(db, 'departments'))).pipe(
      map(snapshot => {
        if (!snapshot.empty) {
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepartmentModel));
        }
        return null;
      }),
      switchMap(firestoreDepts => {
        if (firestoreDepts && firestoreDepts.length > 0) {
          return of(firestoreDepts);
        }
        return this.http.get<DepartmentModel[]>(this.apiUrl).pipe(
          tap(depts => {
            depts.forEach(d => {
              setDoc(doc(db, 'departments', d.id), d).catch(e => console.error('Sync error:', e));
            });
          })
        );
      }),
      catchError(() => this.http.get<DepartmentModel[]>(this.apiUrl))
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
        .then(() => {
          this.http.post<DepartmentModel>(this.apiUrl, newDept).subscribe({ error: err => console.error('API mirror error:', err) });
          return newDept;
        })
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `departments/${id}`);
        })
    ).pipe(
      catchError(() => this.http.post<DepartmentModel>(this.apiUrl, department))
    );
  }

  updateDepartment(id: string, department: UpdateDepartment): Observable<DepartmentModel> {
    const updatedDept: DepartmentModel = {
      ...department,
      employee_count: department.employee_count ?? 0
    };
    return from(
      setDoc(doc(db, 'departments', id), updatedDept, { merge: true })
        .then(() => {
          this.http.put<DepartmentModel>(`${this.apiUrl}/${id}`, department).subscribe({ error: err => console.error('API mirror error:', err) });
          return updatedDept;
        })
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `departments/${id}`);
        })
    ).pipe(
      catchError(() => this.http.put<DepartmentModel>(`${this.apiUrl}/${id}`, department))
    );
  }

  deleteDepartment(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'departments', id))
        .then(() => {
          this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`).subscribe({ error: err => console.error('API mirror error:', err) });
          return { success: true, id };
        })
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `departments/${id}`);
        })
    ).pipe(
      catchError(() => this.http.delete<{ success: boolean; id: string }>(`${this.apiUrl}/${id}`))
    );
  }
}
