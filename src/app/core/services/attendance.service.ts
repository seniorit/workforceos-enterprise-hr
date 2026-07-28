import { Injectable, inject, signal } from '@angular/core';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  getDocs 
} from 'firebase/firestore';
import { FirebaseService } from './firebase.service';
import { AttendanceRecord } from '../models/attendance.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private firebase = inject(FirebaseService);

  public records = signal<AttendanceRecord[]>([]);
  public isLoading = signal<boolean>(true);

  private readonly INITIAL_RECORDS: AttendanceRecord[] = [
    {
      id: 'att-001',
      employeeId: 'WF-0001-ADMIN',
      employeeName: 'Super Administrador',
      department: 'Dirección General / RRHH',
      date: new Date().toISOString().split('T')[0],
      type: 'ASISTENCIA',
      checkInTime: '08:00 AM',
      checkOutTime: '05:00 PM',
      condition: 'Puntual',
      details: 'Jornada regular registrada por supervisión.',
      loggedBy: 'Administración',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'att-002',
      employeeId: 'WF-0002',
      employeeName: 'Alice Morgan',
      department: 'Ventas y Marketing',
      date: new Date().toISOString().split('T')[0],
      type: 'ASISTENCIA',
      checkInTime: '08:14 AM',
      checkOutTime: '05:00 PM',
      condition: 'Remoto',
      details: 'Jornada remota autorizada.',
      loggedBy: 'Administración',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'att-003',
      employeeId: 'WF-0003',
      employeeName: 'Robert Tang',
      department: 'Operaciones',
      date: new Date().toISOString().split('T')[0],
      type: 'INASISTENCIA',
      absenceReason: 'Reposo Médico / Incapacidad',
      isJustified: true,
      details: 'Presenta reposo de IVSS por 3 días por cuadro febril.',
      loggedBy: 'Administración',
      createdAt: new Date().toISOString(),
    }
  ];

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    try {
      const attCol = collection(this.firebase.db, 'attendance_records');
      
      onSnapshot(
        attCol,
        (snapshot) => {
          if (snapshot.empty) {
            this.records.set(this.INITIAL_RECORDS);
            this.isLoading.set(false);
          } else {
            const list: AttendanceRecord[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as AttendanceRecord);
            });
            this.records.set(list);
            this.isLoading.set(false);
          }
        },
        (error) => {
          console.warn('Firestore attendance snapshot error, fallback to initial state:', error);
          this.records.set(this.INITIAL_RECORDS);
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('Attendance sync error, fallback:', e);
      this.records.set(this.INITIAL_RECORDS);
      this.isLoading.set(false);
    }
  }

  public async addRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'>): Promise<string> {
    const attCol = collection(this.firebase.db, 'attendance_records');
    const newRecord: Omit<AttendanceRecord, 'id'> = {
      ...record,
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(attCol, newRecord);
      return docRef.id;
    } catch (e) {
      console.warn('Error saving to firestore, updating local signal:', e);
      const fakeId = `att-local-${Date.now()}`;
      const fullRecord: AttendanceRecord = { id: fakeId, ...newRecord };
      this.records.update(prev => [fullRecord, ...prev]);
      return fakeId;
    }
  }

  public async deleteRecord(id: string): Promise<void> {
    try {
      const docRef = doc(this.firebase.db, 'attendance_records', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error deleting record in firestore, updating local signal:', e);
      this.records.update(prev => prev.filter(r => r.id !== id));
    }
  }

  /**
   * Destructively purges all attendance records in Firestore
   * and resets to baseline initial super admin attendance log.
   */
  public async purgeAttendanceRecordsAndResetToSuperAdmin(): Promise<void> {
    const initialSuperAdminRecord: Omit<AttendanceRecord, 'id'> = {
      employeeId: 'WF-0001-ADMIN',
      employeeName: 'Super Administrador',
      department: 'Dirección General / RRHH',
      date: new Date().toISOString().split('T')[0],
      type: 'ASISTENCIA',
      checkInTime: '08:00 AM',
      checkOutTime: '05:00 PM',
      condition: 'Puntual',
      details: 'Jornada regular inicial reestablecida tras purga.',
      loggedBy: 'Administración',
      createdAt: new Date().toISOString(),
    };

    try {
      const attCol = collection(this.firebase.db, 'attendance_records');
      const snap = await getDocs(attCol);

      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'attendance_records', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting attendance doc ${docSnap.id}:`, err);
        }
      }

      const docRef = await addDoc(attCol, initialSuperAdminRecord);
      this.records.set([{ id: docRef.id, ...initialSuperAdminRecord }]);
    } catch (e) {
      console.warn('Error during attendance Firestore purge:', e);
      this.records.set([{ id: 'att-super-admin', ...initialSuperAdminRecord }]);
    }
  }
}
