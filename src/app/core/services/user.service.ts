import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SystemUser } from '../models/user.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUsers(search = '', role = 'all', status = 'all'): Observable<SystemUser[]> {
    return from(getDocs(collection(db, 'users'))).pipe(
      map(snapshot => {
        let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser));
        if (search) {
          const s = search.toLowerCase();
          users = users.filter(u =>
            (u.full_name && u.full_name.toLowerCase().includes(s)) ||
            (u.email && u.email.toLowerCase().includes(s)) ||
            (u.department && u.department.toLowerCase().includes(s))
          );
        }
        if (role && role !== 'all') {
          users = users.filter(u => u.role === role);
        }
        if (status && status !== 'all') {
          users = users.filter(u => u.status === status);
        }
        return users;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.LIST, 'users');
      })
    );
  }

  getUserById(id: string): Observable<SystemUser> {
    return from(getDoc(doc(db, 'users', id))).pipe(
      map(docSnap => {
        if (!docSnap.exists()) {
          throw new Error('Usuario no encontrado');
        }
        return { id: docSnap.id, ...docSnap.data() } as SystemUser;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.GET, `users/${id}`);
      })
    );
  }

  createUser(userData: Partial<SystemUser> & { password?: string }): Observable<SystemUser> {
    const id = userData.id || 'usr-' + Date.now();
    const newUser: SystemUser = {
      id,
      full_name: userData.full_name || '',
      email: userData.email || '',
      role: userData.role || 'SUPERVISOR',
      department: userData.department || '',
      status: userData.status || 'Active',
      permissions: userData.permissions || ['employees:read', 'attendance:read'],
      created_at: new Date().toISOString(),
      photo_url: userData.photo_url || ''
    };

    return from(
      setDoc(doc(db, 'users', id), newUser)
        .then(() => newUser)
        .catch(err => {
          handleFirestoreError(err, OperationType.CREATE, `users/${id}`);
        })
    );
  }

  updateUser(id: string, userData: Partial<SystemUser>): Observable<SystemUser> {
    return from(
      setDoc(doc(db, 'users', id), userData, { merge: true })
        .then(() => ({ id, ...userData } as SystemUser))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
        })
    );
  }

  resetPassword(id: string, newPassword?: string): Observable<{ success: boolean; message: string }> {
    return from(
      setDoc(doc(db, 'users', id), { updated_at: new Date().toISOString(), password_reset: !!newPassword }, { merge: true })
        .then(() => ({ success: true, message: `Contraseña restablecida exitosamente` }))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `users/${id}`);
        })
    );
  }

  deleteUser(id: string): Observable<{ success: boolean; id: string }> {
    return from(
      deleteDoc(doc(db, 'users', id))
        .then(() => ({ success: true, id }))
        .catch(err => {
          handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
        })
    );
  }
}


