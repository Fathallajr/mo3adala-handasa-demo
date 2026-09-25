import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
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
		if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
			return 'http://localhost:3001';
		}

		return '';
	}

	resolveAssetUrl(url: string): string {
		if (!url) return '';
		if (url.startsWith('http')) return url;
		return this.serverBase + url;
	}

	listPages(): Observable<Array<{ key: CmsPageKey; hasContent: boolean; updatedAt?: string }>> {
		return this.http.get<Array<{ key: CmsPageKey; hasContent: boolean; updatedAt?: string }>>(`${this.apiBase}/content`);
	}

	loadPageState<T>(pageKey: CmsPageKey, fallback: T): Observable<T> {
		return this.http.get<T>(`${this.apiBase}/content/${pageKey}`).pipe(
			catchError(() => of(fallback))
		);
	}

	savePageState<T>(pageKey: CmsPageKey, state: T): Observable<T> {
		const token = this.auth.getToken();
		const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

		return this.http.put<T>(`${this.apiBase}/content/${pageKey}`, state, { headers });
	}

	uploadImage(file: File): Observable<string> {
		const token = this.auth.getToken();
		const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
		const body = new FormData();
		body.append('file', file);

		return this.http.post<{ url: string }>(`${this.apiBase}/uploads`, body, { headers }).pipe(
			map(res => res.url)
		);
	}
}
