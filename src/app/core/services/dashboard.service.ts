import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardMetricsModel, UpdateDashboardMetrics } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/dashboard';

  getMetrics(): Observable<DashboardMetricsModel> {
    return this.http.get<DashboardMetricsModel>(this.apiUrl);
  }

  updateMetrics(metrics: UpdateDashboardMetrics): Observable<DashboardMetricsModel> {
    return this.http.put<DashboardMetricsModel>(this.apiUrl, metrics);
  }
}
