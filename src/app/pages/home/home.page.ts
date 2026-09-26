import { Component, ViewChild, ElementRef, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { fadeInUp, staggerList, homePageTransition, cardAnimation } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { JsonLdService } from '../../core/jsonld.service';
import { WhatIsEquationComponent } from '../../shared/components/what-is-equation/what-is-equation.component';
import { cmsPageDefaults } from '../../core/cms-page.registry';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { SubscriptionChoiceTriggerComponent } from '../../shared/components/subscription-choice-trigger/subscription-choice-trigger.component';
import { HttpClient } from '@angular/common/http';

@Component({
	selector: 'app-home-page',
	standalone: true,
	imports: [CommonModule, RouterLink, WhatIsEquationComponent, SubscriptionChoiceTriggerComponent],
	animations: [fadeInUp, staggerList, homePageTransition, cardAnimation],
	templateUrl: './home.page.html',
	styleUrls: ['./home.page.css'],
})
export class HomePageComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild('reviewsTrack', { static: false }) reviewsTrack!: ElementRef<HTMLDivElement>;
	@ViewChild('photosTrack', { static: false }) photosTrack!: ElementRef<HTMLDivElement>;
	@ViewChild('featuresTrack', { static: false }) featuresTrack!: ElementRef<HTMLDivElement>;
	@ViewChild('heroVideo', { static: false }) heroVideo!: ElementRef<HTMLVideoElement>;
	
	videoPlaying = false;
	shouldUseHeroVideo = true;
	activeHomeVideoId: string | null = null;
	showFinalSubscriptionChoices = false;
	showFinalTeacherChoices = false;
	publishedFeedbacks: Array<{ name: string; university?: string; rating: number; message: string }> = [];
	private readonly feedbackEndpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001/api/feedback/published' : '/api/feedback/published';
	private readonly refreshPublishedFeedbacksOnFocus = () => this.loadPublishedFeedbacks();

	homeVideos = [
		{
			id: 'RMWzTedJlE8',
			title: 'بودكاست رحلة صعود طلاب الدبلوم',
			heading: 'بودكاست رحلة صعود طلاب الدبلوم',
			description: '" معاناة طلاب الدبلوم في دخول كلية هندسة | وازاي الابلكيشن ساعدهم في الرحلة "'
		},
		{
			id: 'bmQ9KjBbsAI',
			title: 'بودكاست رحلة صعود اتنين من طلاب التعليم الفني',
			heading: 'بودكاست رحلة صعود اتنين من طلاب التعليم الفني',
			description: '"معاناة طلاب التعليم الفني في دخول كلية هندسة | وازاي الابلكيشن ساعدهم في الرحلة "'
		}
	];
	
	features = ['مناهج بسيطة مُحدّثة 2026 ', 'شرح + أمثلة + امتحانات إلكترونية', 'خطط مذاكرة تناسب وقتك', 'دعم ومتابعة علي مدار 24 ساعة'];
	
	// Animated descriptions with highlighted words
	descriptions = [
		{ text: 'أعلي نسبة نجاح في مصر', highlight: ['أعلي نسبة نجاح', 'مصر'] },
		{ text: 'قوانين اللعبة اتغيــرت', highlight: [' اللعبة', ' اتغيــرت'] },
		{ text: 'أكبر فريق مساعدين في مصر لطلاب المعادلة', highlight: ['أكبر فريق مساعدين', 'مصر', 'طلاب المعادلة'] },
		{ text: 'بنجهزك لإجتياز معادلة هندسة بسهولة', highlight: ['بنجهزك', 'معادلة هندسة', 'بسهولة'] },
		{ text: 'بنجهزك لإجتياز معادلة حاسبات بسهولة', highlight: ['بنجهزك', 'معادلة حاسبات', 'بسهولة'] },
		{ text: 'معادلة هندسة وحاسبات بالعربي والإنجليزي', highlight: ['معادلة هندسة وحاسبات', 'بالعربي والإنجليزي'] },
		{ text: 'دعم ومتابعة علي مدار اليوم', highlight: ['دعم ومتابعة', 'مدار اليوم'] },
		{ text: 'طاقم هندسي علي أعلي مستوي', highlight: ['طاقم هندسي', 'أعلي مستوي'] }
	];
	currentDescriptionIndex = 0;
	currentDescription = this.descriptions[0];
	private descriptionInterval?: ReturnType<typeof setInterval>;
	private photoAutoPlayTimer?: ReturnType<typeof setInterval>;
	private featuresAutoPlayTimer?: ReturnType<typeof setInterval>;
	featuresAutoPlayPaused = false;
	private isTyping = false;
	private isDeleting = false;
	private typedText = '';
	private fullText = '';
	private typingSpeed = 50;
	private deletingSpeed = 30;
	private pauseTime = 2000;
	
	// Lightbox state
	selectedPhoto: string | null = null;
	
	// Photos of successful students 2025
	studentPhotos2025 = [
		'طلاب 2025/WhatsApp Image 2025-10-28 at 16.40.57_bf8b0500.jpg',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.22.25_1031edee.jpg',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.52.05_6cf2a0b2.jpg',
		'طلاب 2025/IMG-20251027-WA0015.jpg',
		'طلاب 2025/IMG-20251027-WA0016.jpg',
		'طلاب 2025/IMG-20251027-WA0017.jpg',
		'طلاب 2025/IMG-20251027-WA0018.jpg',
		'طلاب 2025/IMG-20251027-WA0019.jpg',
		'طلاب 2025/IMG-20251027-WA0020.jpg',
		'طلاب 2025/IMG-20251027-WA0021.jpg',
		'طلاب 2025/IMG-20251027-WA0022.jpg',
		'طلاب 2025/IMG-20251027-WA0023.jpg',
		'طلاب 2025/IMG-20251027-WA0086.jpg',
		'طلاب 2025/IMG-20251027-WA0024.jpg',
		'طلاب 2025/IMG-20251027-WA0025.jpg',
		'طلاب 2025/IMG-20251027-WA0026.jpg',
		'طلاب 2025/IMG-20251027-WA0027.jpg',
		'طلاب 2025/IMG-20251027-WA0028.jpg',
		'طلاب 2025/IMG-20251027-WA0029.jpg',
		'طلاب 2025/IMG-20251027-WA0030.jpg',
		'طلاب 2025/IMG-20251027-WA0031.jpg',
		'طلاب 2025/IMG-20251027-WA0032.jpg',
		'طلاب 2025/IMG-20251027-WA0033.jpg',
		'طلاب 2025/IMG-20251027-WA0034.jpg',
		'طلاب 2025/IMG-20251027-WA0035.jpg',
		'طلاب 2025/IMG-20251027-WA0036.jpg',
		'طلاب 2025/IMG-20251027-WA0037.jpg',
		'طلاب 2025/IMG-20251027-WA0038.jpg',
		'طلاب 2025/IMG-20251027-WA0039.jpg',
		'طلاب 2025/IMG-20251027-WA0040.jpg',
		'طلاب 2025/IMG-20251027-WA0041.jpg',
		'طلاب 2025/IMG-20251027-WA0042.jpg',
		'طلاب 2025/IMG-20251027-WA0043.jpg',
		'طلاب 2025/IMG-20251027-WA0044.jpg',
		'طلاب 2025/IMG-20251027-WA0045.jpg',
		'طلاب 2025/IMG-20251027-WA0046.jpg',
		'طلاب 2025/IMG-20251027-WA0047.jpg',
		'طلاب 2025/IMG-20251027-WA0048.jpg',
		'طلاب 2025/IMG-20251027-WA0049.jpg',
		'طلاب 2025/IMG-20251027-WA0050.jpg',
		'طلاب 2025/IMG-20251027-WA0051.jpg',
		'طلاب 2025/IMG-20251027-WA0052.jpg',
		'طلاب 2025/IMG-20251027-WA0053.jpg',
		'طلاب 2025/IMG-20251027-WA0054.jpg',
		'طلاب 2025/IMG-20251027-WA0055.jpg',
		'طلاب 2025/IMG-20251027-WA0056.jpg',
		'طلاب 2025/IMG-20251027-WA0057.jpg',
		'طلاب 2025/IMG-20251027-WA0058.jpg',
		'طلاب 2025/IMG-20251027-WA0059.jpg',
		'طلاب 2025/IMG-20251027-WA0060.jpg',
		'طلاب 2025/IMG-20251027-WA0061.jpg',
		'طلاب 2025/IMG-20251027-WA0062.jpg',
		'طلاب 2025/IMG-20251027-WA0063.jpg',
		'طلاب 2025/IMG-20251027-WA0064.jpg',
		'طلاب 2025/IMG-20251027-WA0065.jpg',
		'طلاب 2025/IMG-20251027-WA0066.jpg',
		'طلاب 2025/IMG-20251027-WA0067.jpg',
		'طلاب 2025/IMG-20251027-WA0068.jpg',
		'طلاب 2025/IMG-20251027-WA0069.jpg',
		'طلاب 2025/IMG-20251027-WA0070.jpg',
		'طلاب 2025/IMG-20251027-WA0071.jpg',
		'طلاب 2025/IMG-20251027-WA0072.jpg',
		'طلاب 2025/IMG-20251027-WA0073.jpg',
		'طلاب 2025/IMG-20251027-WA0074.jpg',
		'طلاب 2025/IMG-20251027-WA0076.jpg',
		'طلاب 2025/IMG-20251027-WA0077.jpg',
		'طلاب 2025/IMG-20251027-WA0078.jpg',
		'طلاب 2025/IMG-20251027-WA0079.jpg',
		'طلاب 2025/IMG-20251027-WA0080.jpg',
		'طلاب 2025/IMG-20251027-WA0081.jpg',
		'طلاب 2025/IMG-20251027-WA0082.jpg',
		'طلاب 2025/IMG-20251027-WA0083.jpg',
		'طلاب 2025/IMG-20251027-WA0084.jpg',
		'طلاب 2025/IMG-20251027-WA0085.jpg'
	];
	
	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private jsonld: JsonLdService,
		private contentService: MonthlyContentService,
		private sanitizer: DomSanitizer,
		private http: HttpClient
	) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'ابلكيشن معادلة كلية هندسة';
		const description = 'بنجهّزك لاجتياز معادلة كلية الهندسة بخطوات واضحة ومحتوى مُبسّط وتمارين عملية.';
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url: siteUrl });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical();
		this.jsonld.setJsonLd({
			"@context": "https://schema.org",
			"@type": "Organization",
			name: 'معادلة كلية هندسة',
			url: siteUrl
		});
		this.jsonld.setJsonLd({
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: 'معادلة كلية هندسة',
			url: siteUrl,
		}, 'website-ld');
	}

	ngOnInit() {
		// العودة إلى أعلى الصفحة عند تحميل الصفحة
		if (typeof window !== 'undefined') {
			window.scrollTo(0, 0);
			this.shouldUseHeroVideo = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator as any).connection?.saveData;
		}
		
		this.contentService.loadPageState('home', cmsPageDefaults.home).subscribe(content => {
			this.applyCmsState(content);
			this.startDescriptionAnimation();
		});
		this.loadPublishedFeedbacks();
		if (typeof window !== 'undefined') window.addEventListener('focus', this.refreshPublishedFeedbacksOnFocus, { passive: true });
	}

	private loadPublishedFeedbacks(): void {
		this.http.get<{ data: Array<{ name: string; university?: string; rating: number; message: string }> }>(this.feedbackEndpoint).subscribe({ next: response => { this.publishedFeedbacks = response.data || []; }, error: () => undefined });
	}

	private applyCmsState(content: unknown): void {
		const state = content as {
			hero?: {
				features?: string[];
				descriptions?: Array<{ text: string; highlight: string[] }>;
			};
			photos?: {
				items?: string[];
			};
		};

		if (Array.isArray(state.hero?.features)) {
			this.features = state.hero.features;
		}

		if (Array.isArray(state.hero?.descriptions) && state.hero.descriptions.length) {
			this.descriptions = state.hero.descriptions;
			this.currentDescriptionIndex = 0;
			this.currentDescription = this.descriptions[0];
			this.typedText = '';
			this.isDeleting = false;
		}

		if (Array.isArray(state.photos?.items) && state.photos.items.length) {
			this.studentPhotos2025 = state.photos.items;
		}
	}
	
	private startDescriptionAnimation() {
		this.typeText();
	}
	
	private typeText() {
		// Use requestAnimationFrame for better performance
		if (typeof window === 'undefined') return;
		
		const currentDesc = this.descriptions[this.currentDescriptionIndex];
		this.fullText = currentDesc.text;
		
		if (!this.isDeleting && this.typedText.length < this.fullText.length) {
			// Typing
			this.isTyping = true;
			this.typedText = this.fullText.substring(0, this.typedText.length + 1);
			requestAnimationFrame(() => {
				setTimeout(() => this.typeText(), this.typingSpeed);
			});
		} else if (!this.isDeleting && this.typedText.length === this.fullText.length) {
			// Pause after typing complete
			this.isTyping = false;
			setTimeout(() => {
				this.isDeleting = true;
				this.typeText();
			}, this.pauseTime);
		} else if (this.isDeleting && this.typedText.length > 0) {
			// Deleting
			this.typedText = this.fullText.substring(0, this.typedText.length - 1);
			requestAnimationFrame(() => {
				setTimeout(() => this.typeText(), this.deletingSpeed);
			});
		} else if (this.isDeleting && this.typedText.length === 0) {
			// Move to next description
			this.isDeleting = false;
			this.currentDescriptionIndex = (this.currentDescriptionIndex + 1) % this.descriptions.length;
			setTimeout(() => this.typeText(), 500);
		}
	}
	
	getDisplayText(): string {
		return this.typedText;
	}
	
	isHighlighted(word: string): boolean {
		const currentDesc = this.descriptions[this.currentDescriptionIndex];
		// Check if word matches any highlight phrase
		for (const highlight of currentDesc.highlight) {
			// Direct match
			if (word.trim() === highlight.trim()) {
				return true;
			}
			// Check if word contains highlight or vice versa
			if (word.includes(highlight) || highlight.includes(word)) {
				return true;
			}
			// Check if word is part of a multi-word highlight
			const highlightWords = highlight.split(' ');
			if (highlightWords.some(hw => word.includes(hw) || hw.includes(word))) {
				return true;
			}
		}
		return false;
	}
	
	getWords(): string[] {
		return this.typedText.split(' ').filter(w => w.length > 0);
	}
	
	ngOnDestroy() {
		if (typeof window !== 'undefined') window.removeEventListener('focus', this.refreshPublishedFeedbacksOnFocus);
		if (this.descriptionInterval) {
			clearInterval(this.descriptionInterval);
		}
		if (this.photoAutoPlayTimer) {
			clearInterval(this.photoAutoPlayTimer);
		}
		if (this.featuresAutoPlayTimer) {
			clearInterval(this.featuresAutoPlayTimer);
		}
	}

	ngAfterViewInit() {
		// Setup video autoplay after view is initialized
		this.setupVideoAutoplay();
		this.setupPhotoAutoplay();
		this.setupFeaturesAutoplay();
	}

	private setupFeaturesAutoplay(): void {
		if (typeof window === 'undefined' || !window.matchMedia('(max-width: 639px)').matches) return;
		this.featuresAutoPlayTimer = setInterval(() => {
			if (!this.featuresTrack || this.featuresAutoPlayPaused) return;
			const track = this.featuresTrack.nativeElement;
			const card = track.querySelector<HTMLElement>('.feature-card-modern');
			if (!card) return;
			const step = card.offsetWidth + 14;
			const maxScroll = track.scrollWidth - track.clientWidth;
			const nextScroll = track.scrollLeft - step;
			if (maxScroll <= 0 || Math.abs(nextScroll) >= maxScroll - 8) {
				track.scrollTo({ left: 0, behavior: 'smooth' });
				return;
			}
			track.scrollTo({ left: nextScroll, behavior: 'smooth' });
		}, 3000);
	}

	pauseFeaturesAutoplay(): void {
		this.featuresAutoPlayPaused = true;
	}

	resumeFeaturesAutoplay(): void {
		this.featuresAutoPlayPaused = false;
	}

	private setupPhotoAutoplay(): void {
		if (typeof window === 'undefined') return;
		this.photoAutoPlayTimer = setInterval(() => {
			if (!this.photosTrack) return;
			const track = this.photosTrack.nativeElement;
			const maxScroll = track.scrollWidth - track.clientWidth;
			const cardWidth = track.querySelector('.photo-card')?.clientWidth || 200;
			const step = cardWidth + 16;
			const nextScroll = track.scrollLeft - step;
			if (maxScroll <= 0 || Math.abs(nextScroll) >= maxScroll - 8) {
				track.scrollTo({ left: 0, behavior: 'smooth' });
				return;
			}
			track.scrollTo({ left: nextScroll, behavior: 'smooth' });
		}, 3200);
	}
	
	private setupVideoAutoplay() {
		if (typeof window === 'undefined' || !this.shouldUseHeroVideo) return;

		setTimeout(() => {
			const video = this.heroVideo?.nativeElement;
			if (!video) return;
			void this.playHeroVideo(video);
		}, 150);
	}

	private playHeroVideo(video: HTMLVideoElement): Promise<void> {
		video.muted = true;
		video.setAttribute('muted', 'true');
		video.volume = 0;
		return video.play().then(() => {
			this.videoPlaying = true;
		}).catch(() => {
			this.videoPlaying = false;
		});
	}

	loadHomeVideo(videoId: string): void {
		this.activeHomeVideoId = videoId;
	}

	toggleFinalSubscriptionChoices(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.showFinalSubscriptionChoices = !this.showFinalSubscriptionChoices;
	}

	closeFinalSubscriptionChoices(): void {
		this.showFinalSubscriptionChoices = false;
	}

	toggleFinalTeacherChoices(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.showFinalTeacherChoices = !this.showFinalTeacherChoices;
	}

	closeFinalTeacherChoices(): void {
		this.showFinalTeacherChoices = false;
	}

	isHomeVideoLoaded(videoId: string): boolean {
		return this.activeHomeVideoId === videoId;
	}

	getHomeVideoThumbnail(videoId: string): string {
		return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
	}

	getHomeVideoEmbedUrl(videoId: string): SafeResourceUrl {
		const url = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
		return this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	getHomeVideoWatchUrl(videoId: string): string {
		return `https://youtu.be/${videoId}`;
	}
	
	scrollReviewsPrev() {
		if (this.reviewsTrack) {
			const track = this.reviewsTrack.nativeElement;
			const cardWidth = track.querySelector('.carousel-figure')?.clientWidth || 300;
			track.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
		}
	}

	scrollReviewsNext() {
		if (this.reviewsTrack) {
			const track = this.reviewsTrack.nativeElement;
			const cardWidth = track.querySelector('.carousel-figure')?.clientWidth || 300;
			track.scrollBy({ left: -(cardWidth + 16), behavior: 'smooth' });
		}
	}

	scrollPhotosPrev() {
		if (this.photosTrack) {
			const track = this.photosTrack.nativeElement;
			const cardWidth = track.querySelector('.photo-card')?.clientWidth || 200;
			track.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
		}
	}

	scrollPhotosNext() {
		if (this.photosTrack) {
			const track = this.photosTrack.nativeElement;
			const cardWidth = track.querySelector('.photo-card')?.clientWidth || 200;
			track.scrollBy({ left: -(cardWidth + 16), behavior: 'smooth' });
		}
	}

	openPhoto(photo: string) {
		this.selectedPhoto = photo;
		// Prevent body scroll when modal is open
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
		}
	}

	closePhoto() {
		this.selectedPhoto = null;
		// Restore body scroll
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'auto';
		}
	}

	onVideoReady() {
		const video = this.heroVideo?.nativeElement;
		if (video) {
			void this.playHeroVideo(video);
		}
	}

	onVideoCanPlay() {
		const video = this.heroVideo?.nativeElement;
		if (video) {
			void this.playHeroVideo(video);
		}
	}

	onVideoPlaying() {
		this.videoPlaying = true;
	}

	onVideoError() {
		const video = this.heroVideo?.nativeElement;
		if (video) {
			// Try to reload the video
			video.load();
			// Try to play again after a short delay
			setTimeout(() => {
				if (video) {
					void this.playHeroVideo(video);
				}
			}, 500);
		}
	}

}
