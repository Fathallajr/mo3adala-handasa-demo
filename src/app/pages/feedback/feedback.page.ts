import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';
import { finalize, timeout } from 'rxjs';

@Component({
	selector: 'app-feedback-page',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterLink],
	templateUrl: './feedback.page.html',
	styleUrls: ['./feedback.page.css'],
})
export class FeedbackPageComponent {
	submitted = false;
	submitting = false;
	submitError = '';
	eyebrow = 'صوتك يهمنا';
	title = 'قول رأيك في الأبليكيشن';
	description = 'رأيك بيساعدنا نطوّر المحتوى والمتابعة ونقدّم تجربة أفضل لكل طالب.';
	isPageVisible = true;
	private readonly feedbackEndpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001/api/feedback' : '/api/feedback';

	constructor(private seo: SeoService, private canonical: CanonicalService, private contentService: MonthlyContentService, private http: HttpClient) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'شاركنا رأيك - أبلكيشن معادلة كلية هندسة';
		const description = 'شارك تجربتك مع أبلكيشن معادلة كلية الهندسة وساعدنا نحسّن المحتوى والمتابعة للطلاب.';
		const url = `${siteUrl}/feedback`;
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
		this.contentService.loadPageState('feedback', cmsPageDefaults.feedback).subscribe(content => {
			const state = content as any;
			this.isPageVisible = state?.visible !== false;
			this.eyebrow = state?.eyebrow || this.eyebrow;
			this.title = state?.title || this.title;
			this.description = state?.description || this.description;
		});
	}

	submitFeedback(form: NgForm): void {
		if (form.invalid || this.submitting) return;

		this.submitting = true;
		this.submitError = '';
		this.submitted = true;
		this.http.post(this.feedbackEndpoint, {
					name: form.value.name,
					university: form.value.university,
					rating: form.value.rating,
					message: form.value.message,
			}).pipe(
				timeout(15000),
				finalize(() => { this.submitting = false; })
			).subscribe({
				next: () => undefined,
				error: () => { this.submitted = false; this.submitError = 'تعذر حفظ رأيك. تأكد من اتصال السيرفر ثم حاول مرة أخرى.'; }
			});
	}
}
