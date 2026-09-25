import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
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
	imports: [CommonModule, RouterLink],
	templateUrl: './subscription-ab-reviews.page.html',
	styleUrls: ['./subscription-ab-reviews.page.css']
})
export class SubscriptionAbReviewsPageComponent implements OnInit, OnDestroy {
	private contentSubscription?: Subscription;
	isComputersSubscription = false;
	isEnglishSubscription = false;
	subscriptionProgramLabel = 'معادلة هندسة عربي';
	copiedNumber: string | null = null;
	isImageModalOpen = false;
	activeScheduleImage: ScheduleImage | null = null;
	isEnrollmentClosed = false;
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
	private closingDate: Date | null = null;
	private readonly closingDeadlineStorageKey = 'subscription-enrollment-deadline';
	private readonly enrollmentClosedStorageKey = 'subscription-enrollment-closed';

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

		const countdownClosed = typeof window !== 'undefined' && localStorage.getItem(this.enrollmentClosedStorageKey) === 'true';
		if (typeof state.isEnrollmentClosed === 'boolean') {
			// The CMS value is authoritative, so reopening the subscription from
			// the admin also reopens the public countdown immediately.
			this.isEnrollmentClosed = state.isEnrollmentClosed;
			if (typeof window !== 'undefined' && !state.isEnrollmentClosed) {
				localStorage.removeItem(this.enrollmentClosedStorageKey);
			}
			if (state.isEnrollmentClosed) {
				this.stopClosingTimer();
			} else if (!this.closingTimer) {
				this.closingDate = this.getNextClosingDate();
				this.updateClosingCountdown();
				if (!this.isEnrollmentClosed) this.closingTimer = setInterval(() => this.updateClosingCountdown(), 1000);
			}
		} else {
			this.isEnrollmentClosed = countdownClosed || this.isEnrollmentClosed;
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
					price: loaded.review?.price ?? loaded.groupB?.price ?? loaded.groupA?.price ?? '800'
				},
				googleForm: {
					...this.subscriptionDetails.googleForm,
					...(legacyForm ?? {})
				},
				vodafoneNumbers: loaded.vodafoneNumbers?.length
					? loaded.vodafoneNumbers
					: this.subscriptionDetails.vodafoneNumbers,
				scheduleImages: loaded.scheduleImages?.length
					? loaded.scheduleImages
					: this.subscriptionDetails.scheduleImages,
				subscriptionWarnings: {
					validity: {
						...this.subscriptionDetails.subscriptionWarnings.validity,
						...(loaded.subscriptionWarnings?.validity ?? {})
					},
					refund: {
						...this.subscriptionDetails.subscriptionWarnings.refund,
						...(loaded.subscriptionWarnings?.refund ?? {})
					}
				}
			};
		}

		this.shuffleVodafoneNumbers();
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
		whatsappNumber: '201554843745',
		subscriptionWarnings: {
			validity: {
				title: 'مدة صلاحية الاشتراك:',
				points: [
					'الكود ساري حتى نهاية الشهر المشترك فيه',
					'عند انتهاء الشهر، يتم إغلاق المحتوى تلقائياً، وعند تجديد الاشتراك يتم فتح المحتوى من جديد.'
				]
			},
			refund: {
				title: 'سياسة الاسترداد',
				points: [
					'⚠️ السحب متاح خلال أسبوع من الاشتراك مع استرداد نصف المبلغ فقط.',
					'بعد الأسبوع، لا يُمكن استرداد أي مبلغ.'
				]
			}
		},
		subtitle: 'أول خطوة في رحلة دفعة 2027 — أكتوبر'
	};

	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private monthlyContent: MonthlyContentService,
		private sanitizer: DomSanitizer
	) {}

	ngOnInit(): void {
		const pathname = typeof window !== 'undefined' ? window.location.pathname : '/subscription-engineering-ar';
		this.isComputersSubscription = pathname.includes('computers');
		this.isEnglishSubscription = pathname.endsWith('-en');
		this.subscriptionProgramLabel = `معادلة ${this.isComputersSubscription ? 'حاسبات' : 'هندسة'} ${this.isEnglishSubscription ? 'انجليزي' : 'عربي'}`;
		this.applySubscriptionProgram();
		this.restoreCountdownState();
		if (typeof window !== 'undefined') {
			const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
			const title = `${this.subscriptionProgramLabel} | أبلكيشن معادلة كلية هندسة`;
			const description = `اشترك في ${this.subscriptionProgramLabel} بخطة واضحة للمذاكرة والمراجعة والمتابعة المستمرة.`;
			const slug = pathname.replace(/^\//, '');
			const imagePath = this.isComputersSubscription
				? '/assets/جداول مراجعات شهر 8/جدول جروب C.png'
				: '/assets/جداول مراجعات شهر 8/جدول جروب A-B.png';
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
		this.closingDate = this.getNextClosingDate();
		this.updateClosingCountdown();
		if (!this.isEnrollmentClosed) {
			this.closingTimer = setInterval(() => this.updateClosingCountdown(), 1000);
		}

		const contentKey = this.getSubscriptionContentKey(pathname);
		this.contentSubscription = this.monthlyContent
			.watchPageState(contentKey)
			.subscribe(state => this.applyLoadedState(state));
	}

	private getSubscriptionContentKey(pathname: string): CmsPageKey {
		if (pathname.includes('computers')) return pathname.endsWith('-en') ? 'subscription-computers-en' : 'subscription-computers-ar';
		return pathname.endsWith('-en') ? 'subscription-engineering-en' : 'subscription-engineering-ar';
	}

	private applySubscriptionProgram(): void {
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
				label: this.subscriptionProgramLabel,
				description: `فورم ${this.subscriptionProgramLabel}`,
				buttonText: `سجل ${this.subscriptionProgramLabel}`
			},
			scheduleImages: this.subscriptionDetails.scheduleImages.length
				? this.subscriptionDetails.scheduleImages
				: [{
					group: `جدول شهر أكتوبر ${this.isComputersSubscription ? 'حاسبات' : 'هندسة'} ${this.isEnglishSubscription ? 'انجليزي' : 'عربي'}`,
					src: this.isComputersSubscription ? '/assets/جداول مراجعات شهر 8/جدول جروب C.png' : '/assets/جداول مراجعات شهر 8/جدول جروب A-B.png',
					alt: `جدول شهر أكتوبر ${this.subscriptionProgramLabel}`,
					note: 'اضغط على الصورة للتكبير'
				}],
			subscriptionWarnings: {
				...this.subscriptionDetails.subscriptionWarnings,
				validity: {
					...this.subscriptionDetails.subscriptionWarnings.validity,
					points: [
						`المحتوى الخاص بـ ${this.subscriptionProgramLabel}`,
						'الكود ساري حتى نهاية الشهر المشترك فيه',
						'عند انتهاء الشهر، يتم إغلاق المحتوى تلقائياً، وعند تجديد الاشتراك يتم فتح المحتوى من جديد.'
					]
				}
			}
		};
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

	private getNextClosingDate(): Date {
		if (typeof window !== 'undefined') {
			const storedDeadline = Number(localStorage.getItem(this.closingDeadlineStorageKey));
			if (storedDeadline > 0) {
				return new Date(storedDeadline);
			}
		}

		const now = new Date();
		const closingDate = new Date(now.getFullYear(), now.getMonth(), 10, 22, 0, 0, 0);

		if (now >= closingDate) {
			closingDate.setMonth(closingDate.getMonth() + 1);
		}

		if (typeof window !== 'undefined') {
			localStorage.setItem(this.closingDeadlineStorageKey, String(closingDate.getTime()));
		}

		return closingDate;
	}

	private restoreCountdownState(): void {
		if (typeof window !== 'undefined' && localStorage.getItem(this.enrollmentClosedStorageKey) === 'true') {
			this.isEnrollmentClosed = true;
			this.enrollmentReopenMessage = 'انتهى وقت الاشتراك تلقائيًا، وسيتم فتح التسجيل مع بداية فترة الاشتراك القادمة.';
		}
	}

	private updateClosingCountdown(): void {
		const closingDate = this.closingDate ?? this.getNextClosingDate();
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
			if (typeof window !== 'undefined') {
				localStorage.setItem(this.enrollmentClosedStorageKey, 'true');
			}
			this.stopClosingTimer();
			return;
		}
		const totalSeconds = Math.floor(remaining / 1000);
		this.closingDays = Math.floor(totalSeconds / 86400);
		this.closingHours = Math.floor((totalSeconds % 86400) / 3600);
		this.closingMinutes = Math.floor((totalSeconds % 3600) / 60);
		this.closingSeconds = totalSeconds % 60;
	}

	loadVideo(): void {
		this.isVideoLoaded = true;
	}

	getVideoEmbedUrl(): SafeResourceUrl {
		const videoId = 'H2_dh3SsfiI';
		const url = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	getVideoThumbnail(): string {
		const videoId = 'H2_dh3SsfiI';
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
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
		const isFormDisabled = this.isEnrollmentClosed || (form.isClosed && !form.allowOpenWhenClosed);
		if (isFormDisabled) {
			return;
		}

		window.open(form.link, '_blank');
	}

	getForm(): ReviewFormConfig {
		return this.subscriptionDetails.googleForm as ReviewFormConfig;
	}

	getPrice(): string {
		return this.subscriptionDetails.review.price;
	}

	getReviewName(): string {
		return this.subscriptionDetails.review.name;
	}

	getSelectedSchedules(): ScheduleImage[] {
		if (!this.subscriptionDetails.scheduleImages.length) {
			return [{
				group: `جدول شهر أكتوبر ${this.isComputersSubscription ? 'حاسبات' : 'هندسة'} ${this.isEnglishSubscription ? 'انجليزي' : 'عربي'}`,
				src: this.isComputersSubscription ? '/assets/جداول مراجعات شهر 8/جدول جروب C.png' : '/assets/جداول مراجعات شهر 8/جدول جروب A-B.png',
				alt: `جدول شهر أكتوبر ${this.subscriptionProgramLabel}`,
				note: 'اضغط على الصورة للتكبير'
			}];
		}

		return this.subscriptionDetails.scheduleImages.slice(0, 1);
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

	openImageModal(image: ScheduleImage): void {
		this.activeScheduleImage = image;
		this.isImageModalOpen = true;
		document.body.style.overflow = 'hidden';
	}

	closeImageModal(): void {
		this.isImageModalOpen = false;
		this.activeScheduleImage = null;
		document.body.style.overflow = '';
	}

}
