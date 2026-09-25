import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CanonicalService } from '../../core/canonical.service';
import { SeoService } from '../../core/seo.service';
import { StyledSelectComponent } from '../../shared/components/styled-select/styled-select.component';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';

const PHONE_PATTERN = /^01\d{9}$/;
const WHEEL_SPIN_DURATION_MS = 5200;
const WHEEL_REQUEST_TIMEOUT_MS = 15000;

declare global {
	interface Window {
		NG_LAUNCH_OFFER_ENDPOINT?: string;
	}
}

function normalizePhone(value: string): string {
	return value
		.replace(/[٠-٩]/g, digit => String(digit.charCodeAt(0) - '٠'.charCodeAt(0)))
		.replace(/[۰-۹]/g, digit => String(digit.charCodeAt(0) - '۰'.charCodeAt(0)))
		.replace(/\D/g, '');
}

@Component({
	selector: 'app-batch-2027',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterLink, StyledSelectComponent],
	templateUrl: './batch-2027.page.html',
	styleUrls: ['./batch-2027.page.css']
})
export class Batch2027PageComponent implements OnInit, OnDestroy {
	showHeroSubscriptionChoices = false;
	giftOptions = [
		{ id: 'cash-50', label: '50 جنيه', value: '50 جنيه', detail: 'هدية مالية', available: true, emoji: '50 جنيه', weight: 30 },
		{ id: 'lucky-chance', label: 'حظ سعيد', value: 'فرصة', detail: 'محاولة إضافية', available: false, emoji: 'حظ سعيد', weight: 67 },
		{ id: 'discount-10', label: 'خصم 10%', value: '10%', detail: 'خصم على أول شهر', available: true, emoji: 'خصم 10%', weight: 10 },
		{ id: 'cash-200', label: '200 جنيه', value: '200 جنيه', detail: 'هدية مالية', available: true, emoji: '200 جنيه', weight: 10 },
		{ id: 'lucky-empty-1', label: 'حظ سعيد', value: 'فارغ', detail: 'حظ سعيد', available: false, emoji: 'حظ سعيد', weight: 67 },
		{ id: 'discount-15', label: 'خصم 15%', value: '15%', detail: 'خصم على أول شهر', available: true, emoji: 'خصم 15%', weight: 10 },
		{ id: 'cash-100', label: '100 جنيه', value: '100 جنيه', detail: 'هدية مالية', available: true, emoji: '100 جنيه', weight: 30 },
		{ id: 'lucky-empty-2', label: 'حظ سعيد', value: 'فارغ', detail: 'حظ سعيد', available: false, emoji: 'حظ سعيد', weight: 66 },
		{ id: 'discount-20', label: 'خصم 20%', value: '20%', detail: 'خصم على أول شهر', available: true, emoji: 'خصم 20%', weight: 10 },
	];
	giftAvailable = true;
	showGiftResult = false;
	giftOpening = false;
	giftRewardsVisible = false;
	selectedGift = '';
	openedGift = '';
	giftWheelSpinning = false;
	wheelRotation = 0;
	wheelAttempts = 0;
	wheelLocked = false;
	wheelResult: (typeof this.giftOptions)[number] | null = null;
	wheelToken = '';
	wheelSessionId = '';
	wheelClaim = { name: '', whatsapp: '', program: '' };
	programOptions: string[] = [
		'معادلة هندسة عربي',
		'معادلة حاسبات عربي',
		'معادلة هندسة إنجليزي',
		'معادلة حاسبات إنجليزي'
	];
	wheelClaimError = '';
	wheelClaimSubmitting = false;
	wheelClaimComplete = false;
	wheelUsed = false;
	wheelAlreadyUsed = false;
	wheelExistingGift = '';
	private giftRevealTimer?: ReturnType<typeof setTimeout>;
	private wheelTimer?: number;
	wheelAwaitingResult = false;
	wheelTransitionDuration = WHEEL_SPIN_DURATION_MS;

	toggleHeroSubscriptionChoices(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.showHeroSubscriptionChoices = !this.showHeroSubscriptionChoices;
	}

	closeHeroSubscriptionChoices(): void {
		this.showHeroSubscriptionChoices = false;
	}

	lead = {
		name: '', whatsapp: '', school: '', studentType: '', program: '', source: ''
	};
	offerStudentTypeOptions: string[] = ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 3 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 5 سنوات'];
	offerSourceOptions: string[] = ['فيسبوك', 'إنستجرام', 'تيك توك', 'يوتيوب', 'ترشيح من صديق', 'أخرى'];
	heroEyebrow = 'مشوارك يبدأ من هنا';
	heroTitle = 'كلية هندسة';
	heroHighlight = 'أقرب مما تتخيل';
	heroFeatures: string[] = ['شرح مبسط وخطة واضحة', 'متابعة مستمرة معاك', 'محتوى متحدث لدفعة 2027'];
	joinEyebrow = 'خليك أول واحد يعرف';
	joinTitle = 'سجل دلوقتي';
	joinHighlight = 'وخد أولوية العروض والخصومات';
	joinDescription = 'سيب بياناتك واحجز أولوية التواصل قبل بداية الدفعة الجديدة.';
	submitLabel = 'احصل على الخصم الآن';
	isPageVisible = true;
	wheelVisible = true;
	offerContactConsent = false;
	offerSubmitting = false;
	offerSubmitted = false;
	offerError = '';
	private readonly launchOfferEndpoint = '/api/launch-offer';
	private readonly giftWhatsAppNumber = '201080681865';

	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private contentService: MonthlyContentService
	) {}

	openGiftBox(): void {
		this.showGiftResult = true;
		this.giftOpening = false;
		this.giftRewardsVisible = this.giftAvailable;
		this.selectedGift = '';
		this.openedGift = '';
		if (this.giftRevealTimer) clearTimeout(this.giftRevealTimer);
	}

	startGiftWheel(): void {
		if (this.giftWheelSpinning || this.wheelUsed || this.wheelLocked) {
			if (this.wheelUsed || this.wheelLocked) this.wheelClaimError = 'اللفة خلصت. شكرًا لمشاركتك.';
			return;
		}
		this.spinGiftWheel();
	}

	private async spinGiftWheel(): Promise<void> {
		if (this.giftWheelSpinning) return;
		if (this.wheelTimer) clearTimeout(this.wheelTimer);
		this.giftWheelSpinning = true;
		this.wheelAwaitingResult = true;
		this.wheelResult = null;
		this.selectedGift = '';
		this.wheelAlreadyUsed = false;
		this.wheelExistingGift = '';
		this.wheelClaimComplete = false;
		this.selectedGift = '';
		this.wheelClaimError = '';
		this.wheelAttempts += 1;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), WHEEL_REQUEST_TIMEOUT_MS);
		try {
		const payload = await this.requestWheelSpinFromServer(controller.signal);
		if (payload?.success === false || !payload?.token || !payload?.gift?.id) {
			this.wheelAttempts -= 1;
			this.giftWheelSpinning = false;
			this.wheelAwaitingResult = false;
			this.wheelClaimError = payload?.message || 'تعذر تشغيل العجلة. حاول تاني.';
			return;
		}
		this.wheelToken = payload.token;
		const resultIndex = this.giftOptions.findIndex(gift => gift.id === payload.gift?.id);
		if (resultIndex < 0) {
			this.wheelAttempts -= 1;
			this.giftWheelSpinning = false;
			this.wheelAwaitingResult = false;
			this.wheelClaimError = 'تعذر قراءة نتيجة العجلة. حاول تاني.';
			return;
		}
		// The API decides the prize first. Only then do we start one fixed,
		// visible animation and reveal the result after that animation ends.
		this.wheelTransitionDuration = WHEEL_SPIN_DURATION_MS;
		window.requestAnimationFrame(() => {
			// The disc keeps its previous rotation between spins. Calculate the
			// shortest clockwise offset from the current angle so the server's
			// result always lands under the fixed top pointer.
			const currentAngle = ((this.wheelRotation % 360) + 360) % 360;
			const targetAngle = (360 - (resultIndex * 40 + 20)) % 360;
			const alignmentOffset = (targetAngle - currentAngle + 360) % 360;
			this.wheelRotation += 1440 + alignmentOffset;
		});
		this.wheelTimer = window.setTimeout(() => {
			this.wheelResult = this.giftOptions[resultIndex];
			this.selectedGift = '';
			const exhausted = Boolean(payload.exhausted) || Number(payload.remainingAttempts) === 0;
			this.wheelUsed = Boolean(this.wheelResult.available || exhausted);
			this.wheelLocked = this.wheelUsed;
			this.giftWheelSpinning = false;
			this.wheelAwaitingResult = false;
			this.wheelTransitionDuration = WHEEL_SPIN_DURATION_MS;
		}, WHEEL_SPIN_DURATION_MS);
		} catch (error) {
			this.wheelAttempts -= 1;
			this.wheelAwaitingResult = false;
			this.giftWheelSpinning = false;
			this.wheelClaimError = error instanceof Error ? error.message : 'تعذر تشغيل العجلة. حاول تاني.';
		} finally {
			window.clearTimeout(timeout);
		}
	}

	private async requestWheelSpinFromServer(signal: AbortSignal): Promise<any> {
		const response = await fetch(this.resolveWheelEndpoint('spin'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
			body: new URLSearchParams({ action: 'spin', sessionId: this.wheelSessionId }),
			signal
		});
		const payload = await response.json();
		if (!response.ok) throw new Error(payload.message || 'تعذر تشغيل العجلة. حاول تاني.');
		return payload;
	}

	private async checkWheelPhone(whatsapp: string): Promise<{ registered?: boolean; gift?: string; message?: string }> {
		const response = await fetch(`${this.resolveWheelEndpoint('check')}?whatsapp=${encodeURIComponent(whatsapp)}`, { method: 'GET' });
		const payload = await response.json();
		if (!response.ok) throw new Error(payload.message || 'تعذر فحص الرقم. حاول تاني.');
		return payload;
	}

	private createClientToken(): string {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID();
		}
		return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	updateWheelPhone(value: string): void {
		this.wheelClaim.whatsapp = normalizePhone(value).slice(0, 11);
		this.wheelClaimError = '';
	}

	get wheelPhoneLength(): number {
		return this.wheelClaim.whatsapp.length;
	}

	async submitWheelClaim(): Promise<void> {
		if (this.wheelClaimSubmitting) return;
		this.wheelClaimError = '';
		this.wheelAlreadyUsed = false;
		this.wheelExistingGift = '';
		this.wheelClaimComplete = false;
		this.selectedGift = '';
		const name = this.wheelClaim.name.trim();
		const program = this.wheelClaim.program.trim();
		const whatsapp = normalizePhone(this.wheelClaim.whatsapp);
		this.wheelClaim.whatsapp = whatsapp;
		if (name.length < 2) {
			this.wheelClaimError = 'اكتب اسمك الأول والثاني على الأقل.';
			return;
		}
		if (!this.programOptions.includes(program)) {
			this.wheelClaimError = 'اختار نوع المعادلة الأول.';
			return;
		}
		if (!PHONE_PATTERN.test(whatsapp)) {
			this.wheelClaimError = `اكتب رقم واتساب مصري صحيح من 11 رقم يبدأ بـ 01. المكتوب حاليًا ${whatsapp.length} رقم.`;
			return;
		}
		try {
			const phoneCheck = await this.checkWheelPhone(whatsapp);
			if (phoneCheck.registered) {
				this.wheelClaimError = phoneCheck.message || 'تم تسجيل هذا الرقم من قبل.';
				this.wheelAlreadyUsed = true;
				this.wheelExistingGift = phoneCheck.gift || '';
				this.wheelClaimComplete = false;
				this.selectedGift = '';
				this.wheelUsed = true;
				return;
			}
		} catch (error) {
			this.wheelClaimError = error instanceof Error ? error.message : 'تعذر فحص الرقم. حاول تاني.';
			return;
		}
		if (!this.wheelToken || !this.wheelResult?.available) {
			this.wheelClaimError = 'لف العجلة أولًا للحصول على هدية.';
			return;
		}

		this.wheelClaimSubmitting = true;
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 35000);
		try {
			const claimBody = new URLSearchParams({
				action: 'claim',
				name,
				whatsapp,
				program,
				gift: this.wheelResult.label,
				wheelToken: this.wheelToken,
				sessionId: this.wheelSessionId
			});
			const response = await fetch(this.resolveWheelEndpoint('claim'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
				body: claimBody,
				signal: controller.signal
			});
			const payload = await response.json() as { success?: boolean; alreadyRegistered?: boolean; message?: string; gift?: string };
			if (!response.ok) throw new Error(payload.message || 'تعذر تسجيل هدية العجلة.');
				if (payload.alreadyRegistered) {
					this.wheelClaimError = payload.message || 'تم تسجيل هذا الرقم من قبل.';
					this.wheelAlreadyUsed = true;
					this.wheelExistingGift = payload.gift || '';
					this.wheelClaimComplete = false;
					this.selectedGift = '';
					this.wheelUsed = true;
					return;
				}
				if (!payload.success) throw new Error(payload.message || 'تعذر تسجيل هدية العجلة.');
				this.wheelClaimComplete = true;
				this.selectedGift = payload.gift || this.wheelResult.label;
				this.wheelUsed = true;
				return;
		} catch (error) {
			this.wheelClaimError = error instanceof DOMException && error.name === 'AbortError'
				? 'خدمة تسجيل العجلة اتأخرت. من فضلك ما تضغطش مرة تانية.'
				: error instanceof Error ? error.message : 'تعذر تسجيل هدية العجلة.';
		} finally {
			window.clearTimeout(timeout);
			this.wheelClaimSubmitting = false;
		}
	}

	private resolveWheelEndpoint(action: 'spin' | 'claim' | 'check'): string {
		// The Node API is the single source of truth for spins and claims.
		return `/api/wheel/${action}`;
	}

	closeGiftResult(): void {
		if (this.wheelTimer) clearTimeout(this.wheelTimer);
		this.showGiftResult = false;
		this.giftOpening = false;
		this.giftRewardsVisible = false;
		this.openedGift = '';
		this.giftWheelSpinning = false;
		this.wheelAwaitingResult = false;
		this.wheelResult = null;
		this.wheelClaimComplete = false;
		this.wheelAlreadyUsed = false;
		this.wheelExistingGift = '';
		this.selectedGift = '';
		if (this.giftRevealTimer) clearTimeout(this.giftRevealTimer);
	}

	openSmallGift(gift: (typeof this.giftOptions)[number]): void {
		this.openedGift = gift.id;
		this.selectedGift = gift.available ? gift.label : '';
	}

	claimGiftOnWhatsApp(): void {
		this.openGiftWhatsApp();
	}

	private openGiftWhatsApp(): void {
		const message = [
			'السلام عليكم، عايز أستلم هدية دفعة 2027.',
			`الاسم: ${this.wheelClaim.name.trim() || 'غير مسجل'}`,
			`رقم الواتساب: ${this.wheelClaim.whatsapp || 'غير مسجل'}`,
			`الخصم/الهدية: ${this.selectedGift || 'خصم 10% وشحن الكتاب مجاناً'}`
		].join('\n');
		const whatsappUrl = `https://wa.me/${this.giftWhatsAppNumber}?text=${encodeURIComponent(message)}`;
		const whatsappWindow = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
		if (!whatsappWindow) window.location.href = whatsappUrl;
	}

	ngOnDestroy(): void {
		if (this.giftRevealTimer) clearTimeout(this.giftRevealTimer);
		if (this.wheelTimer) clearTimeout(this.wheelTimer);
	}

	ngOnInit(): void {
		if (typeof window === 'undefined') return;
		const wheelSessionKey = 'batch-2027-wheel-session-v2';
		this.wheelSessionId = sessionStorage.getItem(wheelSessionKey) || this.createClientToken();
		sessionStorage.setItem(wheelSessionKey, this.wheelSessionId);

		const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
		const title = 'دفعة 2027 | ابدأ صح مع أبلكيشن معادلة كلية هندسة';
		const description = 'انضم لدفعة 2027 واحصل على محتوى مجاني، هدايا وخصومات وخطة واضحة تساعدك تبدأ طريق معادلة كلية الهندسة.';
		const url = `${siteUrl}/batch-2027`;

		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
		this.contentService.loadPageState('batch-2027', cmsPageDefaults['batch-2027']).subscribe(content => this.applyCmsState(content));
	}

	private applyCmsState(raw: unknown): void {
		const state = raw as any;
		if (!state) return;
		this.isPageVisible = state.visible !== false;
		this.wheelVisible = state.wheelVisible !== false;
		this.heroEyebrow = state.eyebrow || this.heroEyebrow;
		this.heroTitle = state.title || this.heroTitle;
		this.heroHighlight = state.highlight || this.heroHighlight;
		if (Array.isArray(state.features) && state.features.length) this.heroFeatures = state.features;
		if (Array.isArray(state.programOptions) && state.programOptions.length) this.programOptions = state.programOptions;
		if (Array.isArray(state.studentTypeOptions) && state.studentTypeOptions.length) this.offerStudentTypeOptions = state.studentTypeOptions;
		if (Array.isArray(state.sourceOptions) && state.sourceOptions.length) this.offerSourceOptions = state.sourceOptions;
		this.joinEyebrow = state.joinEyebrow || this.joinEyebrow;
		this.joinTitle = state.joinTitle || this.joinTitle;
		this.joinHighlight = state.joinHighlight || this.joinHighlight;
		this.joinDescription = state.joinDescription || this.joinDescription;
		this.submitLabel = state.submitLabel || this.submitLabel;
	}

	private async postLead(data: Record<string, string>): Promise<{ success?: boolean; localSaved?: boolean; alreadyRegistered?: boolean; message?: string }> {
		const controller = new AbortController();
		const timeout = window.setTimeout(() => controller.abort(), 70000);
		const response = await fetch(this.launchOfferEndpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
			body: new URLSearchParams(data).toString(),
			signal: controller.signal
		});
		try {
			const responseText = await response.text();
			let payload: { success?: boolean; alreadyRegistered?: boolean; message?: string };
			try {
				payload = JSON.parse(responseText);
			} catch {
				throw new Error('invalid-response');
			}
			if (!response.ok) throw new Error(payload.message || `request-failed-${response.status}`);
			return payload;
		} finally {
			window.clearTimeout(timeout);
		}
	}

	async submitLaunchOffer(): Promise<void> {
		if (this.offerSubmitting) return;
		if (!this.lead.name.trim()) { this.offerError = 'اكتب الاسم الثلاثي.'; return; }
		if (!this.lead.whatsapp.trim()) { this.offerError = 'اكتب رقم الواتساب.'; return; }
		if (!this.lead.school.trim()) { this.offerError = 'اكتب اسم المدرسة أو المعهد.'; return; }
		if (!this.lead.studentType) { this.offerError = 'اختار نوع التعليم.'; return; }
		if (!this.lead.program) { this.offerError = 'اختار نوع المعادلة.'; return; }
		if (!this.lead.source) { this.offerError = 'اختار عرفتَنا منين.'; return; }
		if (!this.offerContactConsent) {
			this.offerError = 'لازم توافق على التواصل قبل إرسال البيانات.';
			return;
		}
		if (!PHONE_PATTERN.test(this.lead.whatsapp.trim())) {
			this.offerError = 'اكتب رقم واتساب صحيح يبدأ بـ 01 ويتكون من 11 رقم.';
			return;
		}
		this.offerSubmitting = true;
		this.offerError = '';
		const lead = { name: this.lead.name.trim(), whatsapp: this.lead.whatsapp.trim(), school: this.lead.school.trim(), studentType: this.lead.studentType, program: this.lead.program, source: this.lead.source, consent: this.offerContactConsent ? 'نعم' : 'لا' };
		try {
			const payload = await this.postLead(lead);
			if (payload.alreadyRegistered) {
				this.offerError = 'رقم الواتساب ده مسجل بالفعل.';
				return;
			}
			if (!payload.success && !payload.localSaved) throw new Error(payload.message || 'request-failed');
			this.offerSubmitted = true;
			if (typeof window !== 'undefined') localStorage.setItem('launch-offer-lead', JSON.stringify({ ...lead, createdAt: new Date().toISOString() }));
		} catch (error) {
			this.offerError = error instanceof Error && !['invalid-response', 'request-failed'].includes(error.message)
				? error.message
				: 'حصلت مشكلة بسيطة في الاتصال. حاول تاني من فضلك.';
		} finally {
			this.offerSubmitting = false;
		}
	}

}
