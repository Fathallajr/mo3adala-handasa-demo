import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { SubscriptionChoiceTriggerComponent } from '../../shared/components/subscription-choice-trigger/subscription-choice-trigger.component';
import { StyledSelectComponent } from '../../shared/components/styled-select/styled-select.component';
import { captureLeadAttribution } from '../../core/lead-attribution';

const SOCIAL_PHONE_PATTERN = /^01\d{9}$/;

@Component({
	selector: 'app-social-page',
	standalone: true,
	imports: [CommonModule, FormsModule, SubscriptionChoiceTriggerComponent, StyledSelectComponent],
	templateUrl: './social.page.html',
	styleUrls: ['./social.page.css'],
})
export class SocialPageComponent implements OnInit {
	private readonly contentService = inject(MonthlyContentService);
	studentWhatsapp = '201554843745';
	parentWhatsapp = '201554843745';
	phoneNumber = '+201554843745';
	lead = { name: '', whatsapp: '', school: '', studentType: '', program: '', source: '' };
	offerStudentTypeOptions = ['المعاهد الفنية', 'الثانوية الصناعية نظام 3 سنوات', 'الثانوية الصناعية نظام 5 سنوات', 'تكنولوجيا تطبيقية نظام 3 سنوات', 'تكنولوجيا تطبيقية نظام 5 سنوات'];
	offerSourceOptions = ['فيسبوك', 'إنستجرام', 'تيك توك', 'يوتيوب', 'ترشيح من صديق', 'أخرى'];
	programOptions = ['معادلة هندسة عربي', 'معادلة حاسبات عربي', 'معادلة هندسة لغات', 'معادلة حاسبات لغات'];
	offerContactConsent = false;
	offerSubmitting = false;
	offerSubmitted = false;
	offerError = '';

	constructor(private seo: SeoService, private canonical: CanonicalService, private changeDetector: ChangeDetectorRef) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'تابعنا وتواصل معنا - معادلة كلية هندسة';
		const description = 'كل روابط حساباتنا وطرق التواصل معنا في مكان واحد.';
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url: siteUrl.replace(/\/$/, '') + '/contact' });
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

	private async postLead(data: Record<string, string>): Promise<{ success?: boolean; localSaved?: boolean; alreadyRegistered?: boolean; message?: string }> {
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 15000);
		try {
			const response = await fetch('/api/launch-offer', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' }, body: new URLSearchParams(data).toString(), cache: 'no-store', signal: controller.signal });
			const responseText = await response.text();
			let payload: { success?: boolean; localSaved?: boolean; alreadyRegistered?: boolean; message?: string };
			try { payload = JSON.parse(responseText); } catch { throw new Error('invalid-response'); }
			if (!response.ok) throw new Error(payload.message || `request-failed-${response.status}`);
			return payload;
		} finally { window.clearTimeout(timeout); }
	}

	async submitLaunchOffer(): Promise<void> {
		if (this.offerSubmitting) return;
		if (!this.lead.name.trim()) { this.offerError = 'اكتب الاسم الثلاثي.'; return; }
		if (!this.lead.whatsapp.trim()) { this.offerError = 'اكتب رقم الواتساب.'; return; }
		if (!this.lead.school.trim()) { this.offerError = 'اكتب اسم المدرسة أو المعهد.'; return; }
		if (!this.lead.studentType) { this.offerError = 'اختار نوع التعليم.'; return; }
		if (!this.lead.program) { this.offerError = 'اختار نوع المعادلة.'; return; }
		if (!this.lead.source) { this.offerError = 'اختار عرفتَنا منين.'; return; }
		if (!this.offerContactConsent) { this.offerError = 'لازم توافق على التواصل قبل إرسال البيانات.'; return; }
		if (!SOCIAL_PHONE_PATTERN.test(this.lead.whatsapp.trim())) { this.offerError = 'اكتب رقم واتساب صحيح يبدأ بـ 01 ويتكون من 11 رقم.'; return; }
		this.offerSubmitting = true;
		this.offerError = '';
		const lead = { name: this.lead.name.trim(), whatsapp: this.lead.whatsapp.trim(), school: this.lead.school.trim(), studentType: this.lead.studentType, program: this.lead.program, source: this.lead.source, consent: 'نعم', attribution: JSON.stringify(captureLeadAttribution()) };
		try {
			const payload = await this.postLead(lead);
			if (payload.alreadyRegistered) { this.offerError = 'رقم الواتساب ده مسجل بالفعل.'; return; }
			if (!payload.success && !payload.localSaved) throw new Error(payload.message || 'request-failed');
			this.offerSubmitted = true;
		} catch (error) {
			this.offerError = error instanceof Error && !['invalid-response', 'request-failed'].includes(error.message) ? error.message : 'حصلت مشكلة بسيطة في الاتصال. حاول تاني من فضلك.';
		} finally { this.offerSubmitting = false; this.changeDetector.detectChanges(); }
	}
}


