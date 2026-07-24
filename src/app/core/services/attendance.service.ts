import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AttendanceModel, CreateAttendance, UpdateAttendance } from '../models/attendance.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  getAttendance(): Observable<AttendanceModel[]> {
    return from(getDocs(collection(db, 'attendances'))).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AttendanceModel))),
      catchError(err => {
        handleFirestoreError(err, OperationType.LIST, 'attendances');
      })
    );
  }

  createAttendance(attendance: CreateAttendance): Observable<AttendanceModel> {
    const id = 'att-' + Date.now();
    const newRecord: AttendanceModel = {
      id,
      ...attendance
    };

    return from(
      setDoc(doc(db, 'attendances', id), newRecord)
        .then(() => newRecord)
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `attendances/${id}`);
        })
    );
  }

  updateAttendance(id: string, attendance: UpdateAttendance): Observable<AttendanceModel> {
    return from(
      setDoc(doc(db, 'attendances', id), attendance, { merge: true })
        .then(() => ({ ...attendance, id } as AttendanceModel))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `attendances/${id}`);
        })
    );
  }


  deleteAttendance(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'attendances', id))
        .then(() => ({ success: true, id }))
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `attendances/${id}`);
        })
    );
  }
}

