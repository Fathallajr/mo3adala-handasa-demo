import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { SubscriptionChoiceTriggerComponent } from '../../shared/components/subscription-choice-trigger/subscription-choice-trigger.component';

@Component({
	selector: 'app-social-page',
	standalone: true,
	imports: [CommonModule, SubscriptionChoiceTriggerComponent],
	templateUrl: './social.page.html',
	styleUrls: ['./social.page.css'],
})
export class SocialPageComponent implements OnInit {
	private readonly contentService = inject(MonthlyContentService);
	studentWhatsapp = '201554843745';
	parentWhatsapp = '201554843745';
	phoneNumber = '+201554843745';

	constructor(private seo: SeoService, private canonical: CanonicalService) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'تابعنا وتواصل معنا - معادلة كلية هندسة';
		const description = 'كل روابط حساباتنا وطرق التواصل معنا في مكان واحد.';
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url: siteUrl.replace(/\/$/, '') + '/success-story' });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical();
	}

	ngOnInit(): void {
		this.contentService.loadPageState('contact', cmsPageDefaults.contact).subscribe(content => {
			const state = content as { studentWhatsapp?: string; parentWhatsapp?: string; phoneNumber?: string };
			this.studentWhatsapp = state.studentWhatsapp || this.studentWhatsapp;
			this.parentWhatsapp = state.parentWhatsapp || this.parentWhatsapp;
			this.phoneNumber = state.phoneNumber || this.phoneNumber;
		});
	}
}


