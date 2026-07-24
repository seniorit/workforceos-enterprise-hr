import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DashboardMetricsModel, UpdateDashboardMetrics } from '../models/dashboard.model';
import { db, handleFirestoreError, OperationType } from '../config/firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly defaultMetrics: DashboardMetricsModel = {
    id: 'dash-default',
    total_employees: 142,
    employee_trend_percentage: 4.5,
    active_jobs: 12,
    pending_time_off: 5,
    upcoming_birthdays_count: 3,
    department_distribution: [],
    recent_hires: [],
    upcoming_birthdays: []
  };


  getMetrics(): Observable<DashboardMetricsModel> {
    return from(getDoc(doc(db, 'settings', 'dashboard'))).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return docSnap.data() as DashboardMetricsModel;
        }
        return this.defaultMetrics;
      }),
      catchError(err => {
        handleFirestoreError(err, OperationType.GET, 'settings/dashboard');
      })
    );
  }

  updateMetrics(metrics: UpdateDashboardMetrics): Observable<DashboardMetricsModel> {
    return from(
      setDoc(doc(db, 'settings', 'dashboard'), metrics, { merge: true })
        .then(() => ({ ...this.defaultMetrics, ...metrics }))
        .catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, 'settings/dashboard');
        })
    );
  }
}

