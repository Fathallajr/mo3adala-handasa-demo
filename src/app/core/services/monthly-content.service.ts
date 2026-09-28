import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EMPTY, Observable, catchError, map, startWith, switchMap, timer, timeout } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';
import { CmsPageKey } from '../cms-page.registry';

@Injectable({ providedIn: 'root' })
export class MonthlyContentService {
	private readonly http = inject(HttpClient);
	private readonly auth = inject(AdminAuthService);
	private readonly apiBase = this.resolveApiBase();
	private readonly serverBase = this.resolveServerBase();

	private resolveApiBase(): string {
		if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
			return 'http://localhost:3001/api';
		}

		return '/api';
	}

	private resolveServerBase(): string {
		if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
			return 'http://localhost:3001';
		}

		return '';
	}

	normalizeAssetPath(url: string): string {
		const value = String(url || '').trim();
		if (!value) return '';
		try {
			const parsed = new URL(value, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
			if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname;
		} catch {
			// Keep non-URL values below so the admin can correct them visibly.
		}
		return value.startsWith('uploads/') ? `/${value}` : value;
	}

	resolveAssetUrl(url: string): string {
		const normalized = this.normalizeAssetPath(url);
		if (!normalized) return '';
		if (normalized.startsWith('http')) return normalized;
		return normalized.startsWith('/uploads/') ? this.serverBase + normalized : normalized;
	}

	listPages(): Observable<Array<{ key: CmsPageKey; hasContent: boolean; updatedAt?: string }>> {
		return this.http.get<Array<{ key: CmsPageKey; hasContent: boolean; updatedAt?: string }>>(`${this.apiBase}/content`);
	}

	loadPageState<T>(pageKey: CmsPageKey, fallback: T): Observable<T> {
		return this.http.get<T>(`${this.apiBase}/content/${pageKey}`).pipe(
			// اعرض نسخة الفرونت فورًا، ثم حدّثها من الـ CMS في الخلفية.
			startWith(fallback),
			catchError(() => EMPTY)
		);
	}

	watchPageState<T>(pageKey: CmsPageKey, refreshMs = 5000): Observable<T> {
		return timer(0, refreshMs).pipe(
			switchMap(() => this.http.get<T>(`${this.apiBase}/content/${pageKey}`).pipe(catchError(() => EMPTY)))
		);
	}

	savePageState<T>(pageKey: CmsPageKey, state: T): Observable<T> {
		const token = this.auth.getToken();
		const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

		return this.http.put<T>(`${this.apiBase}/content/${pageKey}`, state, { headers }).pipe(timeout({ each: 15000 }));
	}

	uploadImage(file: File, pageKey?: string): Observable<string> {
		const token = this.auth.getToken();
		const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
		const body = new FormData();
		body.append('file', file);
		if (pageKey) body.append('pageKey', pageKey);

		return this.http.post<{ url: string }>(`${this.apiBase}/uploads`, body, { headers }).pipe(
			map(res => this.normalizeAssetPath(res.url))
		);
	}
}
