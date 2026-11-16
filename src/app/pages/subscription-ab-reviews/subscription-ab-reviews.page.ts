import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { displayProgramLabel } from '../../core/program-labels';
import { CmsPageKey, cmsPageDefaults } from '../../core/cms-page.registry';
import { Subscription, finalize } from 'rxjs';

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
	imports: [CommonModule, FormsModule],
	templateUrl: './subscription-ab-reviews.page.html',
	styleUrls: ['./subscription-ab-reviews.page.css']
})
export class SubscriptionAbReviewsPageComponent implements OnInit, AfterViewInit, OnDestroy {
	private readonly defaultEnrollmentExpiresAt = '2026-10-10T19:00:00.000Z';
	private readonly engineeringArabicVideoUrl = 'https://youtu.be/MWnaGMPUvXQ';
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
	@ViewChild('computerHeroVideo') private computerHeroVideo?: ElementRef<HTMLVideoElement>;
	private cachedVideoEmbedUrl: SafeResourceUrl | null = null;
	private cachedVideoEmbedKey = '';
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
		return String(this.subscriptionDetails?.month ?? '');
	}

	get heroClosingDateLabel(): string {
		return this.isEnglishSubscription ? 'October 10' : this.closingDateLabel;
	}

	deliveryName = '';
	deliveryRegistered = '';
	deliveryFormSubmitted = false;
	studentName = '';
	studentWhatsapp = '';
	studentTelegram = '';
	studentSupervisor = '';
	studentPaymentRecipient = '';
	studentTransferFrom = '';
	studentTransferAt = '';
	studentSchool = '';
	studentPaymentReceipt: File | null = null;
	studentIdentityCard: File | null = null;
	studentPaymentReceiptError = '';
	studentIdentityCardError = '';
	studentFormSubmitted = false;
	studentFormSubmitting = false;
	studentFormError = '';
	studentRequestId = '';
	studentReferenceCode = '';
	studentRequestMessage = '';
	readonly subscriptionSupervisors = ['مهندسة حبيبة', 'مهندسة هدير', 'مهندسة ندى', 'مهندسة مي', 'مهندسة إيمان', 'مهندسة أشروقت', 'طالب جديد'];
	private readonly http = inject(HttpClient);

	submitDeliveryWhatsApp(): void {
		this.deliveryFormSubmitted = true;
		if (this.isEnrollmentClosed || !this.studentRequestId || this.deliveryRegistered !== 'نعم') return;
		window.open(this.deliveryWhatsAppUrl, '_blank', 'noopener');
	}

	get studentDeliveryMessage(): string {
		return [
			'طلب استلام كود التفعيل',
			`الرقم المرجعي: ${this.studentReferenceCode || this.studentRequestId}`,
			`الاسم: ${this.studentName.trim()}`,
			`واتساب: ${this.studentWhatsapp.trim()}`,
			`تليجرام: ${this.studentTelegram.trim()}`,
			`المشرف: ${this.studentSupervisor}`,
			`نوع المعادلة: ${this.subscriptionProgramLabel}`,
			`حولت على رقم: ${this.studentPaymentRecipient}`,
			`حولت من رقم: ${this.studentTransferFrom.trim()}`,
			`وقت التحويل: ${this.formatTransferAtForWhatsApp(this.studentTransferAt)}`,
			`المدرسة: ${this.studentSchool.trim()}`,
			'سيتم مراجعة بيانات التحويل والتواصل معك بعد تسجيل الطلب.'
		].join('\n');
	}

	private formatTransferAtForWhatsApp(value: string): string {
		const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value || '');
		if (!match) return value || '—';

		const [, year, month, day, rawHour, minutes] = match;
		const hour = Number(rawHour);
		const hour12 = hour % 12 || 12;
		const period = hour >= 12 ? 'PM' : 'AM';
		return `${day}/${month}/${year} ${String(hour12).padStart(2, '0')}:${minutes} ${period}`;
	}

	get deliveryWhatsAppUrl(): string {
		return `https://api.whatsapp.com/send/?phone=201080681865&text=${encodeURIComponent(this.studentDeliveryMessage)}&type=phone_number&app_absent=0`;
	}

	get studentNameValidation(): string {
		const parts = this.studentName.trim().split(/\s+/).filter(Boolean);
		if (!this.studentName.trim()) return 'الاسم الثلاثي مطلوب.';
		return parts.length >= 3 ? '' : 'اكتب الاسم ثلاثيًا: الاسم الأول واسم الأب واسم العائلة.';
	}

	private validateStudentPhone(value: string, label: string): string {
		if (!value.trim()) return `${label} مطلوب.`;
		return /^01\d{9}$/.test(value.trim()) ? '' : 'اكتب رقمًا مصريًا صحيحًا من 11 رقمًا يبدأ بـ 01.';
	}

	get studentWhatsappValidation(): string { return this.validateStudentPhone(this.studentWhatsapp, 'رقم الواتساب'); }
	get studentTelegramValidation(): string { return this.validateStudentPhone(this.studentTelegram, 'رقم التليجرام'); }
	get studentSupervisorValidation(): string { return this.studentSupervisor ? '' : 'اختار المهندسة المشرفة.'; }
	get studentPaymentRecipientValidation(): string { return this.studentPaymentRecipient ? '' : 'اختار رقم فودافون كاش الذي حوّلت إليه.'; }
	get studentTransferFromValidation(): string {
		const phoneValidation = this.validateStudentPhone(this.studentTransferFrom, 'رقم التحويل');
		if (phoneValidation) return phoneValidation;

		const transferFrom = this.normalizeStudentPhone(this.studentTransferFrom);
		const recipientNumbers = (this.subscriptionDetails?.vodafoneNumbers || []).map(wallet => this.normalizeStudentPhone(wallet.number));
		return recipientNumbers.includes(transferFrom)
			? 'مينفعش تكتب رقمًا من أرقام فودافون كاش التي حوّلت إليها. اكتب رقم الشخص الذي حوّلت منه.'
			: '';
	}
	private normalizeStudentPhone(value: string): string {
		return value.replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, '');
	}
	get studentTransferMax(): string { const now = new Date(); const pad = (value: number) => String(value).padStart(2, '0'); return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`; }
	get studentTransferAtValidation(): string {
		if (!this.studentTransferAt) return 'وقت وتاريخ التحويل مطلوبان.';
		const transferDate = new Date(this.studentTransferAt);
		if (Number.isNaN(transferDate.getTime())) return 'اختار تاريخًا ووقتًا صحيحين.';
		return transferDate.getTime() <= Date.now() ? '' : 'وقت التحويل لا يمكن أن يكون في المستقبل.';
	}
	get studentSchoolValidation(): string { return this.studentSchool.trim() ? '' : 'اسم المدرسة مطلوب.'; }
	get studentPaymentReceiptValidation(): string {
		return this.studentPaymentReceiptError || (this.studentFormSubmitted && !this.studentPaymentReceipt ? 'صورة إيصال الدفع مطلوبة.' : '');
	}
	get studentIdentityCardValidation(): string {
		return this.studentIdentityCardError || (this.studentFormSubmitted && !this.studentIdentityCard ? 'صورة البطاقة مطلوبة.' : '');
	}

	selectStudentFile(kind: 'receipt' | 'identity', event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0] || null;
		const error = file && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
			? 'الملف يجب أن يكون JPG أو PNG أو WEBP.'
			: file && file.size > 5 * 1024 * 1024
				? 'حجم الصورة يجب ألا يتجاوز 5 ميجابايت.'
				: '';
		if (kind === 'receipt') {
			this.studentPaymentReceipt = error ? null : file;
			this.studentPaymentReceiptError = error;
		} else {
			this.studentIdentityCard = error ? null : file;
			this.studentIdentityCardError = error;
		}
	}

	submitSubscriptionRequest(): void {
		this.studentFormSubmitted = true;
		this.studentFormError = '';
		if (this.studentFormSubmitting || this.isEnrollmentClosed) return;
		if (this.studentNameValidation || this.studentWhatsappValidation || this.studentTelegramValidation || this.studentSupervisorValidation || this.studentPaymentRecipientValidation || this.studentTransferFromValidation || this.studentTransferAtValidation || this.studentSchoolValidation || this.studentPaymentReceiptValidation || this.studentIdentityCardValidation) {
			this.studentFormError = 'من فضلك أكمل كل البيانات المطلوبة.';
			return;
		}
		const body = new FormData();
		body.append('name', this.studentName.trim()); body.append('whatsapp', this.studentWhatsapp.trim()); body.append('telegram', this.studentTelegram.trim());
		body.append('supervisor', this.studentSupervisor); body.append('paymentRecipient', this.studentPaymentRecipient); body.append('transferFrom', this.studentTransferFrom.trim());
		body.append('transferAt', this.studentTransferAt); body.append('school', this.studentSchool.trim()); body.append('program', this.subscriptionProgramLabel);
		if (this.studentPaymentReceipt) body.append('paymentReceipt', this.studentPaymentReceipt);
		if (this.studentIdentityCard) body.append('identityCard', this.studentIdentityCard);
		this.studentFormSubmitting = true;
		this.http.post<{ success: boolean; requestId: string; request?: { referenceCode?: string }; message: string }>('/api/subscription-requests', body).pipe(
			finalize(() => {
				this.studentFormSubmitting = false;
				this.changeDetector.detectChanges();
			})
		).subscribe({
			next: result => {
				this.studentRequestId = result.requestId;
				this.studentReferenceCode = result.request?.referenceCode || '';
				this.studentRequestMessage = result.message;
				this.deliveryName = this.studentName;
				this.deliveryRegistered = 'نعم';
				this.materialsTelegramName = this.studentName;
			},
			error: error => {
				this.studentFormError = error?.error?.message || 'تعذر تسجيل الطلب. حاول مرة أخرى.';
			}
		});
	}

	get materialsTelegramUrl(): string {
		const message = [`الاسم الثلاثي: ${this.materialsTelegramName.trim()}`, `نوع المعادلة: ${this.subscriptionProgramLabel}`].join('\n');
		return `https://t.me/AssAm268?text=${encodeURIComponent(message)}`;
	}
	materialsTelegramName = '';
	materialsTelegramRegistered = '';
	materialsTelegramSubmitted = false;

	submitMaterialsTelegram(): void {
		this.materialsTelegramSubmitted = true;
		if (this.isEnrollmentClosed || !this.materialsTelegramName.trim() || this.materialsTelegramRegistered !== 'نعم') return;
		window.open(this.materialsTelegramUrl, '_blank', 'noopener');
	}

	get supportWhatsAppUrl(): string {
		const details = `الاسم: ${this.supportName.trim()}\nرقم الهاتف: ${this.supportPhone.trim()}\nنوع المعادلة: ${this.subscriptionProgramLabel}\nسجلت الفورم؟ ${this.supportRegistered}\nالمشكلة: ${this.supportProblem.trim()}`;
		return `https://api.whatsapp.com/send/?phone=201080681865&text=${encodeURIComponent(details)}&type=phone_number&app_absent=0`;
	}
	supportName = '';
	supportPhone = '';
	supportRegistered = '';
	supportProblem = '';
	supportFormSubmitted = false;

	submitSupportForm(): void {
		this.supportFormSubmitted = true;
		if (!this.supportName.trim() || !this.supportPhone.trim() || !this.supportRegistered || !this.supportProblem.trim()) return;
		window.open(this.supportWhatsAppUrl, '_blank', 'noopener');
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
				// Keep the configured engineering Arabic video visible during the
				// first CMS refresh instead of waiting for a later interaction.
				videoUrl: String(loaded.videoUrl || '').trim() || this.subscriptionDetails.videoUrl,
				whatsappNumber: '201080681865',
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
				// Ignore legacy schedule entries from older months. Keep only the
				// current route's built-in schedule or an explicitly uploaded CMS asset.
				scheduleImages: this.hasValidRouteSchedules(loaded.scheduleImages) ? loaded.scheduleImages : this.subscriptionDetails.scheduleImages,
				subscriptionWarnings: this.mergeSubscriptionWarnings(loaded.subscriptionWarnings)
			};
		}

		this.shuffleVodafoneNumbers();
		// The CMS refresh can complete outside the browser event cycle in some
		// dev/proxy setups; render the schedule immediately without requiring a click.
		this.changeDetector.detectChanges();
	}

	private mergeSubscriptionWarnings(loadedWarnings: any = {}) {
		return {
			validity: {
				...this.subscriptionDetails.subscriptionWarnings.validity,
				...(loadedWarnings?.validity ?? {})
			},
			refund: {
				...this.subscriptionDetails.subscriptionWarnings.refund,
				...(loadedWarnings?.refund ?? {})
			}
		};
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
		videoUrl: '',
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
				? (this.isEnglishSubscription ? '/assets/schedule-computers-en.webp' : '/assets/schedule-computers-ar.webp')
				: (this.isEnglishSubscription ? '/assets/schedule-engineering-en.webp' : '/assets/schedule-engineering-ar.webp');
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
			.loadPageState(contentKey, cmsPageDefaults[contentKey])
			.subscribe(state => this.applyLoadedState(state));
	}

	ngAfterViewInit(): void {
		this.startComputerHeroVideo();
	}

	private startComputerHeroVideo(): void {
		if (typeof window === 'undefined') return;
		const video = this.computerHeroVideo?.nativeElement;
		if (!video) return;

		// Some browsers keep a muted autoplay video paused until the first user
		// interaction unless the muted property is set explicitly in JavaScript.
		video.muted = true;
		video.defaultMuted = true;
		video.setAttribute('muted', '');
		video.playsInline = true;

		const play = (): void => {
			void video.play().catch(() => {
				// Retry once after the media has had a chance to attach its first frame.
				window.setTimeout(() => void video.play().catch(() => undefined), 250);
			});
		};

		if (video.readyState >= 2) play();
		else video.addEventListener('canplay', play, { once: true });
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
			videoUrl: !this.isComputersSubscription && !this.isEnglishSubscription ? this.engineeringArabicVideoUrl : '',
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
			? (this.isEnglishSubscription ? 'schedule-computers-en.webp' : 'schedule-computers-ar.webp')
			: (this.isEnglishSubscription ? 'schedule-engineering-en.webp' : 'schedule-engineering-ar.webp');

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

	private getConfiguredVideoId(): string {
		const value = String((this.subscriptionDetails as any).videoUrl || '').trim();
		if (!value) return '';
		if (/^[\w-]{11}$/.test(value)) return value;
		try {
			const url = new URL(value);
			if (!/(^|\.)youtube(?:-nocookie)?\.com$/.test(url.hostname) && url.hostname !== 'youtu.be') return '';
			if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0].slice(0, 11);
			if (url.pathname === '/watch') return (url.searchParams.get('v') || '').slice(0, 11);
			const match = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
			return match?.[1] || '';
		} catch {
			return '';
		}
	}

	hasConfiguredVideo(): boolean {
		return Boolean(this.getConfiguredVideoId());
	}

	getVideoEmbedUrl(): SafeResourceUrl {
		const videoId = this.getConfiguredVideoId();
		const origin = typeof window !== 'undefined' ? window.location.origin : 'https://appmo3adla.com';
		const cacheKey = `${videoId}|${origin}`;
		if (this.cachedVideoEmbedUrl && this.cachedVideoEmbedKey === cacheKey) return this.cachedVideoEmbedUrl;
		const params = new URLSearchParams({
			autoplay: '1',
			mute: '1',
			playsinline: '1',
			rel: '0',
			origin,
			widget_referrer: `${origin}/`,
		});
		const url = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
		this.cachedVideoEmbedKey = cacheKey;
		this.cachedVideoEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
		return this.cachedVideoEmbedUrl;
	}

	getVideoThumbnail(): string {
		const videoId = this.getConfiguredVideoId();
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}

	getVideoWatchUrl(): string {
		return String((this.subscriptionDetails as any).videoUrl || '').trim();
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
		return {
			...form,
			label: form.label || `فورم ${this.subscriptionProgramLabel}`,
			description: form.description || `فورم ${this.subscriptionProgramLabel}`,
			buttonText: form.buttonText || `سجل ${this.subscriptionProgramLabel}`
		};
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
