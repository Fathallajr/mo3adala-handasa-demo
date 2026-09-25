import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class JsonLdService {
	private readonly document = inject(DOCUMENT);

	setJsonLd(data: unknown, id = 'structured-data') {
		let script = this.document.getElementById(id) as HTMLScriptElement | null;
		if (!script) {
			script = this.document.createElement('script');
			script.type = 'application/ld+json';
			script.id = id;
			this.document.head.appendChild(script);
		}
		script.text = JSON.stringify(data);
	}
}
