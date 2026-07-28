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

  private readonly INITIAL_EMPLOYEES: Omit<Employee, 'id'>[] = [
    {
      fullName: 'Super Administrador',
      employeeId: 'WF-0001-ADMIN',
      department: 'Dirección General / RRHH',
      position: 'Super Administrador de Sistema',
      workEmail: 'admin@workforceos.com',
      phone: '+1 (555) 000-0000',
      dob: '1985-01-01',
      gender: 'Masculino',
      personalId: 'V-00000001',
      taxId: 'J-00000001-0',
      startDate: '2023-01-01',
      emergencyContact: 'Soporte Corporativo',
      bank: 'Banco de Venezuela',
      accountNumber: '01020000000000000001',
      accountType: 'Corriente',
      mobileBankCode: '0102',
      mobileId: 'V-00000001',
      mobilePhone: '0412-0000000',
      mobileType: 'Corporativo',
      contractType: 'Tiempo Indeterminado',
      conceptType: 'Sueldo Base',
      fixedSalary: '$ 5,000.00',
      payFrequency: 'Quincenal',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      status: 'Active',
      createdAt: new Date().toISOString(),
    }
  ];

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      const empCol = collection(this.firebase.db, 'employees');
      
      onSnapshot(
        empCol,
        async (snapshot) => {
          if (snapshot.empty) {
            await this.seedInitialEmployees();
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
          console.warn('Firestore snapshot error, loading fallback list:', error);
          this.employees.set(this.INITIAL_EMPLOYEES.map((e, idx) => ({ ...e, id: `emp-fallback-${idx}` })));
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('Initialization error, using initial mock dataset:', e);
      this.employees.set(this.INITIAL_EMPLOYEES.map((e, idx) => ({ ...e, id: `emp-fallback-${idx}` })));
      this.isLoading.set(false);
    }
  }

  public async seedInitialEmployees() {
    const empCol = collection(this.firebase.db, 'employees');
    for (const emp of this.INITIAL_EMPLOYEES) {
      try {
        await addDoc(empCol, emp);
      } catch (e) {
        console.warn('Seed document skip:', e);
      }
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
   * and leaves only the single Super Administrator employee record.
   */
  public async purgeEmployeesAndResetToSuperAdmin(): Promise<void> {
    const initialSuperAdminData = {
      ...this.INITIAL_EMPLOYEES[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const empCol = collection(this.firebase.db, 'employees');
      const snap = await getDocs(empCol);

      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'employees', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting employee doc ${docSnap.id}:`, err);
        }
      }

      // Re-seed single Super Administrator employee record
      const newDocRef = await addDoc(empCol, initialSuperAdminData);
      this.employees.set([{ id: newDocRef.id, ...initialSuperAdminData }]);
    } catch (e) {
      console.warn('Error during employees Firestore purge:', e);
      this.employees.set([{ id: 'emp-super-admin', ...initialSuperAdminData }]);
    }
  }
}
