import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lead {
	id: string; name: string; whatsapp: string; school?: string; studentType?: string;
	program?: string; source?: string; attribution?: { platform?: string; campaign?: string; campaignId?: string; adSet?: string; ad?: string; medium?: string; content?: string; landingPage?: string; referrer?: string }; status: string; notes?: string; createdAt: string; updatedAt?: string;
}
export interface Customer { id: string; name: string; phone: string; status: string; notes?: string; createdAt: string; updatedAt?: string | null; }
export interface DashboardSummary {
	totalLeads: number; todayLeads: number; wheelClaimsCount: number;
	byStatus: Record<string, number>; byProgram: Record<string, number>;
	recentLeads: Lead[]; recentActivity: Array<{ action: string; entityType: string; createdAt: string }>;
}
export interface Program {
	id: string; name: string; slug: string; category: string; language: string; price: number;
	features: string[]; isActive: boolean; enrollmentStatus: 'open' | 'closed';
}
export interface WheelClaim { token: string; name: string; whatsapp: string; program: string; gift: string; notes?: string; claimedAt: string; }
export interface Feedback { id: string; name: string; university?: string; batch?: string; rating: number; message: string; status: 'new' | 'reviewed' | 'published' | 'archived'; createdAt: string; updatedAt?: string | null; }
export interface AdminUser { username: string; role: string; permissions: string[]; isActive: boolean; createdAt?: string; updatedAt?: string; }
export interface SiteMode { maintenance: boolean; }
export interface FinanceAccount { id: string; name: string; openingBalance: number; balance?: number; income?: number; expense?: number; net?: number; isActive: boolean; }
export interface FinanceTransaction { id: string; kind: 'income' | 'expense' | 'transfer'; accountId?: string | null; fromAccountId?: string | null; toAccountId?: string | null; amount: number; occurredAt: string; category: string; description: string; counterparty: string; status: string; sourceType?: string; sourceId?: string; voidReason?: string; createdAt: string; }
export interface FinanceSummary { income: number; expense: number; transfer: number; net: number; balances: FinanceAccount[]; byCategory: Record<string, number>; }
export interface FinancePayrollLine { employeeId: number; employeeName: string; base: number; bonus: number; discount: number; net: number; status: 'paid' | 'due'; payment?: any; }

@Injectable({ providedIn: 'root' })
export class AdminApiService {
	private readonly http = inject(HttpClient);
	private readonly base = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

	getSummary(): Observable<DashboardSummary> { return this.http.get<DashboardSummary>(`${this.base}/admin/dashboard/summary`); }
	getSiteMode(): Observable<SiteMode> { return this.http.get<SiteMode>(`${this.base}/admin/site-mode`); }
	setSiteMaintenance(maintenance: boolean): Observable<SiteMode> { return this.http.patch<SiteMode>(`${this.base}/admin/site-mode`, { maintenance }); }
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
	deleteLead(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/admin/leads/${id}`); }
	listCustomers(search = '', status = '', page = 1, limit = 20): Observable<{ data: Customer[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
		let params = new HttpParams().set('page', page).set('limit', limit); if (search) params = params.set('search', search); if (status) params = params.set('status', status);
		return this.http.get<{ data: Customer[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`${this.base}/admin/customers`, { params });
	}
	exportCustomers(filters: { search?: string; status?: string } = {}): Observable<Blob> { let params = new HttpParams(); for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value); return this.http.get(`${this.base}/admin/customers/export`, { params, responseType: 'blob' }); }
	previewCustomers(file: File): Observable<{ importId: string; added: number; duplicate: number; invalid: number; total: number }> { const form = new FormData(); form.append('file', file); return this.http.post<{ importId: string; added: number; duplicate: number; invalid: number; total: number }>(`${this.base}/admin/customers/import/preview`, form); }
	confirmCustomers(importId: string): Observable<{ added: number; duplicate: number; invalid: number; total: number }> { return this.http.post<{ added: number; duplicate: number; invalid: number; total: number }>(`${this.base}/admin/customers/import/confirm`, { importId }); }
	updateCustomer(id: string, payload: Partial<Customer>): Observable<Customer> { return this.http.patch<Customer>(`${this.base}/admin/customers/${id}`, payload); }
	deleteCustomer(id: string): Observable<void> { return this.http.delete<void>(`${this.base}/admin/customers/${id}`); }
	listFeedback(search = '', status = '', page = 1, limit = 20): Observable<{ data: Feedback[]; pagination: { page: number; limit: number; total: number; pages: number } }> {
		let params = new HttpParams().set('page', page).set('limit', limit);
		if (search) params = params.set('search', search);
		if (status) params = params.set('status', status);
		return this.http.get<{ data: Feedback[]; pagination: { page: number; limit: number; total: number; pages: number } }>(`${this.base}/admin/feedback`, { params });
	}
	updateFeedback(id: string, status: Feedback['status']): Observable<Feedback> { return this.http.patch<Feedback>(`${this.base}/admin/feedback/${id}`, { status }); }
	listAdminUsers(): Observable<{ data: AdminUser[] }> { return this.http.get<{ data: AdminUser[] }>(`${this.base}/admin/users`); }
	createAdminUser(payload: { username: string; password: string; permissions: string[] }): Observable<AdminUser> { return this.http.post<AdminUser>(`${this.base}/admin/users`, payload); }
	updateAdminUser(username: string, payload: { password?: string; permissions?: string[]; isActive?: boolean }): Observable<AdminUser> { return this.http.patch<AdminUser>(`${this.base}/admin/users/${encodeURIComponent(username)}`, payload); }
	deleteAdminUser(username: string): Observable<void> { return this.http.delete<void>(`${this.base}/admin/users/${encodeURIComponent(username)}`); }
	listFinanceAccounts(): Observable<{ data: FinanceAccount[] }> { return this.http.get<{ data: FinanceAccount[] }>(`${this.base}/admin/finance/accounts`); }
	listFinanceTransactions(filters: { kind?: string; accountId?: string; from?: string; to?: string; search?: string } = {}): Observable<{ data: FinanceTransaction[] }> { let params = new HttpParams(); for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value); return this.http.get<{ data: FinanceTransaction[] }>(`${this.base}/admin/finance/transactions`, { params }); }
	getFinanceSummary(from: string, to: string): Observable<FinanceSummary> { return this.http.get<FinanceSummary>(`${this.base}/admin/finance/summary`, { params: new HttpParams().set('from', from).set('to', to) }); }
	createFinanceTransaction(payload: Partial<FinanceTransaction>): Observable<FinanceTransaction> { return this.http.post<FinanceTransaction>(`${this.base}/admin/finance/transactions`, payload); }
	updateFinanceTransaction(id: string, payload: Partial<FinanceTransaction>): Observable<FinanceTransaction> { return this.http.patch<FinanceTransaction>(`${this.base}/admin/finance/transactions/${encodeURIComponent(id)}`, payload); }
	voidFinanceTransaction(id: string, reason: string): Observable<FinanceTransaction> { return this.http.post<FinanceTransaction>(`${this.base}/admin/finance/transactions/${encodeURIComponent(id)}/void`, { reason }); }
	getFinancePayroll(month: string): Observable<{ month: string; lines: FinancePayrollLine[]; totals: { base: number; bonus: number; discount: number; net: number; paid: number; due: number } }> { return this.http.get<any>(`${this.base}/admin/finance/payroll`, { params: new HttpParams().set('month', month) }); }
	approveFinancePayroll(month: string, accountId: string, payments: Array<{ employeeId: number }>): Observable<{ data: any[] }> { return this.http.post<{ data: any[] }>(`${this.base}/admin/finance/payroll/${month}/approve`, { accountId, payments }); }
	createEmployeeWithAccount(employee: { name: string; titles: string[]; whatsapp: string; email: string; description: string; baseSalary: number | null; department: string[]; employeeType: string; managerId: number | null }, password: string): Observable<{ data: any; employee: any; username: string; role: string; permissions: string[]; employeeId: string }> {
		return this.http.post<{ data: any; employee: any; username: string; role: string; permissions: string[]; employeeId: string }>(`${this.base}/admin/employees/with-account`, { employee, password });
	}
	listPrograms(): Observable<{ data: Program[] }> { return this.http.get<{ data: Program[] }>(`${this.base}/admin/programs`); }
	createProgram(payload: Partial<Program>): Observable<Program> { return this.http.post<Program>(`${this.base}/admin/programs`, payload); }
	updateProgram(id: string, payload: Partial<Program>): Observable<Program> { return this.http.patch<Program>(`${this.base}/admin/programs/${id}`, payload); }
	listWheelClaims(filters: { search?: string; gift?: string; program?: string; from?: string; to?: string; page?: number; limit?: number } = {}): Observable<{ data: WheelClaim[]; total: number; pagination: { page: number; limit: number; total: number; pages: number } }> {
		let params = new HttpParams().set('page', filters.page || 1).set('limit', filters.limit || 20);
		for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
		return this.http.get<{ data: WheelClaim[]; total: number; pagination: { page: number; limit: number; total: number; pages: number } }>(`${this.base}/admin/wheel/claims`, { params });
	}
	deleteWheelClaim(token: string): Observable<void> { return this.http.delete<void>(`${this.base}/admin/wheel/claims/${encodeURIComponent(token)}`); }
	updateWheelClaim(token: string, payload: { notes: string }): Observable<WheelClaim> { return this.http.patch<WheelClaim>(`${this.base}/admin/wheel/claims/${encodeURIComponent(token)}`, payload); }
	exportWheelClaims(filters: { search?: string; gift?: string; program?: string; from?: string; to?: string } = {}): Observable<Blob> {
		let params = new HttpParams();
		for (const [key, value] of Object.entries(filters)) if (value) params = params.set(key, value);
		return this.http.get(`${this.base}/admin/wheel/claims/export`, { params, responseType: 'blob' });
	}
}
