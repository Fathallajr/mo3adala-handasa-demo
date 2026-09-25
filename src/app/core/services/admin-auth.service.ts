import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface LoginResponse {
	token: string;
	expiresAt: string;
}

interface LoginRequest {
	username: string;
	password: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
	private readonly http = inject(HttpClient);
	private readonly tokenKey = 'mo3adala-admin-token';
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
			})
		);
	}

	logout(): void {
		if (typeof localStorage === 'undefined') {
			return;
		}

		localStorage.removeItem(this.tokenKey);
		localStorage.removeItem(`${this.tokenKey}-expires`);
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
}
