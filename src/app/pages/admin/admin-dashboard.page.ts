import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { CmsPageKey, cmsPageOptions } from '../../core/cms-page.registry';
import { displayProgramLabel } from '../../core/program-labels';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { AdminApiService, AdminUser, Customer, DashboardSummary, Feedback, Lead, Program, WheelClaim } from '../../core/services/admin-api.service';
import { SeoService } from '../../core/seo.service';
import { ContactFormComponent } from './forms/contact-form.component';
import { FaqFormComponent } from './forms/faq-form.component';
import { HomeFormComponent } from './forms/home-form.component';
import { NewsFormComponent } from './forms/news-form.component';
import { SubDetailsFormComponent } from './forms/sub-details-form.component';
import { SubAbReviewsFormComponent } from './forms/sub-ab-reviews-form.component';
import { JsonContentFormComponent } from './forms/json-content-form.component';
import { SuccessStoriesFormComponent } from './forms/success-stories-form.component';
import { Batch2027FormComponent } from './forms/batch-2027-form.component';
import { LaunchOfferFormComponent } from './forms/launch-offer-form.component';
import { RequirementsFormComponent } from './forms/requirements-form.component';
import { SchoolsFormComponent } from './forms/schools-form.component';
import { ProgramLabelPipe } from '../../shared/pipes/program-label.pipe';
import { DEFAULT_SCHOOLS } from '../../core/schools.defaults';

interface PageOption {
	key: CmsPageKey;
	route: string;
	title: string;
	description: string;
	group: string;
}

type AdminDataView = 'overview' | 'leads' | 'customers' | 'feedback' | 'programs' | 'wheel' | 'admins';
type PaginationItem = number | '…';

@Component({
	selector: 'app-admin-dashboard-page',
	standalone: true,
	imports: [
		CommonModule,
		FormsModule,
		ContactFormComponent,
		FaqFormComponent,
		HomeFormComponent,
		NewsFormComponent,
		SubDetailsFormComponent,
		SubAbReviewsFormComponent,
		JsonContentFormComponent,
		SuccessStoriesFormComponent,
		Batch2027FormComponent,
		LaunchOfferFormComponent,
		RequirementsFormComponent,
		SchoolsFormComponent,
		ProgramLabelPipe
	],
	templateUrl: './admin-dashboard.page.html',
	styleUrls: ['./admin-dashboard.page.css']
})
export class AdminDashboardPageComponent implements OnInit {
	sidebarOpen = false;
	sidebarCollapsed = false;
	activeView: 'overview' | 'leads' | 'customers' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms' = 'leads';
	dashboard: DashboardSummary | null = {
		totalLeads: 0,
		todayLeads: 0,
		wheelClaimsCount: 0,
		byStatus: {},
		byProgram: {},
		recentLeads: [],
		recentActivity: []
	};
	leads: Lead[] = [];
	customers: Customer[] = [];
	customersPage = 1; customersPages = 1; customersTotal = 0; customerSearch = ''; customerStatus = ''; isLoadingCustomers = false; private customersLoaded = false;
	readonly customerStatuses = ['new', 'batch_28', 'contacted', 'no_response', 'interested', 'registered', 'not_interested', 'follow_up', 'closed'];
	customerPendingDeletion: Customer | null = null; customerPendingView: Customer | null = null; customerPendingNote: Customer | null = null; customerPendingReadNote: Customer | null = null; customerPendingEdit: Customer | null = null; customerEditName = ''; customerEditPhone = ''; customerNoteDraft = ''; isSavingCustomerNote = false; isSavingCustomerEdit = false;
	openCustomerActionMenuId: string | null = null;
	get openCustomerAction(): Customer | null { return this.customers.find(customer => customer.id === this.openCustomerActionMenuId) || null; }
	customerImportPreview: { importId: string; added: number; duplicate: number; invalid: number; total: number } | null = null;
	customerImportInstructionsOpen = false;
	programs: Program[] = [];
	wheelClaims: WheelClaim[] = [];
	wheelPage = 1;
	wheelPages = 1;
	wheelPageNumbers: PaginationItem[] = [1];
	wheelTotal = 0;
	feedbacks: Feedback[] = [];
	feedbackPage = 1;
	feedbackPages = 1;
	feedbackPageNumbers: PaginationItem[] = [1];
	feedbackTotal = 0;
	readonly expandedFeedbackIds = new Set<string>();
	feedbackSearch = '';
	feedbackStatus = '';
	readonly feedbackStatuses: Feedback['status'][] = ['new', 'reviewed', 'published', 'archived'];
	readonly feedbackStatusLabels: Record<string, string> = { new: 'جديد', reviewed: 'تمت المراجعة', published: 'منشور', archived: 'مؤرشف' };
	isLoadingFeedback = false;
	isLoadingOverview = false;
	private feedbackLoaded = false;
	adminUsers: AdminUser[] = [];
	adminUserDraft = { username: '', password: '', permissions: [] as string[] };
	isAdminUserCreateOpen = false;
	showAdminUserPassword = false;
	adminUserFormError = '';
	adminUserPasswordDraft: Record<string, string> = {};
	adminUserPasswordVisibility: Record<string, boolean> = {};
	adminPasswordModalUser: AdminUser | null = null;
	adminPasswordModalDraft = '';
	adminPasswordModalVisible = false;
	adminPermissionModalUser: AdminUser | null = null;
	adminUserPermissionDraft: Record<string, string[]> = {};
	adminPermissionEdit: Record<string, boolean> = {};
	isLoadingAdminUsers = false;
	isLoadingPrograms = false;
	isLoadingWheelClaims = false;
	private overviewLoaded = false;
	private overviewRequestId = 0;
	private leadsLoaded = false;
	private programsLoaded = false;
	private wheelClaimsLoaded = false;
	private adminUsersLoaded = false;
	get adminPageOptions(): PageOption[] { return cmsPageOptions.filter(page => !this.hiddenAdminPageKeys.has(page.key)); }
	readonly adminFeatureOptions = [{ key: 'leads', title: 'الليدز' }, { key: 'customers', title: 'العملاء' }, { key: 'wheel', title: 'نتائج العجلة' }, { key: 'feedback', title: 'آراء الطلاب' }];
	wheelSearch = '';
	wheelGift = '';
	wheelProgram = '';
	wheelDateFrom = '';
	wheelDateTo = '';
	wheelFiltersOpen = false;
	leadsFiltersOpen = false;
	readonly wheelGiftOptions = ['', '50 جنيه', '100 جنيه', '200 جنيه', 'خصم 10%', 'خصم 15%', 'خصم 20%', 'حظ سعيد'];
	leadSearch = '';
	leadStatus = '';
	leadSource = '';
	leadPlatform = '';
	leadCampaign = '';
	leadProgram = '';
	leadDateFrom = '';
	leadDateTo = '';
	readonly leadSourceOptions = ['', 'فيسبوك', 'إنستجرام', 'تيك توك', 'يوتيوب', 'ترشيح من صديق', 'أخرى'];
	displayProgramLabel(value: string): string { return displayProgramLabel(value); }
	readonly defaultLeadProgramOptions = ['', 'معادلة هندسة عربي', 'معادلة حاسبات عربي', 'معادلة هندسة إنجليزي', 'معادلة حاسبات إنجليزي'];
	leadProgramOptions = [...this.defaultLeadProgramOptions];
	leadsPage = 1;
	copiedLeadWhatsapp = '';
	leadsPages = 1;
	leadPageNumbers: PaginationItem[] = [1];
	leadsTotal = 0;
	leadStatuses = ['new', 'batch_28', 'contacted', 'no_response', 'interested', 'registered', 'not_interested', 'follow_up', 'closed'];
	readonly leadStatusLabels: Record<string, string> = { new: 'جديد', batch_28: 'دفعة 28', contacted: 'تم التواصل', no_response: 'لم يرد', interested: 'مهتم', registered: 'مسجل', not_interested: 'غير مهتم', follow_up: 'متابعة', closed: 'مغلق', converted: 'تم التحويل' };
	programDraft: Partial<Program> = { name: '', slug: '', category: '', language: 'ar', price: 0, enrollmentStatus: 'open', isActive: true };
	editingProgramId: string | null = null;
	private readonly hiddenAdminPageKeys = new Set<CmsPageKey>([
		'home',
		'faq',
		'contact',
		'requirements',
		'success-stories',
		'feedback',
		'photos-2025',
		'engineers'
	]);
	pageOptions: PageOption[] = cmsPageOptions.filter(page => !this.hiddenAdminPageKeys.has(page.key));

	selectedPageKey: CmsPageKey = 'batch-2027';
	currentContent: unknown = null;
	statusMessage = '';
	errorMessage = '';
	adminUsername = '';
	openAdminActionUser: string | null = null;
	get openAdminUser(): AdminUser | null { return this.adminUsers.find(user => user.username === this.openAdminActionUser) || null; }
	siteMaintenance = false;
	isSavingSiteMode = false;
	isSaving = false;
	isLoading = false;
	isLoadingLeads = false;
	leadPendingDeletion: Lead | null = null;
	leadPendingNote: Lead | null = null;
	leadPendingReadNote: Lead | null = null;
	leadPendingView: Lead | null = null;
	openLeadActionMenuId: string | null = null;
	get openLeadAction(): Lead | null { return this.leads.find(lead => lead.id === this.openLeadActionMenuId) || null; }
	leadNoteDraft = '';
	isSavingLeadNote = false;
	wheelPendingDeletion: WheelClaim | null = null;
	wheelPendingNote: WheelClaim | null = null;
	wheelPendingReadNote: WheelClaim | null = null;
	wheelPendingView: WheelClaim | null = null;
	wheelNoteDraft = '';
	isSavingWheelNote = false;
	openWheelActionMenuId: string | null = null;
	get openWheelAction(): WheelClaim | null { return this.wheelClaims.find(claim => claim.token === this.openWheelActionMenuId) || null; }
	pageSummaries: Record<string, { hasContent: boolean; updatedAt?: string }> = {};
	private pendingCmsNavigation = false;
	private leadsRequestId = 0;
	private pageLoadRequestId = 0;
	private authStateReady = false;
	private routeStateReady = false;

	constructor(
		private contentService: MonthlyContentService,
		private auth: AdminAuthService,
		private adminApi: AdminApiService,
		private router: Router,
		private route: ActivatedRoute,
		private seo: SeoService,
		private changeDetector: ChangeDetectorRef
	) {}

	private refreshView(): void {
		this.changeDetector.detectChanges();
	}

	ngOnInit(): void {
		this.adminUsername = this.auth.getUsername();
		if (this.auth.isAuthenticated()) {
			this.auth.loadCurrentUser().subscribe({
				next: user => { this.adminUsername = user.username || this.adminUsername; this.authStateReady = true; this.syncRouteState(); },
				error: () => { this.authStateReady = true; this.syncRouteState(); }
			});
		} else {
			this.authStateReady = true;
		}
		this.seo.setTitle('لوحة تحكم الإدارة');
		this.seo.setRobots('noindex, nofollow, noarchive');
		this.refreshSummaries();
		this.route.paramMap.subscribe(() => {
			if (!this.authStateReady) return;
			this.syncRouteState();
		});
		this.route.queryParamMap.subscribe(() => {
			if (!this.authStateReady || !this.routeStateReady) return;
			this.syncRouteState();
		});
	}

	private syncRouteState(): void {
		this.closeActionMenus();
		const params = this.route.snapshot.paramMap;
		const pageKey = this.resolvePageKey(params.get('pageKey'));
			const isCmsNavigation = this.pendingCmsNavigation;
			this.selectedPageKey = pageKey;
			if (this.pendingCmsNavigation) {
				this.activeView = 'cms';
				this.pendingCmsNavigation = false;
			} else {
				const requestedView = this.resolveDataView(this.route.snapshot.queryParamMap.get('view'));
				const hasCmsRoute = !!this.route.snapshot.paramMap.get('pageKey');
				const canOpenCmsPage = hasCmsRoute && this.auth.canAccessPage(pageKey);
			if (this.auth.getRole() === 'admin') {
				// A CMS page in the URL is authoritative. Ignore any stale query view
				// so refreshes and repeated route-sync events cannot switch it to leads.
				this.activeView = canOpenCmsPage ? 'cms' : requestedView || 'leads';
				// Load only the visible section. Loading every admin section at once
				// exhausts the production database connection pool and makes one of
				// the otherwise unrelated requests fail intermittently.
				if (this.activeView === 'overview') this.loadOverview();
				if (this.activeView === 'leads') this.loadLeads();
				if (this.activeView === 'customers') this.loadCustomers();
				if (this.activeView === 'feedback') this.loadFeedback();
				if (this.activeView === 'programs') this.loadPrograms();
				if (this.activeView === 'wheel') this.loadWheelClaims();
				if (this.activeView === 'admins') this.loadAdminUsers();
				this.loadSiteMode();
				} else if (canOpenCmsPage) {
					this.activeView = 'cms';
				} else if (this.auth.isLeadsOnly() || this.auth.canAccessFeature('leads') || this.auth.canAccessFeature('customers') || this.auth.canAccessFeature('wheel') || this.auth.canAccessFeature('feedback')) {
					const canLoadLeads = this.auth.canAccessFeature('leads');
					const canLoadCustomers = this.auth.canAccessFeature('customers');
					const canLoadWheel = this.auth.canAccessFeature('wheel');
					const canLoadFeedback = this.auth.canAccessFeature('feedback');
					this.activeView = canLoadLeads ? 'leads' : canLoadCustomers ? 'customers' : canLoadWheel ? 'wheel' : 'feedback';
					if (canLoadLeads) this.loadLeads();
					if (canLoadCustomers) this.loadCustomers();
					if (canLoadWheel) this.loadWheelClaims();
					if (canLoadFeedback) this.loadFeedback();
				} else {
					this.activeView = 'cms';
				}
			}
		if (!isCmsNavigation) this.loadPage(pageKey);
		this.routeStateReady = true;
	}

	loadSiteMode(): void {
		if (this.auth.getRole() !== 'admin') return;
		this.adminApi.getSiteMode().subscribe({ next: value => { this.siteMaintenance = value.maintenance; this.refreshView(); }, error: err => this.handleApiError(err) });
	}

	toggleSiteMaintenance(): void {
		if (this.isSavingSiteMode) return;
		const nextValue = !this.siteMaintenance;
		const message = nextValue
			? 'سيتم إيقاف الموقع أمام الزوار وإظهار صفحة التحديثات. هل تريد المتابعة؟'
			: 'سيتم فتح الموقع أمام الزوار مرة أخرى. هل تريد المتابعة؟';
		if (!window.confirm(message)) return;
		this.isSavingSiteMode = true;
		this.adminApi.setSiteMaintenance(nextValue).pipe(finalize(() => { this.isSavingSiteMode = false; this.refreshView(); })).subscribe({
			next: value => { this.siteMaintenance = value.maintenance; this.statusMessage = value.maintenance ? 'تم قفل الموقع أمام الزوار.' : 'تم فتح الموقع أمام الزوار.'; },
			error: err => this.handleApiError(err)
		});
	}

	setView(view: 'overview' | 'leads' | 'customers' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms'): void {
		this.closeActionMenus();
		this.statusMessage = '';
		this.errorMessage = '';
		if (view === 'leads' && !this.auth.canAccessFeature('leads')) return;
		if (view === 'customers' && !this.auth.canAccessFeature('customers')) return;
		if (view === 'wheel' && !this.auth.canAccessFeature('wheel')) return;
		if (view === 'feedback' && !this.auth.canAccessFeature('feedback')) return;
		if (view !== 'cms' && view !== 'leads' && view !== 'wheel' && view !== 'feedback' && this.auth.getRole() !== 'admin') return;
		if (this.activeView === view) {
			this.sidebarOpen = false;
			return;
		}
		this.sidebarOpen = false;
		this.activeView = view;
		this.statusMessage = '';
		this.errorMessage = '';
		if (view !== 'cms') {
			void this.router.navigate(['/admin'], {
				queryParams: { view: view === 'overview' ? null : view },
				replaceUrl: true
			});
		}
		if (view === 'overview') this.loadOverview();
		if (view === 'leads') this.loadLeads();
		if (view === 'customers') this.loadCustomers();
		if (view === 'programs') this.loadPrograms();
		if (view === 'wheel') this.loadWheelClaims();
		if (view === 'feedback') this.loadFeedback();
		if (view === 'admins') this.loadAdminUsers();
	}
	loadAdminUsers(force = false): void {
		if (this.isLoadingAdminUsers || (this.adminUsersLoaded && !force)) return;
		this.isLoadingAdminUsers = true;
		this.adminApi.listAdminUsers().pipe(timeout({ each: 15000 }), finalize(() => { this.isLoadingAdminUsers = false; this.refreshView(); })).subscribe({ next: result => { this.adminUsers = result.data; this.adminUserPermissionDraft = Object.fromEntries(result.data.map(user => [user.username, [...user.permissions]])); this.adminUsersLoaded = true; this.refreshView(); }, error: err => { this.handleApiError(err); this.refreshView(); } });
	}
	createAdminUser(): void {
		const username = this.adminUserDraft.username.trim();
		const password = this.adminUserDraft.password;
		this.adminUserFormError = '';
		if (!/^[a-zA-Z0-9][a-zA-Z0-9._@+-]{2,79}$/.test(username)) { this.adminUserFormError = 'اسم المستخدم يجب أن يبدأ بحرف أو رقم، ومن 3 إلى 80 حرفاً، بدون مسافات.'; return; }
		if (password.length < 10) { this.adminUserFormError = 'كلمة المرور يجب أن تكون 10 أحرف على الأقل.'; return; }
		this.adminApi.createAdminUser({ ...this.adminUserDraft, username }).subscribe({ next: user => { this.adminUsers = [user, ...this.adminUsers]; this.adminUserDraft = { username: '', password: '', permissions: [] }; this.showAdminUserPassword = false; this.isAdminUserCreateOpen = false; this.statusMessage = 'تم إنشاء الحساب بدون تخزين كلمة المرور كنص مكشوف.'; }, error: err => this.handleApiError(err) });
	}
	openAdminUserCreate(): void { this.adminUserDraft = { username: '', password: '', permissions: [] }; this.adminUserFormError = ''; this.showAdminUserPassword = false; this.isAdminUserCreateOpen = true; this.refreshView(); }
	closeAdminUserCreate(): void { this.isAdminUserCreateOpen = false; this.adminUserDraft = { username: '', password: '', permissions: [] }; this.adminUserFormError = ''; this.showAdminUserPassword = false; this.refreshView(); }
	toggleAdminPermission(target: string[] | null, pageKey: string): void { if (!target) return; const index = target.indexOf(pageKey); if (index >= 0) target.splice(index, 1); else target.push(pageKey); }
	setAdminPassword(user: AdminUser): void {
		const password = this.adminUserPasswordDraft[user.username] || '';
		if (!password) { this.errorMessage = 'اكتب كلمة المرور الجديدة أولاً.'; return; }
		this.adminApi.updateAdminUser(user.username, { password }).subscribe({ next: () => { this.adminUserPasswordDraft[user.username] = ''; this.statusMessage = 'تم تغيير كلمة المرور.'; }, error: err => this.handleApiError(err) });
	}
	openAdminPermissionModal(user: AdminUser): void { this.adminPermissionModalUser = user; this.adminUserPermissionDraft[user.username] = [...user.permissions]; this.adminPermissionEdit[user.username] = true; this.openAdminActionUser = null; }
	closeAdminPermissionModal(): void { if (this.adminPermissionModalUser) this.cancelAdminPermissionEdit(this.adminPermissionModalUser); this.adminPermissionModalUser = null; }
	openAdminPasswordModal(user: AdminUser): void { this.adminPasswordModalUser = user; this.adminPasswordModalDraft = ''; this.adminPasswordModalVisible = false; this.openAdminActionUser = null; }
	closeAdminPasswordModal(): void { this.adminPasswordModalUser = null; this.adminPasswordModalDraft = ''; this.adminPasswordModalVisible = false; }
	saveAdminPasswordModal(): void {
		if (!this.adminPasswordModalUser) return;
		const user = this.adminPasswordModalUser;
		const password = this.adminPasswordModalDraft.trim();
		if (!password) { this.errorMessage = 'اكتب كلمة المرور الجديدة أولاً.'; return; }
		if (password.length < 10) { this.errorMessage = 'كلمة المرور يجب أن تكون 10 أحرف على الأقل.'; return; }
		this.adminApi.updateAdminUser(user.username, { password }).subscribe({ next: () => { this.statusMessage = 'تم تغيير كلمة المرور.'; this.errorMessage = ''; this.closeAdminPasswordModal(); }, error: err => this.handleApiError(err) });
	}
	saveAdminPermissions(user: AdminUser): void {
		this.adminApi.updateAdminUser(user.username, { permissions: this.adminUserPermissionDraft[user.username] || user.permissions }).subscribe({ next: updated => { user.permissions = updated.permissions; this.adminPermissionEdit[user.username] = false; this.statusMessage = 'تم تحديث الصفحات المسموحة.'; this.closeAdminPermissionModal(); }, error: err => this.handleApiError(err) });
	}
	toggleAdminPermissionEdit(username: string): void { this.adminPermissionEdit[username] = !this.adminPermissionEdit[username]; }
	cancelAdminPermissionEdit(user: AdminUser): void { this.adminUserPermissionDraft[user.username] = [...user.permissions]; this.adminPermissionEdit[user.username] = false; }
	getAdminPermissionLabels(user: AdminUser): string[] {
		const keys = this.adminUserPermissionDraft[user.username] || user.permissions;
		return [...this.adminFeatureOptions.map(item => ({ key: item.key, title: item.title })), ...this.adminPageOptions.map(item => ({ key: item.key, title: item.title }))].filter(item => keys.includes(item.key)).map(item => item.title);
	}
	removeAdminUser(user: AdminUser): void {
		if (!window.confirm(`حذف حساب ${user.username}؟`)) return;
		this.adminApi.deleteAdminUser(user.username).subscribe({ next: () => { this.adminUsers = this.adminUsers.filter(item => item.username !== user.username); this.statusMessage = 'تم حذف الحساب.'; }, error: err => this.handleApiError(err) });
	}
	toggleAdminActionMenu(username: string, event?: MouseEvent): void {
		const shouldOpen = this.openAdminActionUser !== username;
		this.openAdminActionUser = shouldOpen ? username : null;
		if (!shouldOpen) return;
		const trigger = event?.currentTarget as HTMLElement | null;
		if (!trigger) return;
		const adminIndex = this.adminUsers.findIndex(user => user.username === username);
		this.positionActionMenu(trigger, '--admin-actions-top', '--admin-actions-left', 170, 145, '.admin-actions-popover', () => this.findActionTrigger(adminIndex));
	}
	@HostListener('document:click', ['$event'])
	closeActionMenusOnOutsideClick(event: MouseEvent): void {
		const target = event.target as HTMLElement | null;
		if (target?.closest('.lead-actions-menu__trigger, .lead-actions-menu__panel, .admin-actions-popover, .school-actions-trigger, .school-actions-popover, .customer-actions-menu')) return;
		this.closeActionMenus();
	}
	@HostListener('window:scroll')
	@HostListener('document:scroll')
	@HostListener('document:wheel')
	@HostListener('document:touchmove')
	@HostListener('window:resize')
	closeActionMenusOnViewportMove(): void {
		this.closeActionMenus();
	}
	private closeActionMenus(): void {
		if (this.openLeadActionMenuId === null && this.openWheelActionMenuId === null && this.openAdminActionUser === null && this.openCustomerActionMenuId === null) return;
		this.openLeadActionMenuId = null;
		this.openWheelActionMenuId = null;
		this.openAdminActionUser = null;
		this.openCustomerActionMenuId = null;
		this.refreshView();
	}
	loadFeedback(force = false): void {
		if ((this.isLoadingFeedback && !force) || (this.feedbackLoaded && !force)) return;
		this.isLoadingFeedback = true;
		this.statusMessage = '';
		this.errorMessage = '';
		this.adminApi.listFeedback(this.feedbackSearch.trim(), this.feedbackStatus, this.feedbackPage, 20).pipe(
			timeout({ each: 15000 }),
			finalize(() => { this.isLoadingFeedback = false; this.refreshView(); })
		).subscribe({
			next: result => { this.feedbacks = result.data; this.feedbackTotal = result.pagination.total; this.feedbackPages = result.pagination.pages || 1; this.feedbackPageNumbers = this.buildPaginationItems(this.feedbackPage, this.feedbackPages); this.feedbackLoaded = true; this.statusMessage = 'تم تحديث الآراء بنجاح.'; this.refreshView(); },
			error: err => { this.handleApiError(err); this.refreshView(); }
	});
	}
	searchFeedback(): void { this.feedbackPage = 1; this.loadFeedback(true); }
	goToFeedbackPage(page: number | string): void { if (typeof page !== 'number') return; const nextPage = Math.min(Math.max(Math.trunc(page) || 1, 1), this.feedbackPages); if (nextPage === this.feedbackPage && this.feedbackLoaded) return; this.feedbackPage = nextPage; this.loadFeedback(true); }
	buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const items: PaginationItem[] = [1];
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		if (start > 2) items.push('…');
		for (let page = start; page <= end; page++) items.push(page);
		if (end < totalPages - 1) items.push('…');
		items.push(totalPages);
		return items;
	}
	updateFeedbackStatus(feedback: Feedback, status: Feedback['status']): void {
		this.adminApi.updateFeedback(feedback.id, status).subscribe({ next: updated => { feedback.status = updated.status; this.statusMessage = 'تم تحديث حالة الرأي.'; }, error: err => this.handleApiError(err) });
	}
	feedbackPreview(message: string): string {
		return (message || '').trim().split(/\s+/).filter(Boolean).slice(0, 10).join(' ');
	}
	isLongFeedback(message: string): boolean {
		return (message || '').trim().split(/\s+/).filter(Boolean).length > 10;
	}
	isFeedbackExpanded(id: string): boolean {
		return this.expandedFeedbackIds.has(id);
	}
	toggleFeedbackMessage(id: string): void {
		if (this.expandedFeedbackIds.has(id)) this.expandedFeedbackIds.delete(id);
		else this.expandedFeedbackIds.add(id);
	}
	formatFeedbackStatus(status?: string): string { return this.feedbackStatusLabels[status || ''] || status || 'غير محدد'; }

	loadOverview(force = false): void {
		if ((this.isLoadingOverview && !force) || (this.overviewLoaded && !force)) return;
		const requestId = ++this.overviewRequestId;
		this.isLoadingOverview = true;
		this.adminApi.getSummary().pipe(timeout({ each: 15000 }), finalize(() => { if (requestId === this.overviewRequestId) this.isLoadingOverview = false; this.refreshView(); })).subscribe({
			next: value => {
				if (requestId !== this.overviewRequestId) return;
				this.dashboard = value;
				this.overviewLoaded = true;
				this.leadProgramOptions = Array.from(new Set([...this.defaultLeadProgramOptions, ...Object.keys(value.byProgram || {})])).sort((a, b) => a.localeCompare(b, 'ar'));
				this.refreshView();
			},
			error: err => { if (requestId === this.overviewRequestId) this.handleApiError(err); this.refreshView(); }
		});
	}
	loadLeads(force = false): void {
		if ((this.isLoadingLeads && !force) || (this.leadsLoaded && !force)) return;
		const requestId = ++this.leadsRequestId;
		this.isLoadingLeads = true;
		this.statusMessage = '';
		this.errorMessage = '';
		this.adminApi.listLeads(this.leadSearch.trim(), this.leadStatus, this.leadSource, this.leadProgram, this.leadDateFrom, this.leadDateTo, this.leadsPage, 10, this.leadPlatform.trim(), this.leadCampaign.trim()).pipe(timeout({ each: 15000 }), finalize(() => { if (requestId === this.leadsRequestId) this.isLoadingLeads = false; this.refreshView(); })).subscribe({
			next: result => {
				if (requestId !== this.leadsRequestId) return;
				this.leads = result.data;
				this.leadsPages = result.pagination.pages || 1;
				this.leadPageNumbers = this.buildPaginationItems(this.leadsPage, this.leadsPages);
				this.leadsTotal = result.pagination.total;
				this.leadsLoaded = true;
				this.isLoadingLeads = false;
				this.statusMessage = 'تم تحديث بيانات الليدز بنجاح.';
				this.errorMessage = '';
				this.refreshView();
			},
			error: err => {
				if (requestId !== this.leadsRequestId) return;
				this.isLoadingLeads = false;
				this.handleApiError(err);
				this.refreshView();
			}
		});
	}
	loadCustomers(force = false): void {
		if ((this.isLoadingCustomers && !force) || (this.customersLoaded && !force)) return;
		this.isLoadingCustomers = true; this.adminApi.listCustomers(this.customerSearch.trim(), this.customerStatus, this.customersPage, 20).pipe(timeout({ each: 15000 }), finalize(() => { this.isLoadingCustomers = false; this.refreshView(); })).subscribe({
			next: result => { this.customers = result.data; this.customersTotal = result.pagination.total; this.customersPages = result.pagination.pages || 1; this.customersLoaded = true; this.statusMessage = 'تم تحديث بيانات العملاء.'; this.refreshView(); },
			error: err => this.handleApiError(err)
		});
	}
	searchCustomers(): void { this.customersPage = 1; this.loadCustomers(true); }
	changeCustomerPage(page: number): void { this.customersPage = Math.min(Math.max(page, 1), this.customersPages); this.loadCustomers(true); }
	formatCustomerStatus(status: string): string { return this.leadStatusLabels[status] || status || 'غير محدد'; }
	openCustomerImportInstructions(): void { this.customerImportInstructionsOpen = true; this.refreshView(); }
	closeCustomerImportInstructions(): void { this.customerImportInstructionsOpen = false; }
	importCustomers(event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return;
		this.adminApi.previewCustomers(file).subscribe({ next: result => { this.customerImportPreview = result; this.errorMessage = ''; }, error: err => this.handleApiError(err) });
		(event.target as HTMLInputElement).value = '';
	}
	confirmCustomerImport(): void { if (!this.customerImportPreview) return; const importId = this.customerImportPreview.importId; this.adminApi.confirmCustomers(importId).subscribe({ next: result => { this.customerImportPreview = null; this.statusMessage = `تمت الإضافة: ${result.added}، المتكرر: ${result.duplicate}.`; this.customersLoaded = false; this.loadCustomers(true); }, error: err => this.handleApiError(err) }); }
	cancelCustomerImport(): void { this.customerImportPreview = null; }
	downloadCustomersExcel(): void { this.adminApi.exportCustomers({ search: this.customerSearch.trim(), status: this.customerStatus }).subscribe({ next: blob => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'customers.csv'; anchor.click(); URL.revokeObjectURL(url); this.statusMessage = 'تم تصدير العملاء.'; }, error: err => this.handleApiError(err) }); }
	updateCustomerStatus(customer: Customer, status: string): void { const previous = customer.status; customer.status = status; this.adminApi.updateCustomer(customer.id, { status }).subscribe({ next: updated => customer.status = updated.status, error: err => { customer.status = previous; this.handleApiError(err); } }); }
	deleteCustomer(customer: Customer): void { this.openCustomerActionMenuId = null; this.customerPendingDeletion = customer; this.refreshView(); }
	openCustomerView(customer: Customer): void { this.openCustomerActionMenuId = null; this.customerPendingView = customer; this.refreshView(); }
	openCustomerEdit(customer: Customer): void { this.openCustomerActionMenuId = null; this.customerPendingEdit = customer; this.customerEditName = customer.name || ''; this.customerEditPhone = customer.phone || ''; this.errorMessage = ''; this.refreshView(); }
	closeCustomerEdit(): void { this.customerPendingEdit = null; this.customerEditName = ''; this.customerEditPhone = ''; this.refreshView(); }
	saveCustomerEdit(): void { const customer = this.customerPendingEdit; const name = this.customerEditName.trim(); const phone = this.customerEditPhone.trim(); if (!customer || this.isSavingCustomerEdit) return; if (!/^\d{10,15}$/.test(phone)) { this.errorMessage = 'اكتب رقم هاتف صحيح من 10 إلى 15 رقمًا.'; return; } this.isSavingCustomerEdit = true; this.adminApi.updateCustomer(customer.id, { name, phone }).pipe(finalize(() => { this.isSavingCustomerEdit = false; this.refreshView(); })).subscribe({ next: updated => { Object.assign(customer, updated); this.statusMessage = 'تم تحديث بيانات العميل.'; this.errorMessage = ''; this.closeCustomerEdit(); }, error: err => this.handleApiError(err) }); }
	closeCustomerView(): void { this.customerPendingView = null; this.refreshView(); }
	openCustomerNote(customer: Customer): void { this.openCustomerActionMenuId = null; this.customerPendingNote = customer; this.customerNoteDraft = customer.notes || ''; this.refreshView(); }
	closeCustomerNote(): void { this.customerPendingNote = null; this.customerNoteDraft = ''; this.refreshView(); }
	openCustomerReadNote(customer: Customer): void { this.openCustomerActionMenuId = null; this.customerPendingReadNote = customer; this.refreshView(); }
	closeCustomerReadNote(): void { this.customerPendingReadNote = null; this.refreshView(); }
	editCustomerNoteFromView(): void { const customer = this.customerPendingView; this.closeCustomerView(); if (customer) this.openCustomerNote(customer); }
	editCustomerNoteFromReadView(): void { const customer = this.customerPendingReadNote; this.closeCustomerReadNote(); if (customer) this.openCustomerNote(customer); }
	closeCustomerDialogs(): void { this.closeCustomerView(); this.closeCustomerNote(); this.closeCustomerReadNote(); }
	saveCustomerNote(): void { const customer = this.customerPendingNote; if (!customer || this.isSavingCustomerNote) return; this.isSavingCustomerNote = true; this.adminApi.updateCustomer(customer.id, { notes: this.customerNoteDraft.trim() }).pipe(finalize(() => { this.isSavingCustomerNote = false; this.refreshView(); })).subscribe({ next: updated => { customer.notes = updated.notes || ''; this.statusMessage = 'تم حفظ ملاحظة العميل.'; this.errorMessage = ''; this.closeCustomerNote(); }, error: err => this.handleApiError(err) }); }
	openCustomerActionMenu(customer: Customer, event?: MouseEvent): void { const shouldOpen = this.openCustomerActionMenuId !== customer.id; this.openCustomerActionMenuId = shouldOpen ? customer.id : null; const customerIndex = this.customers.indexOf(customer); if (shouldOpen) this.positionActionMenu(event?.currentTarget as HTMLElement | null, '--customer-actions-top', '--customer-actions-left', 140, 125, '.lead-actions-menu__panel--customer', () => this.findCustomerActionTrigger(customerIndex)); this.refreshView(); }
	private findCustomerActionTrigger(index: number): HTMLElement | null { if (index < 0) return null; return document.querySelectorAll<HTMLElement>('.customer-actions-menu .lead-actions-menu__trigger').item(index) || null; }
	closeCustomerActionMenu(): void { this.openCustomerActionMenuId = null; this.refreshView(); }
	closeDeleteCustomerDialog(): void { this.customerPendingDeletion = null; this.refreshView(); }
	confirmDeleteCustomer(): void { const customer = this.customerPendingDeletion; if (!customer) return; this.customerPendingDeletion = null; this.adminApi.deleteCustomer(customer.id).subscribe({ next: () => { this.customers = this.customers.filter(item => item.id !== customer.id); this.customersTotal = Math.max(0, this.customersTotal - 1); this.statusMessage = 'تم حذف العميل نهائيًا.'; this.errorMessage = ''; this.refreshView(); }, error: err => this.handleApiError(err) }); }
	searchLeads(): void { this.leadsPage = 1; this.loadLeads(true); }
	clearLeadFilters(): void { this.leadSearch = ''; this.leadSource = ''; this.leadPlatform = ''; this.leadCampaign = ''; this.leadStatus = ''; this.leadProgram = ''; this.leadDateFrom = ''; this.leadDateTo = ''; this.leads = []; this.leadsTotal = 0; this.searchLeads(); }
	downloadLeadsExcel(): void {
		if (this.leadDateFrom && this.leadDateTo && this.leadDateFrom > this.leadDateTo) { this.errorMessage = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'; return; }
		this.adminApi.exportLeads({ search: this.leadSearch.trim(), status: this.leadStatus, source: this.leadSource, platform: this.leadPlatform.trim(), campaign: this.leadCampaign.trim(), program: this.leadProgram, from: this.leadDateFrom, to: this.leadDateTo }).subscribe({
			next: blob => {
				const url = URL.createObjectURL(blob);
				const anchor = document.createElement('a');
				anchor.href = url;
				anchor.download = `leads-${this.leadDateFrom || 'all'}-${this.leadDateTo || 'all'}.csv`;
				anchor.click();
				URL.revokeObjectURL(url);
				this.statusMessage = 'تم تصدير النتائج المطابقة للفلاتر.';
			},
			error: err => this.handleApiError(err)
		});
	}
	changeLeadPage(delta: number): void { this.goToLeadPage(this.leadsPage + delta); }
	goToLeadPage(page: number | string): void {
		if (typeof page !== 'number') return;
		const nextPage = Math.min(Math.max(Math.trunc(page) || 1, 1), this.leadsPages);
		if (nextPage === this.leadsPage && this.leadsLoaded) return;
		this.leadsPage = nextPage;
		this.loadLeads(true);
	}
	updateLeadStatus(lead: Lead, status: string): void {
		const previousStatus = lead.status;
		if (!this.leadStatuses.includes(status) || status === previousStatus) return;
		lead.status = status;
		this.statusMessage = '';
		this.errorMessage = '';
		this.adminApi.updateLead(lead.id, { status }).subscribe({
			next: updated => { lead.status = updated.status; this.statusMessage = 'تم تحديث حالة العميل.'; this.refreshView(); },
			error: err => { lead.status = previousStatus; this.handleApiError(err); this.refreshView(); }
		});
	}
	deleteLead(lead: Lead): void {
		this.openLeadActionMenuId = null;
		this.leadPendingDeletion = lead;
		this.refreshView();
	}
	openLeadNote(lead: Lead): void {
		this.openLeadActionMenuId = null;
		this.leadPendingNote = lead;
		this.leadNoteDraft = lead.notes || '';
		this.refreshView();
	}
	closeLeadNote(): void {
		this.leadPendingNote = null;
		this.leadNoteDraft = '';
		this.refreshView();
	}
	openLeadReadNote(lead: Lead): void { this.openLeadActionMenuId = null; this.leadPendingReadNote = lead; this.refreshView(); }
	closeLeadReadNote(): void { this.leadPendingReadNote = null; this.refreshView(); }
	openLeadView(lead: Lead): void { this.openLeadActionMenuId = null; this.leadPendingView = lead; this.refreshView(); }
	closeLeadView(): void { this.leadPendingView = null; this.refreshView(); }
	toggleLeadActionMenu(lead: Lead, event?: MouseEvent): void {
		const shouldOpen = this.openLeadActionMenuId !== lead.id;
		this.openLeadActionMenuId = shouldOpen ? lead.id : null;
		const leadIndex = this.leads.indexOf(lead);
		if (shouldOpen) this.positionActionMenu(event?.currentTarget as HTMLElement | null, '--lead-actions-top', '--lead-actions-left', 140, 125, '.lead-actions-menu__panel--global', () => this.findActionTrigger(leadIndex));
		this.refreshView();
	}
	toggleWheelActionMenu(claim: WheelClaim, event?: MouseEvent): void {
		const shouldOpen = this.openWheelActionMenuId !== claim.token;
		this.openWheelActionMenuId = shouldOpen ? claim.token : null;
		const claimIndex = this.wheelClaims.indexOf(claim);
		if (shouldOpen) this.positionActionMenu(event?.currentTarget as HTMLElement | null, '--wheel-actions-top', '--wheel-actions-left', 140, 125, '.lead-actions-menu__panel--global', () => this.findActionTrigger(claimIndex));
		this.refreshView();
	}
	private findActionTrigger(index: number): HTMLElement | null {
		if (index < 0) return null;
		return document.querySelectorAll<HTMLElement>('.lead-actions-menu__trigger').item(index) || null;
	}
	private positionActionMenu(trigger: HTMLElement | null, topVariable: string, leftVariable: string, preferredWidth: number, preferredHeight: number, menuSelector: string, findCurrentTrigger?: () => HTMLElement | null): void {
		if (!trigger) return;
		const triggerRectAtClick = trigger.getBoundingClientRect();
		const applyPosition = (): void => {
			const currentTrigger = findCurrentTrigger?.() || (trigger.isConnected ? trigger : null);
			const rect = currentTrigger?.getBoundingClientRect() || triggerRectAtClick;
			const visualViewport = window.visualViewport;
			const viewportWidth = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
			const viewportHeight = visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
			const edge = 10;
			const renderedMenu = document.querySelector(menuSelector) as HTMLElement | null;
			// Mobile browsers clip fixed descendants of the scrolling admin shell.
			// Move the open menu to the document viewport so its coordinates remain
			// tied to the clicked row instead of the shell/filter card.
			if (renderedMenu && renderedMenu.parentElement !== document.body) document.body.appendChild(renderedMenu);
			const renderedRect = renderedMenu?.getBoundingClientRect();
			const menuWidth = Math.min(renderedRect?.width || preferredWidth, Math.max(112, viewportWidth - edge * 2));
			const menuHeight = Math.min(renderedRect?.height || preferredHeight, Math.max(96, viewportHeight - edge * 2));
			// Start at the same vertical level as the row/date cell, then clamp
			// only when the row is too close to a viewport edge.
			const rawTop = rect.top;
			const rawLeft = rect.right + menuWidth + edge <= viewportWidth
				? rect.right + 6
				: rect.left - menuWidth - 6;
			const top = Math.min(Math.max(edge, rawTop), Math.max(edge, viewportHeight - menuHeight - edge));
			const left = Math.min(Math.max(edge, rawLeft), Math.max(edge, viewportWidth - menuWidth - edge));
			document.documentElement.style.setProperty(topVariable, `${top}px`);
			document.documentElement.style.setProperty(leftVariable, `${left}px`);
		};
		applyPosition();
		requestAnimationFrame(applyPosition);
		setTimeout(applyPosition, 0);
	}
	openWheelNote(claim: WheelClaim): void { this.openWheelActionMenuId = null; this.wheelPendingNote = claim; this.wheelNoteDraft = claim.notes || ''; this.refreshView(); }
	closeWheelNote(): void { this.wheelPendingNote = null; this.refreshView(); }
	openWheelReadNote(claim: WheelClaim): void { this.openWheelActionMenuId = null; this.wheelPendingReadNote = claim; this.refreshView(); }
	closeWheelReadNote(): void { this.wheelPendingReadNote = null; this.refreshView(); }
	editWheelNoteFromReadView(): void { const claim = this.wheelPendingReadNote; this.closeWheelReadNote(); if (claim) this.openWheelNote(claim); }
	openWheelView(claim: WheelClaim): void { this.openWheelActionMenuId = null; this.wheelPendingView = claim; this.refreshView(); }
	closeWheelView(): void { this.wheelPendingView = null; this.refreshView(); }
	editWheelNoteFromView(): void { const claim = this.wheelPendingView; this.closeWheelView(); if (claim) this.openWheelNote(claim); }
	saveWheelNote(): void {
		const claim = this.wheelPendingNote;
		if (!claim || this.isSavingWheelNote) return;
		this.isSavingWheelNote = true;
		this.adminApi.updateWheelClaim(claim.token, { notes: this.wheelNoteDraft.trim() }).pipe(finalize(() => { this.isSavingWheelNote = false; this.refreshView(); })).subscribe({
			next: updated => { Object.assign(claim, updated); this.statusMessage = 'تم حفظ ملاحظة نتيجة العجلة.'; this.errorMessage = ''; this.closeWheelNote(); this.refreshView(); },
			error: err => { this.handleApiError(err); this.refreshView(); }
		});
	}
	closeLeadActionMenu(): void { this.openLeadActionMenuId = null; this.refreshView(); }
	editLeadNoteFromView(): void { const lead = this.leadPendingView; this.closeLeadView(); if (lead) this.openLeadNote(lead); }
	editLeadNoteFromReadView(): void { const lead = this.leadPendingReadNote; this.closeLeadReadNote(); if (lead) this.openLeadNote(lead); }
	saveLeadNote(): void {
		const lead = this.leadPendingNote;
		if (!lead || this.isSavingLeadNote) return;
		const notes = this.leadNoteDraft.trim();
		this.isSavingLeadNote = true;
		this.adminApi.updateLead(lead.id, { notes }).pipe(finalize(() => { this.isSavingLeadNote = false; this.refreshView(); })).subscribe({
			next: updated => {
				lead.notes = updated.notes || '';
				this.statusMessage = 'تم حفظ ملاحظة العميل.';
				this.errorMessage = '';
				this.closeLeadNote();
				this.refreshView();
			},
			error: err => { this.handleApiError(err); this.refreshView(); }
		});
	}
	closeDeleteLeadDialog(): void {
		this.leadPendingDeletion = null;
		this.refreshView();
	}
	confirmDeleteLead(): void {
		const lead = this.leadPendingDeletion;
		if (!lead) return;
		this.leadPendingDeletion = null;
		this.adminApi.deleteLead(lead.id).subscribe({
			next: () => {
				this.leads = this.leads.filter(item => item.id !== lead.id);
				this.leadsTotal = Math.max(0, this.leadsTotal - 1);
				this.statusMessage = 'تم حذف التسجيل نهائيًا.';
				this.errorMessage = '';
				this.refreshView();
			},
			error: err => this.handleApiError(err)
		});
	}
	deleteWheelClaim(claim: WheelClaim): void {
		this.wheelPendingDeletion = claim;
		this.refreshView();
	}
	closeDeleteWheelDialog(): void {
		this.wheelPendingDeletion = null;
		this.refreshView();
	}
	confirmDeleteWheelClaim(): void {
		const claim = this.wheelPendingDeletion;
		if (!claim) return;
		this.wheelPendingDeletion = null;
		this.adminApi.deleteWheelClaim(claim.token).subscribe({
			next: () => {
				this.wheelClaims = this.wheelClaims.filter(item => item.token !== claim.token);
				this.statusMessage = 'تم حذف نتيجة العجلة نهائيًا.';
				this.errorMessage = '';
				this.refreshView();
			},
			error: err => this.handleApiError(err)
		});
	}
	async copyLeadWhatsapp(whatsapp: string): Promise<void> {
		if (!whatsapp) return;
		this.copiedLeadWhatsapp = whatsapp;
		this.errorMessage = '';
		this.changeDetector.detectChanges();
		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(whatsapp);
			} else {
				const input = document.createElement('textarea');
				input.value = whatsapp;
				input.style.position = 'fixed';
				input.style.opacity = '0';
				document.body.appendChild(input);
				input.focus();
				input.select();
				document.execCommand('copy');
				input.remove();
			}
			window.setTimeout(() => { if (this.copiedLeadWhatsapp === whatsapp) this.copiedLeadWhatsapp = ''; }, 1600);
		} catch {
			this.copiedLeadWhatsapp = '';
			this.errorMessage = 'تعذر نسخ الرقم، حاول مرة أخرى.';
		}
	}
	loadPrograms(force = false): void { if (this.isLoadingPrograms || (this.programsLoaded && !force)) return; this.isLoadingPrograms = true; this.adminApi.listPrograms().pipe(timeout({ each: 15000 }), finalize(() => { this.isLoadingPrograms = false; this.refreshView(); })).subscribe({ next: result => { this.programs = result.data; this.programsLoaded = true; this.refreshView(); }, error: err => { this.handleApiError(err); this.refreshView(); } }); }
	editProgram(program: Program): void { this.editingProgramId = program.id; this.programDraft = { ...program, features: [...(program.features || [])] }; }
	newProgram(): void { this.editingProgramId = null; this.programDraft = { name: '', slug: '', category: '', language: 'ar', price: 0, enrollmentStatus: 'open', isActive: true }; }
	saveProgram(): void {
		const request = this.editingProgramId ? this.adminApi.updateProgram(this.editingProgramId, this.programDraft) : this.adminApi.createProgram(this.programDraft);
		request.subscribe({ next: () => { this.statusMessage = 'تم حفظ البرنامج.'; this.loadPrograms(true); this.newProgram(); }, error: err => this.handleApiError(err) });
	}
	loadWheelClaims(force = false): void {
		if (this.isLoadingWheelClaims || (this.wheelClaimsLoaded && !force)) return;
		this.isLoadingWheelClaims = true;
		this.adminApi.listWheelClaims({ search: this.wheelSearch.trim(), gift: this.wheelGift, program: this.wheelProgram, from: this.wheelDateFrom, to: this.wheelDateTo, page: this.wheelPage, limit: 20 }).pipe(timeout({ each: 15000 }), finalize(() => { this.isLoadingWheelClaims = false; this.refreshView(); })).subscribe({
			next: result => { this.wheelClaims = result.data; this.wheelTotal = result.pagination?.total ?? result.total; this.wheelPages = result.pagination?.pages || 1; this.wheelPageNumbers = this.buildPaginationItems(this.wheelPage, this.wheelPages); this.wheelClaimsLoaded = true; this.statusMessage = 'تم تحديث نتائج العجلة بنجاح.'; this.errorMessage = ''; this.refreshView(); },
			error: err => { this.handleApiError(err); this.refreshView(); }
		});
	}
	searchWheelClaims(): void { this.wheelPage = 1; this.loadWheelClaims(true); }
	goToWheelPage(page: number | string): void { if (typeof page !== 'number') return; const nextPage = Math.min(Math.max(Math.trunc(page) || 1, 1), this.wheelPages); if (nextPage === this.wheelPage && this.wheelClaimsLoaded) return; this.wheelPage = nextPage; this.loadWheelClaims(true); }
	clearWheelFilters(): void { this.wheelSearch = ''; this.wheelGift = ''; this.wheelProgram = ''; this.wheelDateFrom = ''; this.wheelDateTo = ''; this.searchWheelClaims(); }
	toggleWheelFilters(): void { this.wheelFiltersOpen = !this.wheelFiltersOpen; }
	toggleLeadsFilters(): void { this.leadsFiltersOpen = !this.leadsFiltersOpen; }
	exportWheelClaims(): void {
		if (this.wheelDateFrom && this.wheelDateTo && this.wheelDateFrom > this.wheelDateTo) { this.errorMessage = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'; return; }
		this.adminApi.exportWheelClaims({ search: this.wheelSearch.trim(), gift: this.wheelGift, program: this.wheelProgram, from: this.wheelDateFrom, to: this.wheelDateTo }).subscribe({
			next: blob => { const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `wheel-claims-${this.wheelDateFrom || 'all'}-${this.wheelDateTo || 'all'}.csv`; anchor.click(); URL.revokeObjectURL(url); this.statusMessage = 'تم تصدير نتائج العجلة المطابقة للفلاتر.'; },
			error: err => this.handleApiError(err)
		});
	}

	private handleApiError(err: HttpErrorResponse): void {
		if (err.status === 401) { this.handleSessionExpired(); return; }
		this.statusMessage = '';
		this.errorMessage = err.error?.message || 'تعذر تحميل البيانات من السيرفر.';
	}

	selectPage(pageKey: CmsPageKey): void {
		this.sidebarOpen = false;
		const currentRoutePageKey = this.route.snapshot.paramMap.get('pageKey');
		const currentQueryView = this.route.snapshot.queryParamMap.get('view');
		// Keep the URL in sync even when the selected page is already the
		// component's default. Without this, selecting the first CMS page from
		// /admin only changed the view in memory; a refresh then returned to the
		// default data view instead of the page the user was editing.
		if (pageKey === this.selectedPageKey && currentRoutePageKey === pageKey && !currentQueryView) {
			this.activeView = 'cms';
			return;
		}
		this.activeView = 'cms';
		this.selectedPageKey = pageKey;
		this.loadPage(pageKey);
		this.pendingCmsNavigation = true;
		void this.router.navigate(['/admin', pageKey], { queryParams: {}, replaceUrl: true });
	}

	toggleSidebar(): void {
		this.sidebarOpen = !this.sidebarOpen;
	}
	toggleSidebarControl(): void {
		if (window.innerWidth <= 1100) {
			this.toggleSidebar();
			return;
		}
		this.toggleDesktopSidebar();
	}
	toggleDesktopSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; this.refreshView(); }

	loadPage(pageKey: CmsPageKey): void {
		const requestId = ++this.pageLoadRequestId;
		this.statusMessage = '';
		this.errorMessage = '';
		this.isLoading = true;
		this.currentContent = null;

		const schoolsFallback = pageKey === 'schools'
			? { visible: true, title: 'المدارس والمعاهد', items: DEFAULT_SCHOOLS.map((item, index) => ({ ...item, id: item.id ?? index + 1 })) }
			: undefined;
		this.contentService.loadPageState(pageKey, schoolsFallback as any, { emitFallback: pageKey === 'schools' }).pipe(timeout({ each: 15000 }), finalize(() => {
			if (requestId === this.pageLoadRequestId) this.isLoading = false;
			this.refreshView();
		})).subscribe({
				next: content => {
					if (requestId !== this.pageLoadRequestId) return;
					this.currentContent = content;
					this.refreshView();
			},
			error: () => {
				this.errorMessage = 'لا يوجد محتوى محفوظ لهذه الصفحة أو تعذر تحميله من السيرفر.';
				this.refreshView();
			}
		});
	}

	refreshSummaries(): void {
		this.contentService.listPages().subscribe({
			next: summaries => {
				this.pageSummaries = summaries.reduce<Record<string, { hasContent: boolean; updatedAt?: string }>>((acc, item) => {
					acc[item.key] = { hasContent: item.hasContent, updatedAt: item.updatedAt };
					return acc;
				}, {});
			},
			error: () => { this.pageSummaries = {}; }
		});
	}

	save(): void {
		if (!this.currentContent || this.isLoading || this.isSaving) return;
		this.errorMessage = '';
		this.statusMessage = '';
		this.isSaving = true;

		this.contentService.savePageState(this.selectedPageKey, this.currentContent).pipe(finalize(() => {
			this.isSaving = false;
			this.refreshView();
		})).subscribe({
			next: saved => {
					this.currentContent = saved;
					this.statusMessage = 'تم الحفظ على السيرفر بنجاح ✓';
				this.refreshSummaries();
			},
			error: (err: HttpErrorResponse) => {
				if (err.status === 401) {
					this.handleSessionExpired();
					return;
				}
				const errorName = (err as unknown as { name?: string }).name;
				this.errorMessage = err.error?.message || (errorName === 'TimeoutError' ? 'انتهت مهلة الحفظ. تأكد من اتصال السيرفر.' : 'فشل حفظ التعديلات على السيرفر.');
			}
		});
	}

	private handleSessionExpired(): void {
		this.auth.logout();
		this.errorMessage = 'انتهت الجلسة. جاري التحويل لتسجيل الدخول...';
		setTimeout(() => void this.router.navigateByUrl('/admin/login'), 1500);
	}

	logout(): void {
		this.auth.logout();
		void this.router.navigateByUrl('/admin/login');
	}

	formatUpdatedAt(value?: string): string {
		if (!value) return 'لم يتم الحفظ بعد';
		return new Date(value).toLocaleString('ar-EG');
	}

	formatLeadStatus(status?: string): string {
		return this.leadStatusLabels[status || ''] || status || 'غير محدد';
	}

	formatLeadSource(source?: string): string {
		return source === 'عجلة الحظ' ? 'العجلة' : source || 'غير محدد';
	}

	formatAttributionPlatform(platform?: string): string { return platform || 'غير محددة'; }

	openPreview(): void {
		const route = this.selectedPageRoute || '/';
		window.open(route, '_blank', 'noopener,noreferrer');
	}

	isSelected(pageKey: CmsPageKey): boolean {
		return this.selectedPageKey === pageKey;
	}

	getCurrentSummary(): { hasContent: boolean; updatedAt?: string } | null {
		return this.pageSummaries[this.selectedPageKey] || null;
	}

	get selectedPageTitle(): string {
		return this.pageOptions.find(page => page.key === this.selectedPageKey)?.title || '';
	}

	get selectedPageRoute(): string {
		return this.pageOptions.find(page => page.key === this.selectedPageKey)?.route || '';
	}

	get hasCustomForm(): boolean {
		return ['home', 'faq', 'contact', 'subscription-details', 'subscription-engineering-ar', 'subscription-engineering-en', 'subscription-computers-ar', 'subscription-computers-en', 'news-app', 'news-equation', 'launch-offer'].includes(this.selectedPageKey);
	}

	get groupedPageOptions(): Array<{ group: string; pages: PageOption[] }> {
		const visiblePages = this.auth.isLeadsOnly() ? this.pageOptions.filter(page => page.key === 'batch-2027') : this.pageOptions;
		return visiblePages.reduce<Array<{ group: string; pages: PageOption[] }>>((groups, page) => {
			const existingGroup = groups.find(item => item.group === page.group);
			if (existingGroup) { existingGroup.pages.push(page); return groups; }
			groups.push({ group: page.group, pages: [page] });
			return groups;
		}, []);
	}

	private resolvePageKey(value: string | null): CmsPageKey {
		if (this.auth.isLeadsOnly()) return 'batch-2027';
		if (this.auth.getRole() !== 'admin') {
			const permitted = this.pageOptions.find(item => this.auth.canAccessPage(item.key));
			return permitted?.key || 'batch-2027';
		}
		const page = this.pageOptions.find(item => item.key === value);
		return page?.key || 'batch-2027';
	}

	private resolveDataView(value: string | null): AdminDataView | null {
		const allowed: AdminDataView[] = ['overview', 'leads', 'customers', 'feedback', 'programs', 'wheel', 'admins'];
		if (!value || !allowed.includes(value as AdminDataView)) return null;
		const view = value as AdminDataView;
		if (view === 'feedback') return this.auth.canAccessFeature('feedback') ? view : null;
		if (view === 'customers') return this.auth.canAccessFeature('customers') ? view : null;
		if (view === 'overview' || view === 'programs' || view === 'admins') {
			return this.auth.getRole() === 'admin' ? view : null;
		}
		return this.auth.canAccessFeature(view) ? view : null;
	}

	get leadsOnlyAccount(): boolean {
		return this.auth.isLeadsOnly();
	}

	get fullAdminAccount(): boolean { return this.auth.getRole() === 'admin'; }

	canAccessPage(pageKey: string): boolean { return this.auth.canAccessPage(pageKey); }

	canAccessFeature(feature: 'leads' | 'customers' | 'wheel' | 'feedback'): boolean { return this.auth.canAccessFeature(feature); }
	canAccessCustomerPermission(_permission: string): boolean { return this.auth.canAccessFeature('customers'); }
}
