import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
	token: string;
	expiresAt: string;
	role: 'admin' | 'leads' | 'editor';
	username?: string;
	permissions?: string[];
}

interface LoginRequest {
	username: string;
	password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
	private readonly http = inject(HttpClient);
	private readonly tokenKey = 'mo3adala-admin-token';
	private readonly roleKey = `${this.tokenKey}-role`;
	private readonly permissionsKey = `${this.tokenKey}-permissions`;
	private readonly usernameKey = `${this.tokenKey}-username`;
	private readonly loginAtKey = `${this.tokenKey}-login-at`;
	private readonly sessionTtlMs = 6 * 60 * 60 * 1000;
	private readonly apiBase = this.resolveApiBase();

	private resolveApiBase(): string {
		if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
			return 'http://localhost:3001/api';
		}

		return '/api';
	}

	login(credentials: LoginRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>(`${this.apiBase}/auth/login`, credentials).pipe(
			tap(response => {
				localStorage.setItem(this.tokenKey, response.token);
				localStorage.setItem(`${this.tokenKey}-expires`, response.expiresAt);
				localStorage.setItem(this.roleKey, response.role || 'admin');
				localStorage.setItem(this.permissionsKey, JSON.stringify(response.permissions || (response.role === 'admin' ? ['*'] : [])));
				localStorage.setItem(this.usernameKey, response.username || credentials.username);
				localStorage.setItem(this.loginAtKey, String(Date.now()));
			})
		);
	}

	logout(): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(`${this.tokenKey}-expires`);
		localStorage.removeItem(this.roleKey);
		localStorage.removeItem(this.permissionsKey);
		localStorage.removeItem(this.usernameKey);
		localStorage.removeItem(this.loginAtKey);
	}

	getToken(): string | null {
		if (typeof localStorage === 'undefined') {
			return null;
		}

		const token = localStorage.getItem(this.tokenKey);
		const expiresAt = localStorage.getItem(`${this.tokenKey}-expires`);
		const loginAt = Number(localStorage.getItem(this.loginAtKey) || 0);

		if (!token || !expiresAt || !loginAt || Date.now() - loginAt >= this.sessionTtlMs) {
			if (token || expiresAt || loginAt) this.logout();
			return null;
		}

		if (Date.now() > Date.parse(expiresAt)) {
			this.logout();
			return null;
		}

		return token;
	}

	isAuthenticated(): boolean {
		return this.getToken() !== null;
	}

	getRole(): 'admin' | 'leads' | 'editor' {
		if (typeof localStorage === 'undefined') return 'admin';
		const role = localStorage.getItem(this.roleKey);
		return role === 'leads' || role === 'editor' ? role : 'admin';
	}

	getUsername(): string {
		if (typeof localStorage === 'undefined') return '';
		return localStorage.getItem(this.usernameKey) || '';
	}

	loadCurrentUser(): Observable<LoginResponse> {
		const token = this.getToken();
		return this.http.get<LoginResponse>(`${this.apiBase}/auth/me`, {
			headers: new HttpHeaders({ Authorization: `Bearer ${token || ''}` })
		}).pipe(tap(response => {
			if (response.username) localStorage.setItem(this.usernameKey, response.username);
		}));
	}

	isLeadsOnly(): boolean {
		return this.getRole() === 'leads';
	}

	getPermissions(): string[] {
		if (typeof localStorage === 'undefined') return ['*'];
		try { return JSON.parse(localStorage.getItem(this.permissionsKey) || '[]'); } catch { return []; }
	}

	canAccessPage(pageKey: string): boolean { return this.getRole() === 'admin' || (this.getRole() === 'leads' && pageKey === 'batch-2027') || this.getPermissions().includes('*') || this.getPermissions().includes(pageKey); }

	canAccessFeature(feature: 'leads' | 'wheel' | 'feedback'): boolean { return this.getRole() === 'admin' || (this.getRole() === 'leads' && feature === 'leads') || this.getPermissions().includes(feature) || this.getPermissions().includes(`${feature}:read`); }
}
