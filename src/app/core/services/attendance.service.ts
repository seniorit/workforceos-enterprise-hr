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
import { AttendanceRecord, LeaveRequest } from '../models/attendance.model';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private firebase = inject(FirebaseService);

  public records = signal<AttendanceRecord[]>([]);
  public leaveRequests = signal<LeaveRequest[]>([]);
  public isLoading = signal<boolean>(true);

  public isPurging = false;

  constructor() {
    this.initRealtimeSync();
  }

  private initRealtimeSync() {
    // 1. Sync attendance_records
    try {
      const attCol = collection(this.firebase.db, 'attendance_records');
      
      onSnapshot(
        attCol,
        (snapshot) => {
          if (this.isPurging) return;
          if (snapshot.empty) {
            this.records.set([]);
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
          console.warn('Firestore attendance snapshot error, fallback:', error);
          if (!this.isPurging) {
            this.records.set([]);
          }
          this.isLoading.set(false);
        }
      );
    } catch (e) {
      console.warn('Attendance sync error, fallback:', e);
      this.records.set([]);
      this.isLoading.set(false);
    }

    // 2. Sync leave_requests
    try {
      const leaveCol = collection(this.firebase.db, 'leave_requests');

      onSnapshot(
        leaveCol,
        (snapshot) => {
          if (this.isPurging) return;
          if (snapshot.empty) {
            this.leaveRequests.set([]);
          } else {
            const list: LeaveRequest[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ id: docSnap.id, ...docSnap.data() } as LeaveRequest);
            });
            this.leaveRequests.set(list);
          }
        },
        (error) => {
          console.warn('Firestore leave requests snapshot error, fallback:', error);
          if (!this.isPurging) {
            this.leaveRequests.set([]);
          }
        }
      );
    } catch (e) {
      console.warn('Leave requests sync error, fallback:', e);
      this.leaveRequests.set([]);
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
   * Add a new leave request. Forced initial status = "Registrada"
   */
  public async addLeaveRequest(req: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>): Promise<string> {
    const leaveCol = collection(this.firebase.db, 'leave_requests');
    const newReq: Omit<LeaveRequest, 'id'> = {
      ...req,
      status: 'Registrada', // Standard initial state
      createdAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(leaveCol, newReq);
      return docRef.id;
    } catch (e) {
      console.warn('Error saving leave request to firestore, updating local signal:', e);
      const fakeId = `leave-local-${Date.now()}`;
      const fullReq: LeaveRequest = { id: fakeId, ...newReq };
      this.leaveRequests.update(prev => [fullReq, ...prev]);
      return fakeId;
    }
  }

  /**
   * Update an existing leave request (only permitted if status === 'Registrada')
   */
  public async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<void> {
    const existing = this.leaveRequests().find(r => r.id === id);
    if (existing && existing.status !== 'Registrada') {
      throw new Error('No se puede editar una solicitud en estado final (Aprobada/Rechazada).');
    }

    try {
      const docRef = doc(this.firebase.db, 'leave_requests', id);
      await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Error updating leave request in firestore, updating local signal:', e);
      this.leaveRequests.update(prev => 
        prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)
      );
    }
  }

  /**
   * Update leave request status ('Aprobada' | 'Rechazada')
   */
  public async updateLeaveStatus(id: string, newStatus: 'Aprobada' | 'Rechazada'): Promise<void> {
    try {
      const docRef = doc(this.firebase.db, 'leave_requests', id);
      await updateDoc(docRef, { status: newStatus, updatedAt: new Date().toISOString() });
    } catch (e) {
      console.warn('Error updating leave status in firestore, updating local signal:', e);
      this.leaveRequests.update(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus, updatedAt: new Date().toISOString() } : r)
      );
    }
  }

  /**
   * Delete a leave request (only permitted if status === 'Registrada')
   */
  public async deleteLeaveRequest(id: string): Promise<void> {
    const existing = this.leaveRequests().find(r => r.id === id);
    if (existing && existing.status !== 'Registrada') {
      throw new Error('No se puede eliminar una solicitud en estado final (Aprobada/Rechazada).');
    }

    try {
      const docRef = doc(this.firebase.db, 'leave_requests', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error deleting leave request in firestore, updating local signal:', e);
      this.leaveRequests.update(prev => prev.filter(r => r.id !== id));
    }
  }

  /**
   * Destructively purges all attendance records & leave requests in Firestore
   */
  public async purgeAttendanceRecordsAndResetToSuperAdmin(): Promise<void> {
    this.isPurging = true;
    try {
      // Delete attendance records
      const attCol = collection(this.firebase.db, 'attendance_records');
      const snap = await getDocs(attCol);
      for (const docSnap of snap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'attendance_records', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting attendance doc ${docSnap.id}:`, err);
        }
      }

      // Delete leave requests
      const leaveCol = collection(this.firebase.db, 'leave_requests');
      const leaveSnap = await getDocs(leaveCol);
      for (const docSnap of leaveSnap.docs) {
        try {
          await deleteDoc(doc(this.firebase.db, 'leave_requests', docSnap.id));
        } catch (err) {
          console.warn(`Error deleting leave doc ${docSnap.id}:`, err);
        }
      }

      this.records.set([]);
      this.leaveRequests.set([]);
    } catch (e) {
      console.warn('Error during attendance Firestore purge:', e);
      this.records.set([]);
      this.leaveRequests.set([]);
    } finally {
      this.isPurging = false;
    }
  }
}

