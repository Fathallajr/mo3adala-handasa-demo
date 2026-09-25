import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
	token: string;
	expiresAt: string;
	role: 'admin' | 'leads';
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
	}

	getToken(): string | null {
		if (typeof localStorage === 'undefined') {
			return null;
		}

		const token = localStorage.getItem(this.tokenKey);
		const expiresAt = localStorage.getItem(`${this.tokenKey}-expires`);

		if (!token || !expiresAt) {
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

	getRole(): 'admin' | 'leads' {
		if (typeof localStorage === 'undefined') return 'admin';
		return localStorage.getItem(this.roleKey) === 'leads' ? 'leads' : 'admin';
	}

	isLeadsOnly(): boolean {
		return this.getRole() === 'leads';
	}
}
