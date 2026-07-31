import { Injectable, inject, signal } from '@angular/core';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDocs 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { Employee } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private firebase = inject(FirebaseService);

  public employees = signal<Employee[]>([]);
  public isLoading = signal<boolean>(true);

  public isPurging = false;

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      const empCol = collection(this.firebase.db, 'employees');
      
      onSnapshot(
        empCol,
        (snapshot) => {
          if (this.isPurging) return;
          if (snapshot.empty) {
            this.employees.set([]);
            this.isLoading.set(false);
          } else {
            const list: Employee[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as Employee);
            });
            this.employees.set(list);
            this.isLoading.set(false);
          }
        },
        (error) => {
          console.warn('Firestore snapshot error:', error);
          if (!this.isPurging) {
            this.employees.set([]);
          }
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('Initialization error:', e);
      this.employees.set([]);
      this.isLoading.set(false);
    }
  }

  public async addEmployee(employeeData: Omit<Employee, 'id'>): Promise<string> {
    const empCol = collection(this.firebase.db, 'employees');
    const docRef = await addDoc(empCol, {
      ...employeeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  public async updateEmployee(id: string, employeeData: Partial<Employee>): Promise<void> {
    const docRef = doc(this.firebase.db, 'employees', id);
    await updateDoc(docRef, {
      ...employeeData,
      updatedAt: new Date().toISOString(),
    });
  }

  public async deleteEmployee(id: string): Promise<void> {
    const docRef = doc(this.firebase.db, 'employees', id);
    await deleteDoc(docRef);
  }

  public generateNextEmployeeId(): string {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `WF-${randomCode}-AUTO`;
  }

  /**
   * Destructively purges all employee documents from Firestore
   * and resets the employee collection to a completely clean state (0 employees).
   */
  public async purgeEmployeesAndResetToSuperAdmin(): Promise<void> {
    this.isPurging = true;
    try {
      // Delete all existing employee documents
      const empCol = collection(this.firebase.db, 'employees');
      const snap = await getDocs(empCol);

      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'employees', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting employee doc ${docSnap.id}:`, err);
        }
      }

      // 3. Set local employees signal to completely empty array
      this.employees.set([]);
    } catch (e) {
      console.warn('Error during employees Firestore purge:', e);
      this.employees.set([]);
    } finally {
      this.isPurging = false;
      this.isLoading.set(false);
    }
  }
}
