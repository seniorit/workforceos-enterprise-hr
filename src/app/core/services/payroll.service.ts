import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PayrollModel, CreatePayroll, UpdatePayroll } from '../models/payroll.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  getPayrolls(): Observable<PayrollModel[]> {
    return from(getDocs(collection(db, 'payrolls'))).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollModel))),
      catchError(err => {
        handleFirestoreError(err, OperationType.LIST, 'payrolls');
      })
    );
  }

  getPayrollById(id: string): Observable<PayrollModel> {
    return from(getDoc(doc(db, 'payrolls', id))).pipe(
      map(docSnap => {
        if (!docSnap.exists()) {
          throw new Error('Nómina no encontrada');
        }
        return { id: docSnap.id, ...docSnap.data() } as PayrollModel;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.GET, `payrolls/${id}`);
      })
    );
  }

  createPayroll(payroll: CreatePayroll): Observable<PayrollModel> {
    const id = 'pay-' + Date.now();
    const newPayroll: PayrollModel = {
      id,
      ...payroll
    };

    return from(
      setDoc(doc(db, 'payrolls', id), newPayroll)
        .then(() => newPayroll)
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `payrolls/${id}`);
        })
    );
  }

  updatePayroll(id: string, payroll: UpdatePayroll): Observable<PayrollModel> {
    return from(
      setDoc(doc(db, 'payrolls', id), payroll, { merge: true })
        .then(() => ({ ...payroll, id } as PayrollModel))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `payrolls/${id}`);
        })
    );
  }


  deletePayroll(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'payrolls', id))
        .then(() => ({ success: true, id }))
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `payrolls/${id}`);
        })
    );
  }
}

