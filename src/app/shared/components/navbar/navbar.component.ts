import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { CommonModule, ViewportScroller } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'app-navbar',
	standalone: true,
	imports: [RouterLink, CommonModule],
	templateUrl: './navbar.component.html',
	styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
	scrolled = false;
	navbarHidden = false;
	private lastScrollY = 0;
	showSocial = false;
	currentRoute = '';
	showFollowUpButton = false;
	isMobileMenuOpen = false;
	isRequirementsDropdownOpen = false;
	isNewsDropdownOpen = false;
	isMobileNewsDropdownOpen = false;
	isMobileRequirementsDropdownOpen = false;
	isPlatformDropdownOpen = false;
	isMobilePlatformDropdownOpen = false;
	isSubscriptionDropdownOpen = false;
	isMobileSubscriptionDropdownOpen = false;
	isEngineersDropdownOpen = false;
	isMobileEngineersDropdownOpen = false;
	isMobile = false;

	constructor(private router: Router, private viewportScroller: ViewportScroller) {
		if (typeof window !== 'undefined') {
			this.checkScreenSize();
			window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
			window.addEventListener('resize', () => {
				this.checkScreenSize();
			});
		}
	}

	private handleScroll(): void {
		if (typeof window === 'undefined') return;
		const currentScrollY = window.scrollY;
		this.scrolled = currentScrollY > 8;
		if (currentScrollY <= 24) {
			this.navbarHidden = false;
		} else if (!this.isMobileMenuOpen && currentScrollY > this.lastScrollY + 4) {
			this.navbarHidden = true;
		} else if (currentScrollY < this.lastScrollY - 4) {
			this.navbarHidden = false;
		}
		this.lastScrollY = currentScrollY;
	}

	checkScreenSize() {
		if (typeof window !== 'undefined') {
			this.isMobile = window.innerWidth < 1280;
		}
	}

	ngOnInit() {
		this.router.events
			.pipe(filter(event => event instanceof NavigationEnd))
			.subscribe((event: NavigationEnd) => {
				this.currentRoute = event.url;
				// إغلاق جميع القوائم المنسدلة عند الانتقال لصفحة جديدة
				this.closeAllDropdowns();
			});
	}

	isActiveRoute(route: string): boolean {
		if (route === '/' && this.currentRoute === '/') {
			return true;
		}
		if (route !== '/' && this.currentRoute.startsWith(route)) {
			return true;
		}
		return false;
	}

	scrollToTop() {
		if (typeof window !== 'undefined') {
			// التمرير إلى الأعلى بسلاسة
			window.scrollTo({
				top: 0,
				left: 0,
				behavior: 'smooth'
			});
			
			// استخدام ViewportScroller كبديل
			this.viewportScroller.scrollToPosition([0, 0]);
		}
	}

	toggleMobileMenu() {
		this.isMobileMenuOpen = !this.isMobileMenuOpen;
	}

	closeMobileMenu() {
		this.isMobileMenuOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المحمولة
		this.scrollToTop();
	}

	toggleRequirementsDropdown() {
		const next = !this.isRequirementsDropdownOpen;
		this.closeDropdownMenus();
		this.isRequirementsDropdownOpen = next;
	}

	closeRequirementsDropdown() {
		this.isRequirementsDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة
		this.scrollToTop();
	}

	toggleNewsDropdown() {
		const next = !this.isNewsDropdownOpen;
		this.closeDropdownMenus();
		this.isNewsDropdownOpen = next;
	}

	closeNewsDropdown() {
		this.isNewsDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة
		this.scrollToTop();
	}

	toggleMobileNewsDropdown() {
		const next = !this.isMobileNewsDropdownOpen;
		this.closeDropdownMenus();
		this.isMobileNewsDropdownOpen = next;
	}

	toggleMobileRequirementsDropdown() {
		const next = !this.isMobileRequirementsDropdownOpen;
		this.closeDropdownMenus();
		this.isMobileRequirementsDropdownOpen = next;
	}

	closeMobileNewsDropdown() {
		this.isMobileNewsDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة المحمولة
		this.scrollToTop();
	}

	closeMobileRequirementsDropdown() {
		this.isMobileRequirementsDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة المحمولة
		this.scrollToTop();
	}

	togglePlatformDropdown() {
		const next = !this.isPlatformDropdownOpen;
		this.closeDropdownMenus();
		this.isPlatformDropdownOpen = next;
	}

	closePlatformDropdown() {
		this.isPlatformDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة
		this.scrollToTop();
	}

	toggleMobilePlatformDropdown() {
		const next = !this.isMobilePlatformDropdownOpen;
		this.closeDropdownMenus();
		this.isMobilePlatformDropdownOpen = next;
	}

	closeMobilePlatformDropdown() {
		this.isMobilePlatformDropdownOpen = false;
		// التمرير إلى الأعلى عند إغلاق القائمة المنسدلة المحمولة
		this.scrollToTop();
	}

	toggleSubscriptionDropdown() {
		const next = !this.isSubscriptionDropdownOpen;
		this.closeDropdownMenus();
		this.isSubscriptionDropdownOpen = next;
	}

	closeSubscriptionDropdown() {
		this.isSubscriptionDropdownOpen = false;
		this.scrollToTop();
	}

	toggleMobileSubscriptionDropdown() {
		const next = !this.isMobileSubscriptionDropdownOpen;
		this.closeDropdownMenus();
		this.isMobileSubscriptionDropdownOpen = next;
	}

	closeMobileSubscriptionDropdown() {
		this.isMobileSubscriptionDropdownOpen = false;
		this.scrollToTop();
	}

	toggleEngineersDropdown() {
		const next = !this.isEngineersDropdownOpen;
		this.closeDropdownMenus();
		this.isEngineersDropdownOpen = next;
	}
	closeEngineersDropdown() { this.isEngineersDropdownOpen = false; this.scrollToTop(); }
	toggleMobileEngineersDropdown() {
		const next = !this.isMobileEngineersDropdownOpen;
		this.closeDropdownMenus();
		this.isMobileEngineersDropdownOpen = next;
	}
	closeMobileEngineersDropdown() { this.isMobileEngineersDropdownOpen = false; this.scrollToTop(); }

	private closeDropdownMenus() {
		this.isRequirementsDropdownOpen = false;
		this.isNewsDropdownOpen = false;
		this.isPlatformDropdownOpen = false;
		this.isSubscriptionDropdownOpen = false;
		this.isEngineersDropdownOpen = false;
		this.isMobileNewsDropdownOpen = false;
		this.isMobileRequirementsDropdownOpen = false;
		this.isMobilePlatformDropdownOpen = false;
		this.isMobileSubscriptionDropdownOpen = false;
		this.isMobileEngineersDropdownOpen = false;
	}

	// دالة لإغلاق جميع القوائم المنسدلة
	closeAllDropdowns() {
		// إغلاق القوائم المنسدلة للديسكتوب
		this.isRequirementsDropdownOpen = false;
		this.isNewsDropdownOpen = false;
		this.isPlatformDropdownOpen = false;
		this.isSubscriptionDropdownOpen = false;
		this.isEngineersDropdownOpen = false;
		
		// إغلاق القوائم المنسدلة للموبايل
		this.isMobileNewsDropdownOpen = false;
		this.isMobileRequirementsDropdownOpen = false;
		this.isMobilePlatformDropdownOpen = false;
		this.isMobileSubscriptionDropdownOpen = false;
		this.isMobileEngineersDropdownOpen = false;
		
		// إغلاق القائمة المحمولة الرئيسية
		this.isMobileMenuOpen = false;
	}
}
