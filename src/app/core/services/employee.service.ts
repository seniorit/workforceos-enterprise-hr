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
      fullName: 'Alice Morgan',
      employeeId: 'WF-1001-EMP',
      department: 'Ventas y Marketing',
      position: 'Gerente de Ventas & Marketing',
      workEmail: 'alice.morgan@workforceos.com',
      phone: '+1 (555) 234-5678',
      dob: '1990-04-12',
      gender: 'Femenino',
      personalId: 'V-18234567',
      taxId: 'J-18234567-0',
      startDate: '2023-03-15',
      emergencyContact: 'Mark Morgan (Esposo) - +1 (555) 999-1122',
      bank: 'Banco Mercantil',
      accountNumber: '01050011223344556677',
      accountType: 'Corriente',
      mobileBankCode: '0105',
      mobileId: 'V-18234567',
      mobilePhone: '0414-2345678',
      mobileType: 'Personal',
      contractType: 'Tiempo Indeterminado',
      conceptType: 'Sueldo Base',
      fixedSalary: '$ 3,200.00',
      payFrequency: 'Quincenal',
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
      status: 'Active',
      createdAt: new Date().toISOString(),
    },
    {
      fullName: 'Robert Tang',
      employeeId: 'WF-1002-EMP',
      department: 'Operaciones',
      position: 'Especialista en Logística',
      workEmail: 'robert.tang@workforceos.com',
      phone: '+1 (555) 345-6789',
      dob: '1988-09-20',
      gender: 'Masculino',
      personalId: 'V-19876543',
      taxId: 'J-19876543-0',
      startDate: '2023-06-01',
      emergencyContact: 'Sarah Tang - +1 (555) 888-2233',
      bank: 'Banesco',
      accountNumber: '01340022334455667788',
      accountType: 'Corriente',
      mobileBankCode: '0134',
      mobileId: 'V-19876543',
      mobilePhone: '0412-3456789',
      mobileType: 'Personal',
      contractType: 'Tiempo Indeterminado',
      conceptType: 'Sueldo Base',
      fixedSalary: '$ 2,800.00',
      payFrequency: 'Quincenal',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
      status: 'Active',
      createdAt: new Date().toISOString(),
    },
    {
      fullName: 'Carlos Mendoza',
      employeeId: 'WF-1003-EMP',
      department: 'Ingeniería',
      position: 'Desarrollador Senior Backend',
      workEmail: 'carlos.mendoza@workforceos.com',
      phone: '+1 (555) 456-7890',
      dob: '1993-11-05',
      gender: 'Masculino',
      personalId: 'V-21345678',
      taxId: 'J-21345678-0',
      startDate: '2024-01-10',
      emergencyContact: 'Elena Mendoza - +1 (555) 777-3344',
      bank: 'Banco de Venezuela',
      accountNumber: '01020033445566778899',
      accountType: 'Corriente',
      mobileBankCode: '0102',
      mobileId: 'V-21345678',
      mobilePhone: '0416-4567890',
      mobileType: 'Personal',
      contractType: 'Tiempo Indeterminado',
      conceptType: 'Sueldo Base',
      fixedSalary: '$ 3,500.00',
      payFrequency: 'Quincenal',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
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
   * and resets the employee collection to a clean initial state.
   */
  public async purgeEmployeesAndResetToSuperAdmin(): Promise<void> {
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

      // Re-seed clean sample operational employees
      const seeded: Employee[] = [];
      for (const empData of this.INITIAL_EMPLOYEES) {
        const newDocRef = await addDoc(empCol, empData);
        seeded.push({ id: newDocRef.id, ...empData });
      }
      this.employees.set(seeded);
    } catch (e) {
      console.warn('Error during employees Firestore purge:', e);
      this.employees.set(this.INITIAL_EMPLOYEES.map((e, idx) => ({ ...e, id: `emp-fallback-${idx}` })));
    }
  }
}
