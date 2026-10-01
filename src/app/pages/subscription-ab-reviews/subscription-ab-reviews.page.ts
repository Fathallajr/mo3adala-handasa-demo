import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { displayProgramLabel } from '../../core/program-labels';
import { CmsPageKey } from '../../core/cms-page.registry';
import { Subscription } from 'rxjs';

interface ScheduleImage {
	group: string;
	src: string;
	alt: string;
	note?: string;
}

interface ReviewFormConfig {
	label: string;
	description: string;
	buttonText: string;
	link: string;
	isClosed: boolean;
	allowOpenWhenClosed?: boolean;
}

@Component({
	selector: 'app-subscription-ab-reviews',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './subscription-ab-reviews.page.html',
	styleUrls: ['./subscription-ab-reviews.page.css']
})
export class SubscriptionAbReviewsPageComponent implements OnInit, OnDestroy {
	private readonly defaultEnrollmentExpiresAt = '2026-10-10T19:00:00.000Z';
	private readonly arabicEnrollmentFormLink = 'https://forms.gle/mhopqPdxUPxQEN9K8';
	private readonly englishEnrollmentFormLink = 'https://forms.gle/WFv9urJ1QDu3eE5y9';
	private readonly computersEnglishEnrollmentFormLink = 'https://forms.gle/WFv9urJ1QDu3eE5y9';
	private contentSubscription?: Subscription;
	isComputersSubscription = false;
	isEnglishSubscription = false;
	subscriptionProgramLabel = 'معادلة هندسة عربي';
	copiedNumber: string | null = null;
	isImageModalOpen = false;
	activeScheduleImage: ScheduleImage | null = null;
	isScheduleReady = false;
	isEnrollmentClosed = false;
	isCountdownEnabled = false;
	enrollmentReopenMessage = 'سيتم فتح الاشتراك مع بداية الشهر القادم بإذن الله.';
	shuffledVodafoneNumbers: { number: string; owner: string }[] = [];
	isVideoLoaded = false;
	closingDays = 0;
	closingHours = 0;
	closingMinutes = 0;
	closingSeconds = 0;
	closingDateLabel = '';

	get heroProgramLabel(): string {
		if (!this.isEnglishSubscription) return this.subscriptionProgramLabel;
		return this.isComputersSubscription ? 'Computer Equivalency' : 'Engineering Equivalency';
	}

	get heroMonthLabel(): string {
		return this.isEnglishSubscription ? 'October' : 'شهر أكتوبر';
	}

	get heroClosingDateLabel(): string {
		return this.isEnglishSubscription ? 'October 10' : this.closingDateLabel;
	}

	get supportWhatsAppUrl(): string {
		const message = `أنا طالب ${this.subscriptionProgramLabel} وعندي مشكلة في التسجيل ومحتاج مساعدة`;
		return `https://api.whatsapp.com/send/?phone=${this.subscriptionDetails.whatsappNumber}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
	}
	private closingDate: Date | null = null;
	private enrollmentExpiresAt = '';

	private closingTimer: ReturnType<typeof setInterval> | null = null;

	private handleVisibilityChange = () => {
		if (typeof document === 'undefined') {
			return;
		}

		if (document.visibilityState === 'visible') {
			this.shuffleVodafoneNumbers();
		}
	};

	private handleWindowFocus = () => {
		this.shuffleVodafoneNumbers();
	};

	private applyLoadedState(state: any): void {
		if (!state) {
			return;
		}
		this.isScheduleReady = true;

		const configuredExpiry = String(state.enrollmentWindow?.expiresAt || '');
		const configuredExpiryTime = Date.parse(configuredExpiry);
		const hasConfiguredExpiry = Number.isFinite(configuredExpiryTime);
		if (configuredExpiry) {
			this.enrollmentExpiresAt = configuredExpiry;
			this.closingDate = hasConfiguredExpiry ? new Date(configuredExpiryTime) : null;
		} else {
			this.enrollmentExpiresAt = '';
			this.closingDate = null;
		}
		this.isCountdownEnabled = hasConfiguredExpiry;
		if (typeof state.isEnrollmentClosed === 'boolean') {
			this.isEnrollmentClosed = state.isEnrollmentClosed;
			if (state.isEnrollmentClosed || !hasConfiguredExpiry) {
				this.stopClosingTimer();
			} else if (!this.closingTimer) {
				this.updateClosingCountdown();
				if (!this.isEnrollmentClosed) this.closingTimer = setInterval(() => this.updateClosingCountdown(), 1000);
			}
		} else {
			this.stopClosingTimer();
		}
		this.enrollmentReopenMessage = state.enrollmentReopenMessage ?? this.enrollmentReopenMessage;

		const loaded = state.subscriptionDetails;
		if (loaded) {
			const legacyForm = loaded.googleForm ?? loaded.googleForms?.groupAB ?? loaded.googleForms?.groupA ?? loaded.googleForms?.groupB;
			this.subscriptionDetails = {
				...this.subscriptionDetails,
				...loaded,
				review: {
					...this.subscriptionDetails.review,
					...(loaded.review ?? {}),
					name: loaded.review?.name ?? this.subscriptionDetails.review.name,
					price: loaded.review?.price ?? loaded.groupB?.price ?? loaded.groupA?.price ?? this.subscriptionDetails.review.price
				},
				googleForm: {
					...this.subscriptionDetails.googleForm,
					...(legacyForm ?? {})
				},
				vodafoneNumbers: loaded.vodafoneNumbers?.length
					? loaded.vodafoneNumbers
					: this.subscriptionDetails.vodafoneNumbers,
				// Keep each public subscription route isolated. Uploaded CMS assets
				// are valid for the selected route, while a legacy /assets path from
				// another page must not replace this route's default schedule.
				scheduleImages: loaded.scheduleImages ?? this.subscriptionDetails.scheduleImages,
				subscriptionWarnings: {
					validity: {
						title: 'مدة صلاحية الاشتراك:',
						points: [...SUBSCRIPTION_VALIDITY_POINTS]
					},
					refund: {
						title: 'سياسة الاسترداد',
						points: [...SUBSCRIPTION_REFUND_POINTS]
					}
				}
			};
		}

		this.shuffleVodafoneNumbers();
		// The CMS refresh can complete outside the browser event cycle in some
		// dev/proxy setups; render the schedule immediately without requiring a click.
		this.changeDetector.detectChanges();
	}

	private hasValidRouteSchedules(value: unknown): value is ScheduleImage[] {
		if (!Array.isArray(value) || !value.length) return false;
		const routeSchedule = this.getRouteSchedule();
		return value.some((schedule: ScheduleImage) => {
			const src = String(schedule?.src || '').trim();
			if (!src) return false;
			if (src.startsWith('/uploads/') || src.startsWith('uploads/')) return true;
			return src === routeSchedule.src;
		});
	}

	subscriptionDetails = {
		month: 'الشهر الأول — أكتوبر',
		review: {
			name: 'اشتراك الشهر الأول',
			price: '800'
		},
		currency: 'ج',
		features: [
			'محاضرات تأسيسية من الصفر',
			'محتوى السبورة (PDF)',
			'حل الواجبات بالتفصيل',
			'اختبارات إلكترونية تقييمية أسبوعياً',
			'متابعة شخصية من التيم',
			'سيستم متابعة لمتابعة المستوى'
		],
		googleForm: {
			label: 'اشتراك الشهر الأول — دفعة 2027',
			description: 'فورم اشتراك شهر أكتوبر',
			buttonText: 'سجل فورم الاشتراك',
			link: 'https://forms.gle/yPCxfeX73FmGg2cn8',
			isClosed: false
		},
		vodafoneNumbers: [
			{ number: '01025326080', owner: 'احمد م**** ا***** ز***' },
			{ number: '01040490779', owner: 'سعد ف** ص*** ا***' },
			{ number: '01040490778', owner: 'احمد ع********* س***' },
			{ number: '01080681865', owner: 'Mona k***** A**' }
		],
		scheduleImages: [] as ScheduleImage[],
		requiredInfo: [
			'رقم الموبايل اللي حولت منه',
			'سكرين شوت بالتحويل',
			'وقت وتاريخ التحويل'
		],
		whatsappNumber: '201080681865',
		subscriptionWarnings: {
			validity: {
			title: 'مدة صلاحية الاشتراك:',
				points: [...SUBSCRIPTION_VALIDITY_POINTS]
			},
			refund: {
				title: 'سياسة الاسترداد',
				points: [...SUBSCRIPTION_REFUND_POINTS]
			}
		},
		subtitle: 'أول خطوة في رحلة دفعة 2027 — أكتوبر'
	};

	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private monthlyContent: MonthlyContentService,
		private sanitizer: DomSanitizer,
		private changeDetector: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		const pathname = typeof window !== 'undefined' ? window.location.pathname : '/subscription-engineering-ar';
		this.isComputersSubscription = pathname.includes('computers');
		this.isEnglishSubscription = pathname.endsWith('-en');
		this.subscriptionProgramLabel = `معادلة ${this.isComputersSubscription ? 'حاسبات' : 'هندسة'} ${this.isEnglishSubscription ? 'لغات' : 'عربي'}`;
		this.applySubscriptionProgram();
		if (typeof window !== 'undefined') {
			const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
			const title = `${this.subscriptionProgramLabel} | أبلكيشن معادلة كلية هندسة`;
			const description = `اشترك في ${this.subscriptionProgramLabel} بخطة واضحة للمذاكرة والمراجعة والمتابعة المستمرة.`;
			const slug = pathname.replace(/^\//, '');
			const imagePath = this.isComputersSubscription
				? (this.isEnglishSubscription ? '/assets/schedule-computers-en.jpg' : '/assets/schedule-computers-ar.jpg')
				: (this.isEnglishSubscription ? '/assets/schedule-engineering-en.jpg' : '/assets/schedule-engineering-ar.jpg');
			const url = `${siteUrl}/${slug}`;
			const image = `${siteUrl.replace(/\/$/, '')}${encodeURI(imagePath)}`;

			this.seo.setTitle(title);
			this.seo.setDescription(description);
			this.seo.setOgTags({ title, description, url, image, imageAlt: title });
			this.seo.setTwitterTags({ title, description, image });
			this.canonical.setCanonical(url);
		}

		this.shuffleVodafoneNumbers();
		this.listenForVisibilityChange();
		const contentKey = this.getSubscriptionContentKey(pathname);
		this.contentSubscription = this.monthlyContent
			.loadPageState(contentKey)
			.subscribe(state => this.applyLoadedState(state));
	}

	private getSubscriptionContentKey(pathname: string): CmsPageKey {
		if (pathname.includes('computers')) return pathname.endsWith('-en') ? 'subscription-computers-en' : 'subscription-computers-ar';
		return pathname.endsWith('-en') ? 'subscription-engineering-en' : 'subscription-engineering-ar';
	}

	private applySubscriptionProgram(): void {
		// Render the countdown with the hero on the first paint. The CMS value
		// replaces this fallback as soon as it arrives, without inserting the
		// section late and making it miss the hero animation.
		this.enrollmentExpiresAt = this.defaultEnrollmentExpiresAt;
		this.closingDate = new Date(this.defaultEnrollmentExpiresAt);
		this.isCountdownEnabled = true;
		this.updateClosingCountdown();
		if (!this.closingTimer && !this.isEnrollmentClosed) {
			this.closingTimer = setInterval(() => this.updateClosingCountdown(), 1000);
		}
		this.subscriptionDetails = {
			...this.subscriptionDetails,
			month: this.subscriptionProgramLabel,
			review: {
				...this.subscriptionDetails.review,
				name: this.subscriptionProgramLabel,
				price: this.isComputersSubscription ? '600' : '800'
			},
			subtitle: `ابدأ طريقك في ${this.subscriptionProgramLabel} باشتراك كامل بسعر ${this.isComputersSubscription ? '600' : '800'} جنيه.`,
			googleForm: {
				...this.subscriptionDetails.googleForm,
				link: this.getEnrollmentFormLink(),
				label: this.subscriptionProgramLabel,
				description: `فورم ${this.subscriptionProgramLabel}`,
				buttonText: `سجل ${this.subscriptionProgramLabel}`
			},
			scheduleImages: [this.getRouteSchedule()],
			subscriptionWarnings: {
				validity: {
					title: 'مدة صلاحية الاشتراك:',
					points: [...SUBSCRIPTION_VALIDITY_POINTS]
				},
				refund: {
					title: 'سياسة الاسترداد',
					points: [...SUBSCRIPTION_REFUND_POINTS]
				}
			}
		};
		this.isScheduleReady = true;
	}

	private getRouteSchedule(): ScheduleImage {
		const program = this.isComputersSubscription ? 'حاسبات' : 'هندسة';
		const language = this.isEnglishSubscription ? 'لغات' : 'عربي';
		const asset = this.isComputersSubscription
			? (this.isEnglishSubscription ? 'schedule-computers-en.jpg' : 'schedule-computers-ar.jpg')
			: (this.isEnglishSubscription ? 'schedule-engineering-en.jpg' : 'schedule-engineering-ar.jpg');

		return {
			group: `جدول شهر أكتوبر ${program} ${language}`,
			src: `/assets/${asset}`,
			alt: `جدول شهر أكتوبر ${program} ${language}`,
			note: 'اضغط على الصورة للتكبير'
		};
	}

	private getEnrollmentFormLink(): string {
		if (this.isComputersSubscription && this.isEnglishSubscription) return this.computersEnglishEnrollmentFormLink;
		return this.isEnglishSubscription ? this.englishEnrollmentFormLink : this.arabicEnrollmentFormLink;
	}

	ngOnDestroy(): void {
		this.contentSubscription?.unsubscribe();
		this.stopClosingTimer();

		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		document.removeEventListener('visibilitychange', this.handleVisibilityChange);
		window.removeEventListener('focus', this.handleWindowFocus);
		window.removeEventListener('pageshow', this.handleWindowFocus);
	}

	private stopClosingTimer(): void {
		if (this.closingTimer) {
			clearInterval(this.closingTimer);
			this.closingTimer = null;
		}
	}

	private getNextClosingDate(): Date | null {
		if (this.enrollmentExpiresAt) {
			const configured = new Date(this.enrollmentExpiresAt);
			if (!Number.isNaN(configured.getTime())) return configured;
		}
		return null;
	}

	private updateClosingCountdown(): void {
		const closingDate = this.closingDate ?? this.getNextClosingDate();
		if (!closingDate) return;
		this.closingDate = closingDate;
		const remaining = closingDate.getTime() - Date.now();
		this.closingDateLabel = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
			day: 'numeric',
			month: 'long',
		}).format(closingDate);

		if (remaining <= 0) {
			this.closingDays = 0;
			this.closingHours = 0;
			this.closingMinutes = 0;
			this.closingSeconds = 0;
			this.isEnrollmentClosed = true;
			this.enrollmentReopenMessage = 'انتهى وقت الاشتراك تلقائيًا، وسيتم فتح التسجيل مع بداية فترة الاشتراك القادمة.';
			this.stopClosingTimer();
			this.changeDetector.detectChanges();
			return;
		}
		const totalSeconds = Math.floor(remaining / 1000);
		this.closingDays = Math.floor(totalSeconds / 86400);
		this.closingHours = Math.floor((totalSeconds % 86400) / 3600);
		this.closingMinutes = Math.floor((totalSeconds % 3600) / 60);
		this.closingSeconds = totalSeconds % 60;
		this.changeDetector.detectChanges();
	}

	loadVideo(): void {
		this.isVideoLoaded = true;
	}

	getVideoEmbedUrl(): SafeResourceUrl {
		const videoId = 'T-5MVk5jq9Q';
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appmo3adla.com';
		const params = new URLSearchParams({
			autoplay: '1',
			rel: '0',
			origin,
			widget_referrer: `${origin}/`,
		});
		const url = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	getVideoThumbnail(): string {
		const videoId = 'T-5MVk5jq9Q';
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}

	getVideoWatchUrl(): string {
		return 'https://youtu.be/T-5MVk5jq9Q';
	}

	private shuffleVodafoneNumbers(): void {
		const shuffled = [...this.subscriptionDetails.vodafoneNumbers];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		this.shuffledVodafoneNumbers = shuffled;
	}

	private listenForVisibilityChange(): void {
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		document.addEventListener('visibilitychange', this.handleVisibilityChange);
		window.addEventListener('focus', this.handleWindowFocus);
		window.addEventListener('pageshow', this.handleWindowFocus);
	}

	openGoogleForm(): void {
		const form = this.getForm();
		const isFormDisabled = this.isEnrollmentClosed;
		if (isFormDisabled) {
			return;
		}

		window.open(form.link, '_blank');
	}

	getForm(): ReviewFormConfig {
		const form = this.subscriptionDetails.googleForm as ReviewFormConfig;
		return { ...form, label: displayProgramLabel(form.label), description: displayProgramLabel(form.description), buttonText: displayProgramLabel(form.buttonText) };
	}

	getPrice(): string {
		return this.subscriptionDetails.review.price;
	}

	getReviewName(): string {
		return displayProgramLabel(this.subscriptionDetails.review.name);
	}

	getSelectedSchedules(): ScheduleImage[] {
		if (!this.isScheduleReady) return [];

		return this.subscriptionDetails.scheduleImages.map(schedule => ({
			...schedule,
			src: this.monthlyContent.resolveAssetUrl(schedule.src),
			group: displayProgramLabel(schedule.group),
			alt: displayProgramLabel(schedule.alt)
		}));
	}

	getScheduleHeading(): string {
		return this.getSelectedSchedules()[0]?.group
			|| `جدول شهر أكتوبر ${this.isComputersSubscription ? 'حاسبات' : 'هندسة'} ${this.isEnglishSubscription ? 'لغات' : 'عربي'}`;
	}

	async downloadSchedule(event: MouseEvent, schedule: ScheduleImage): Promise<void> {
		event.preventDefault();
		event.stopPropagation();

		try {
			const downloadUrl = new URL(schedule.src, window.location.origin);
			downloadUrl.searchParams.set('download', '1');
			const link = document.createElement('a');
			link.href = downloadUrl.toString();
			link.download = this.getScheduleFilename(schedule.src, schedule.alt);
			link.rel = 'noopener';
			document.body.appendChild(link);
			link.click();
			link.remove();
		} catch (error) {
			console.error('تعذر تحميل جدول الاشتراك', error);
		}
	}

	private getScheduleFilename(src: string, alt: string): string {
		try {
			const pathname = new URL(src, window.location.origin).pathname;
			const filename = decodeURIComponent(pathname.split('/').pop() || '').trim();
			if (filename && filename.includes('.')) return filename;
		} catch {
			// Use the accessible label below when the source is not a valid URL.
		}
		return `${String(alt || 'جدول الاشتراك').trim() || 'جدول الاشتراك'}.jpg`;
	}

	onNumberCardClick(number: string): void {
		if (this.isEnrollmentClosed) {
			return;
		}

		void this.copyToClipboard(number);
	}

	getFilteredVodafoneNumbers() {
		return this.shuffledVodafoneNumbers;
	}

	async copyToClipboard(text: string): Promise<void> {
		try {
			await navigator.clipboard.writeText(text);
			this.copiedNumber = text;
			setTimeout(() => {
				this.copiedNumber = null;
			}, 2000);
		} catch {
			this.fallbackCopyTextToClipboard(text);
			this.copiedNumber = text;
			setTimeout(() => {
				this.copiedNumber = null;
			}, 2000);
		}
	}

	private fallbackCopyTextToClipboard(text: string): void {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			document.execCommand('copy');
		} catch {
			// ignore
		}

		document.body.removeChild(textArea);
	}

	openImageModal(event: MouseEvent, image: ScheduleImage): void {
		event.preventDefault();
		event.stopPropagation();
		this.activeScheduleImage = image;
		this.isImageModalOpen = true;
	}

	closeImageModal(): void {
		this.isImageModalOpen = false;
		this.activeScheduleImage = null;
	}

}

const SUBSCRIPTION_VALIDITY_POINTS = [
	'الكود شغال لغاية آخر الشهر فقط',
	'مع انتهاء الشهر بيقفل المحتوى تلقائياً',
	'عند تجديد الاشتراك الكود الجديد بيفتحلك كل المحتوى من الأول'
];
const SUBSCRIPTION_REFUND_POINTS = [
	'⚠️ السحب متاح خلال أسبوع من الاشتراك مع استرداد نصف المبلغ فقط.',
	'بعد الأسبوع، لا يُمكن استرداد أي مبلغ.'
];
