import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lead {
	id: string; name: string; whatsapp: string; school?: string; studentType?: string;
	program?: string; source?: string; attribution?: { platform?: string; campaign?: string; adSet?: string; ad?: string; medium?: string; content?: string; landingPage?: string; referrer?: string }; status: string; notes?: string; createdAt: string; updatedAt?: string;
}
export interface DashboardSummary {
	totalLeads: number; todayLeads: number; wheelClaimsCount: number;
	byStatus: Record<string, number>; byProgram: Record<string, number>;
	recentLeads: Lead[]; recentActivity: Array<{ action: string; entityType: string; createdAt: string }>;
}
export interface Program {
	id: string; name: string; slug: string; category: string; language: string; price: number;
	features: string[]; isActive: boolean; enrollmentStatus: 'open' | 'closed';
}
export interface WheelClaim { token: string; name: string; whatsapp: string; program: string; gift: string; claimedAt: string; }

@Injectable({ providedIn: 'root' })
export class AdminApiService {
	private readonly http = inject(HttpClient);
	private readonly base = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

	getSummary(): Observable<DashboardSummary> { return this.http.get<DashboardSummary>(`${this.base}/admin/dashboard/summary`); }
	listLeads(search = '', status = '', source = '', program = '', from = '', to = '', page = 1, limit = 20, platform = '', campaign = ''): Observable<{ data: Lead[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
		let params = new HttpParams().set('page', page).set('limit', limit);
		if (search) params = params.set('search', search);
		if (status) params = params.set('status', status);
		if (source) params = params.set('source', source);
		if (program) params = params.set('program', program);
		if (from) params = params.set('from', from);
		if (to) params = params.set('to', to);
		if (platform) params = params.set('platform', platform);
		if (campaign) params = params.set('campaign', campaign);
		return this.http.get<{ data: Lead[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`${this.base}/admin/leads`, { params });
	}
	exportLeads(filters: { search?: string; status?: string; source?: string; program?: string; from?: string; to?: string; platform?: string; campaign?: string }): Observable<Blob> {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
		return this.http.get(`${this.base}/admin/leads/export`, { params, responseType: 'blob' });
	}
	updateLead(id: string, payload: Partial<Lead>): Observable<Lead> { return this.http.patch<Lead>(`${this.base}/admin/leads/${id}`, payload); }
	listPrograms(): Observable<{ data: Program[] }> { return this.http.get<{ data: Program[] }>(`${this.base}/admin/programs`); }
	createProgram(payload: Partial<Program>): Observable<Program> { return this.http.post<Program>(`${this.base}/admin/programs`, payload); }
	updateProgram(id: string, payload: Partial<Program>): Observable<Program> { return this.http.patch<Program>(`${this.base}/admin/programs/${id}`, payload); }
	listWheelClaims(filters: { search?: string; gift?: string; program?: string; from?: string; to?: string } = {}): Observable<{ data: WheelClaim[]; total: number }> {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
		return this.http.get<{ data: WheelClaim[]; total: number }>(`${this.base}/admin/wheel/claims`, { params });
	}
	exportWheelClaims(filters: { search?: string; gift?: string; program?: string; from?: string; to?: string } = {}): Observable<Blob> {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
		return this.http.get(`${this.base}/admin/wheel/claims/export`, { params, responseType: 'blob' });
	}
}
