import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
	private readonly title = inject(Title);
	private readonly meta = inject(Meta);

	setTitle(value: string) {
		this.title.setTitle(value);
		this.meta.updateTag({ property: 'og:title', content: value });
		this.meta.updateTag({ name: 'twitter:title', content: value });
	}

	setDescription(description: string) {
		this.meta.updateTag({ name: 'description', content: description });
		this.meta.updateTag({ property: 'og:description', content: description });
		this.meta.updateTag({ name: 'twitter:description', content: description });
	}

	setRobots(content: string) {
		this.meta.updateTag({ name: 'robots', content });
	}

	setOgTags(opts: { title?: string; description?: string; url?: string; image?: string; imageAlt?: string }) {
		if (opts.title) this.meta.updateTag({ property: 'og:title', content: opts.title });
		if (opts.description) this.meta.updateTag({ property: 'og:description', content: opts.description });
		if (opts.url) this.meta.updateTag({ property: 'og:url', content: opts.url });
		if (opts.image) this.meta.updateTag({ property: 'og:image', content: opts.image });
		if (opts.imageAlt) this.meta.updateTag({ property: 'og:image:alt', content: opts.imageAlt });
		this.meta.updateTag({ property: 'og:type', content: 'website' });
	}

	setTwitterTags(opts: { title?: string; description?: string; image?: string }) {
		this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
		if (opts.title) this.meta.updateTag({ name: 'twitter:title', content: opts.title });
		if (opts.description) this.meta.updateTag({ name: 'twitter:description', content: opts.description });
		if (opts.image) this.meta.updateTag({ name: 'twitter:image', content: opts.image });
	}
}
