import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class CanonicalService {
	private readonly document = inject(DOCUMENT);
	private readonly router = inject(Router);
	private readonly siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';

	setCanonical(url?: string) {
		const head = this.document.head as HTMLHeadElement;
		let link: HTMLLinkElement | null = head.querySelector('link[rel="canonical"]');
		if (!link) {
			link = this.document.createElement('link');
			link.setAttribute('rel', 'canonical');
			head.appendChild(link);
		}
		const href = url || this.siteUrl.replace(/\/$/, '') + this.router.url;
		link.setAttribute('href', href);
	}
}
