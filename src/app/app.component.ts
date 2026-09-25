import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router, NavigationEnd, NavigationStart } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { pageTransition } from './shared/animations';
import { ViewportScroller } from '@angular/common';
import { SeoService } from './core/seo.service';
import { StyledSelectComponent } from './shared/components/styled-select/styled-select.component';
import { captureLeadAttribution, LeadAttribution } from './core/lead-attribution';

declare global {
	interface Window {
		NG_LAUNCH_OFFER_ENDPOINT?: string;
		NG_WHEEL_APPS_SCRIPT_ENDPOINT?: string;
	}
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, NavbarComponent, FooterComponent, StyledSelectComponent],
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css'],
	animations: [pageTransition]
})
export class AppComponent implements OnInit, OnDestroy {
	title = 'mo3adala-handasa';
	currentRoute = '';
	showLoading = true;
	routeTransitioning = false;
	showLaunchOffer = false;
	showSubscriptionChoices = false;
	offerSubmitted = false;
	offerName = '';
	offerWhatsapp = '';
	offerSchool = '';
	offerProgram = '';
	offerSource = '';
	offerProgramOptions = [
		'معادلة هندسة عربي',
		'معادلة حاسبات عربي',
		'معادلة هندسة إنجليزي',
		'معادلة حاسبات إنجليزي'
	];
	offerStudentType = '';
	offerStudentTypeOptions = ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 3 سنوات', 'مدارس تكنولوجيا تطبيقية نظام 5 سنوات'];
	offerContactConsent = false;
	showStudentTypeMenu = false;
	showOfferSourceMenu = false;
	offerSourceOptions = ['فيسبوك', 'إنستجرام', 'تيك توك', 'يوتيوب', 'ترشيح من صديق', 'أخرى'];
	offerSubmitting = false;
	offerError = '';
	private readonly fallbackLaunchOfferEndpoint = '/api/launch-offer';
	private readonly leadAttribution: LeadAttribution = captureLeadAttribution();
	countdownDays = 15;
	countdownHours = 0;
	countdownMinutes = 0;
	countdownSeconds = 0;
	private offerCountdownTimer?: ReturnType<typeof setInterval>;
	private routeTransitionTimer?: ReturnType<typeof setTimeout>;

	constructor(private router: Router, private viewportScroller: ViewportScroller, private seo: SeoService) {
		if ('scrollRestoration' in history) {
			history.scrollRestoration = 'manual';
		}
		this.currentRoute = this.router.url;
		this.router.events
			.subscribe((event) => {
				// Set the route class before the new view is rendered, preventing
				// internal pages from briefly appearing beneath the fixed navbar.
				if (event instanceof NavigationStart) {
					this.currentRoute = event.url;
					this.seo.setRobots(event.url.startsWith('/admin') ? 'noindex, nofollow, noarchive' : 'index, follow');
				}
				if (event instanceof NavigationEnd) {
					this.currentRoute = event.urlAfterRedirects;
					this.playRouteTransition();
					this.scrollToTop();
				}
			});
	}

	ngOnInit() {
		// التمرير إلى الأعلى عند تحميل الصفحة لأول مرة
		this.scrollToTop();
		this.playRouteTransition();
		
		// Give the initial shell a little time to settle before hiding the loader.
		setTimeout(() => {
			this.showLoading = false;
		}, 700);
		if ((this.currentRoute === '/' || this.currentRoute === '') && typeof window !== 'undefined' && !localStorage.getItem('launch-offer-submitted')) {
			setTimeout(() => this.showLaunchOffer = true, 650);
		}
		this.startOfferCountdown();
	}

	ngOnDestroy() {
		if (this.offerCountdownTimer) clearInterval(this.offerCountdownTimer);
		if (this.routeTransitionTimer) clearTimeout(this.routeTransitionTimer);
	}

	private playRouteTransition(): void {
		if (typeof window === 'undefined') return;

		this.routeTransitioning = false;
		if (this.routeTransitionTimer) clearTimeout(this.routeTransitionTimer);

		requestAnimationFrame(() => {
			this.routeTransitioning = true;
			this.routeTransitionTimer = setTimeout(() => {
				this.routeTransitioning = false;
			}, 650);
		});
	}

	private startOfferCountdown() {
		if (typeof window === 'undefined') return;
		const key = 'launch-offer-deadline';
		let deadline = Number(localStorage.getItem(key));
		if (!deadline || deadline <= Date.now()) {
			deadline = Date.now() + 15 * 24 * 60 * 60 * 1000;
			localStorage.setItem(key, String(deadline));
		}
		const update = () => {
			const remaining = Math.max(0, deadline - Date.now());
			this.countdownDays = Math.floor(remaining / 86400000);
			this.countdownHours = Math.floor((remaining % 86400000) / 3600000);
			this.countdownMinutes = Math.floor((remaining % 3600000) / 60000);
			this.countdownSeconds = Math.floor((remaining % 60000) / 1000);
		};
		update();
		this.offerCountdownTimer = setInterval(update, 1000);
	}

	closeLaunchOffer() {
		this.showLaunchOffer = false;
	}

	openSubscriptionChoices(event?: Event) {
		event?.preventDefault();
		event?.stopPropagation();
		this.showSubscriptionChoices = !this.showSubscriptionChoices;
	}

	closeSubscriptionChoices() {
		this.showSubscriptionChoices = false;
	}

	toggleOfferSourceMenu(event: Event) {
		event.stopPropagation();
		this.showOfferSourceMenu = !this.showOfferSourceMenu;
	}

	selectOfferSource(source: string, event: Event) {
		event.stopPropagation();
		this.offerSource = source;
		this.showOfferSourceMenu = false;
	}

	toggleStudentTypeMenu(event: Event) {
		event.stopPropagation();
		this.showStudentTypeMenu = !this.showStudentTypeMenu;
	}

	selectStudentType(type: string, event: Event) {
		event.stopPropagation();
		this.offerStudentType = type;
		this.showStudentTypeMenu = false;
	}

	@HostListener('document:click')
	closeOfferSourceMenu() {
		this.showOfferSourceMenu = false;
		this.showStudentTypeMenu = false;
		this.showSubscriptionChoices = false;
	}

	async submitLaunchOffer() {
		if (this.offerSubmitting) return;
		if (!this.offerName.trim()) { this.offerError = 'اكتب الاسم الثلاثي.'; return; }
		if (!this.offerWhatsapp.trim()) { this.offerError = 'اكتب رقم الواتساب.'; return; }
		if (!this.offerSchool.trim()) { this.offerError = 'اكتب اسم المدرسة أو المعهد.'; return; }
		if (!this.offerStudentType) { this.offerError = 'اختار نوع التعليم.'; return; }
		if (!this.offerProgram) { this.offerError = 'اختار نوع المعادلة.'; return; }
		if (!this.offerSource) { this.offerError = 'اختار عرفتَنا منين.'; return; }
		if (!this.offerContactConsent) {
			this.offerError = 'لازم توافق على التواصل قبل إرسال البيانات.';
			return;
		}
		if (!/^01\d{9}$/.test(this.offerWhatsapp.trim())) {
			this.offerError = 'اكتب رقم واتساب صحيح يبدأ بـ 01 ويتكون من 11 رقم.';
			return;
		}
		this.offerSubmitting = true;
		this.offerError = '';
		const lead = { name: this.offerName.trim(), whatsapp: this.offerWhatsapp.trim(), school: this.offerSchool.trim(), studentType: this.offerStudentType, program: this.offerProgram, source: this.offerSource, consent: this.offerContactConsent ? 'نعم' : 'لا', attribution: JSON.stringify(this.leadAttribution) };
		const controller = new AbortController();
		// The backend may wait up to 60 seconds for Google Apps Script while it
		// scans the sheet for an existing WhatsApp number.
		const timeout = setTimeout(() => controller.abort(), 65000);
		try {
			// env.js is loaded asynchronously on the static deployment, so read
			// the runtime endpoint at submit time instead of during app startup.
			const launchOfferEndpoint = typeof window !== 'undefined'
				? window.NG_LAUNCH_OFFER_ENDPOINT || this.fallbackLaunchOfferEndpoint
				: this.fallbackLaunchOfferEndpoint;
			const result = await fetch(launchOfferEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
				body: new URLSearchParams(lead).toString(),
				signal: controller.signal
			});
			const responseText = await result.text();
			let payload: { success?: boolean; alreadyRegistered?: boolean; message?: string };
			try {
				payload = JSON.parse(responseText);
			} catch {
				throw new Error('invalid-response');
			}
			if (!result.ok) throw new Error(payload.message || 'request-failed');
			if (payload.alreadyRegistered) {
				this.offerError = 'رقم الواتساب ده مسجل بالفعل.';
				return;
			}
			if (!payload.success) throw new Error(payload.message || 'request-failed');
			if (typeof window !== 'undefined') {
				localStorage.setItem('launch-offer-lead', JSON.stringify({ ...lead, createdAt: new Date().toISOString() }));
				localStorage.setItem('launch-offer-submitted', '1');
			}
			this.offerSubmitted = true;
		} catch (error) {
			this.offerError = error instanceof DOMException && error.name === 'AbortError'
				? 'الخدمة اتأخرت عن المعتاد. حاول تاني بعد لحظات.'
				: error instanceof Error && !['invalid-response', 'request-failed'].includes(error.message)
					? error.message
					: 'حصلت مشكلة بسيطة في الاتصال. حاول تاني من فضلك.';
		} finally {
			clearTimeout(timeout);
			this.offerSubmitting = false;
		}
	}

	@HostListener('window:pageshow')
	onPageShow() {
		// Browsers can restore the previous scroll position after a refresh.
		this.scrollToTop();
	}

	scrollToTop() {
		const reset = () => {
			window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
			this.viewportScroller.scrollToPosition([0, 0]);
		};

		reset();
		// Run again after layout and browser restoration have completed.
		requestAnimationFrame(reset);
		setTimeout(reset, 0);
		setTimeout(reset, 120);
	}

	getRouteAnimationState() {
		return this.currentRoute;
	}
}
