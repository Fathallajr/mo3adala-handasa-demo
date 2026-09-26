import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsPageKey, cmsPageDefaults, cmsPageOptions } from '../../core/cms-page.registry';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { AdminApiService, AdminUser, DashboardSummary, Feedback, Lead, Program, WheelClaim } from '../../core/services/admin-api.service';
import { SeoService } from '../../core/seo.service';
import { ContactFormComponent } from './forms/contact-form.component';
import { FaqFormComponent } from './forms/faq-form.component';
import { HomeFormComponent } from './forms/home-form.component';
import { NewsFormComponent } from './forms/news-form.component';
import { SubDetailsFormComponent } from './forms/sub-details-form.component';
import { SubAbReviewsFormComponent } from './forms/sub-ab-reviews-form.component';
import { SubIntensiveFormComponent } from './forms/sub-intensive-form.component';
import { JsonContentFormComponent } from './forms/json-content-form.component';
import { SuccessStoriesFormComponent } from './forms/success-stories-form.component';
import { Batch2027FormComponent } from './forms/batch-2027-form.component';
import { RequirementsFormComponent } from './forms/requirements-form.component';
import { SchoolsFormComponent } from './forms/schools-form.component';

interface PageOption {
	key: CmsPageKey;
	route: string;
	title: string;
	description: string;
	group: string;
}

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
		SubIntensiveFormComponent,
		JsonContentFormComponent,
		SuccessStoriesFormComponent,
		Batch2027FormComponent,
		RequirementsFormComponent,
		SchoolsFormComponent
	],
	templateUrl: './admin-dashboard.page.html',
	styleUrls: ['./admin-dashboard.page.css']
})
export class AdminDashboardPageComponent implements OnInit {
	sidebarOpen = false;
	activeView: 'overview' | 'leads' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms' = 'overview';
	dashboard: DashboardSummary | null = null;
	leads: Lead[] = [];
	programs: Program[] = [];
	wheelClaims: WheelClaim[] = [];
	feedbacks: Feedback[] = [];
	feedbackTotal = 0;
	feedbackSearch = '';
	feedbackStatus = '';
	readonly feedbackStatuses: Feedback['status'][] = ['new', 'reviewed', 'published', 'archived'];
	readonly feedbackStatusLabels: Record<string, string> = { new: 'جديد', reviewed: 'تمت المراجعة', published: 'منشور', archived: 'مؤرشف' };
	isLoadingFeedback = false;
	adminUsers: AdminUser[] = [];
	adminUserDraft = { username: '', password: '', permissions: [] as string[] };
	showAdminUserPassword = false;
	adminUserFormError = '';
	adminUserPasswordDraft: Record<string, string> = {};
	adminUserPasswordVisibility: Record<string, boolean> = {};
	adminUserPermissionDraft: Record<string, string[]> = {};
	adminPermissionEdit: Record<string, boolean> = {};
	isLoadingAdminUsers = false;
	get adminPageOptions(): PageOption[] { return cmsPageOptions.filter(page => !this.hiddenAdminPageKeys.has(page.key)); }
	readonly adminFeatureOptions = [{ key: 'leads', title: 'الليدز' }, { key: 'wheel', title: 'نتائج العجلة' }];
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
	readonly defaultLeadProgramOptions = ['', 'معادلة هندسة', 'معادلة حاسبات', 'معادلة هندسة عربي', 'معادلة حاسبات عربي', 'معادلة هندسة إنجليزي', 'معادلة حاسبات إنجليزي'];
	leadProgramOptions = [...this.defaultLeadProgramOptions];
	leadsPage = 1;
	leadsPages = 1;
	leadsTotal = 0;
	leadStatuses = ['new', 'contacted', 'interested', 'registered', 'not_interested', 'follow_up', 'closed'];
	readonly leadStatusLabels: Record<string, string> = { new: 'جديد', contacted: 'تم التواصل', interested: 'مهتم', registered: 'مسجل', not_interested: 'غير مهتم', follow_up: 'متابعة', closed: 'مغلق', converted: 'تم التحويل' };
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
	isSaving = false;
	isLoading = false;
	isLoadingLeads = false;
	pageSummaries: Record<string, { hasContent: boolean; updatedAt?: string }> = {};
	private pendingCmsNavigation = false;
	private leadsRequestId = 0;

	constructor(
		private contentService: MonthlyContentService,
		private auth: AdminAuthService,
		private adminApi: AdminApiService,
		private router: Router,
		private route: ActivatedRoute,
		private seo: SeoService
	) {}

	ngOnInit(): void {
		this.seo.setTitle('لوحة تحكم الإدارة');
		this.seo.setRobots('noindex, nofollow, noarchive');
		this.refreshSummaries();
		this.route.paramMap.subscribe(params => {
			const pageKey = this.resolvePageKey(params.get('pageKey'));
			this.selectedPageKey = pageKey;
			if (this.pendingCmsNavigation) {
				this.activeView = 'cms';
				this.pendingCmsNavigation = false;
			} else {
				if (this.auth.getRole() === 'admin') {
					this.activeView = 'overview';
					this.loadOverview();
				} else if (this.auth.isLeadsOnly() || this.auth.canAccessFeature('leads') || this.auth.canAccessFeature('wheel')) {
					this.activeView = 'leads';
					if (this.auth.canAccessFeature('leads')) this.loadLeads();
					else if (this.auth.canAccessFeature('wheel')) { this.activeView = 'wheel'; this.loadWheelClaims(); }
				} else {
					this.activeView = 'cms';
				}
			}
			this.loadPage(pageKey);
		});
	}

	setView(view: 'overview' | 'leads' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms'): void {
		if (view === 'leads' && !this.auth.canAccessFeature('leads')) return;
		if (view === 'wheel' && !this.auth.canAccessFeature('wheel')) return;
		if (view !== 'cms' && view !== 'leads' && view !== 'wheel' && this.auth.getRole() !== 'admin') return;
		this.sidebarOpen = false;
		this.activeView = view;
		this.statusMessage = '';
		this.errorMessage = '';
		if (view === 'overview') this.loadOverview();
		if (view === 'leads') this.loadLeads();
		if (view === 'programs') this.loadPrograms();
		if (view === 'wheel') this.loadWheelClaims();
		if (view === 'feedback') this.loadFeedback();
		if (view === 'admins') this.loadAdminUsers();
	}
	loadAdminUsers(): void {
		this.isLoadingAdminUsers = true;
		this.adminApi.listAdminUsers().subscribe({ next: result => { this.adminUsers = result.data; this.adminUserPermissionDraft = Object.fromEntries(result.data.map(user => [user.username, [...user.permissions]])); this.isLoadingAdminUsers = false; }, error: err => { this.isLoadingAdminUsers = false; this.handleApiError(err); } });
	}
	createAdminUser(): void {
		const username = this.adminUserDraft.username.trim();
		const password = this.adminUserDraft.password;
		this.adminUserFormError = '';
		if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) { this.adminUserFormError = 'اسم المستخدم يجب أن يكون 3 أحرف أو أكثر وبالإنجليزية أو الأرقام فقط.'; return; }
		if (password.length < 10) { this.adminUserFormError = 'كلمة المرور يجب أن تكون 10 أحرف على الأقل.'; return; }
		this.adminApi.createAdminUser({ ...this.adminUserDraft, username }).subscribe({ next: user => { this.adminUsers = [user, ...this.adminUsers]; this.adminUserDraft = { username: '', password: '', permissions: [] }; this.statusMessage = 'تم إنشاء الحساب بدون تخزين كلمة المرور كنص مكشوف.'; }, error: err => this.handleApiError(err) });
	}
	toggleAdminPermission(target: string[] | null, pageKey: string): void { if (!target) return; const index = target.indexOf(pageKey); if (index >= 0) target.splice(index, 1); else target.push(pageKey); }
	setAdminPassword(user: AdminUser): void {
		const password = this.adminUserPasswordDraft[user.username] || '';
		if (!password) { this.errorMessage = 'اكتب كلمة المرور الجديدة أولاً.'; return; }
		this.adminApi.updateAdminUser(user.username, { password }).subscribe({ next: () => { this.adminUserPasswordDraft[user.username] = ''; this.statusMessage = 'تم تغيير كلمة المرور.'; }, error: err => this.handleApiError(err) });
	}
	saveAdminPermissions(user: AdminUser): void {
		this.adminApi.updateAdminUser(user.username, { permissions: this.adminUserPermissionDraft[user.username] || user.permissions }).subscribe({ next: updated => { user.permissions = updated.permissions; this.adminPermissionEdit[user.username] = false; this.statusMessage = 'تم تحديث الصفحات المسموحة.'; }, error: err => this.handleApiError(err) });
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
	loadFeedback(): void {
		this.isLoadingFeedback = true;
		this.adminApi.listFeedback(this.feedbackSearch.trim(), this.feedbackStatus).subscribe({
			next: result => { this.feedbacks = result.data; this.feedbackTotal = result.pagination.total; this.isLoadingFeedback = false; },
			error: err => { this.isLoadingFeedback = false; this.handleApiError(err); }
		});
	}
	updateFeedbackStatus(feedback: Feedback, status: Feedback['status']): void {
		this.adminApi.updateFeedback(feedback.id, status).subscribe({ next: updated => { feedback.status = updated.status; this.statusMessage = 'تم تحديث حالة الرأي.'; }, error: err => this.handleApiError(err) });
	}
	formatFeedbackStatus(status?: string): string { return this.feedbackStatusLabels[status || ''] || status || 'غير محدد'; }

	loadOverview(): void { this.adminApi.getSummary().subscribe({ next: value => { this.dashboard = value; this.leadProgramOptions = Array.from(new Set([...this.defaultLeadProgramOptions, ...Object.keys(value.byProgram || {})])).sort((a, b) => a.localeCompare(b, 'ar')); }, error: err => this.handleApiError(err) }); }
	loadLeads(): void {
		const requestId = ++this.leadsRequestId;
		this.isLoadingLeads = true;
		this.statusMessage = '';
		this.errorMessage = '';
		this.adminApi.listLeads(this.leadSearch.trim(), this.leadStatus, this.leadSource, this.leadProgram, this.leadDateFrom, this.leadDateTo, this.leadsPage, 20, this.leadPlatform.trim(), this.leadCampaign.trim()).subscribe({
			next: result => {
				if (requestId !== this.leadsRequestId) return;
				this.leads = result.data;
				this.leadsPages = result.pagination.pages || 1;
				this.leadsTotal = result.pagination.total;
				this.isLoadingLeads = false;
				this.statusMessage = 'تم تحديث بيانات الليدز بنجاح.';
			},
			error: err => {
				if (requestId !== this.leadsRequestId) return;
				this.isLoadingLeads = false;
				this.handleApiError(err);
			}
		});
	}
	searchLeads(): void { this.leadsPage = 1; this.loadLeads(); }
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
	changeLeadPage(delta: number): void { this.leadsPage = Math.min(Math.max(this.leadsPage + delta, 1), this.leadsPages); this.loadLeads(); }
	updateLeadStatus(lead: Lead, status: string): void {
		this.adminApi.updateLead(lead.id, { status }).subscribe({ next: updated => { lead.status = updated.status; this.statusMessage = 'تم تحديث حالة العميل.'; }, error: err => this.handleApiError(err) });
	}
	loadPrograms(): void { this.adminApi.listPrograms().subscribe({ next: result => this.programs = result.data, error: err => this.handleApiError(err) }); }
	editProgram(program: Program): void { this.editingProgramId = program.id; this.programDraft = { ...program, features: [...(program.features || [])] }; }
	newProgram(): void { this.editingProgramId = null; this.programDraft = { name: '', slug: '', category: '', language: 'ar', price: 0, enrollmentStatus: 'open', isActive: true }; }
	saveProgram(): void {
		const request = this.editingProgramId ? this.adminApi.updateProgram(this.editingProgramId, this.programDraft) : this.adminApi.createProgram(this.programDraft);
		request.subscribe({ next: () => { this.statusMessage = 'تم حفظ البرنامج.'; this.loadPrograms(); this.newProgram(); }, error: err => this.handleApiError(err) });
	}
	loadWheelClaims(): void {
		this.adminApi.listWheelClaims({ search: this.wheelSearch.trim(), gift: this.wheelGift, program: this.wheelProgram, from: this.wheelDateFrom, to: this.wheelDateTo }).subscribe({
			next: result => { this.wheelClaims = result.data; this.statusMessage = 'تم تحديث نتائج العجلة بنجاح.'; },
			error: err => this.handleApiError(err)
		});
	}
	searchWheelClaims(): void { this.loadWheelClaims(); }
	clearWheelFilters(): void { this.wheelSearch = ''; this.wheelGift = ''; this.wheelProgram = ''; this.wheelDateFrom = ''; this.wheelDateTo = ''; this.loadWheelClaims(); }
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
		this.errorMessage = err.error?.message || 'تعذر تحميل البيانات من السيرفر.';
	}

	selectPage(pageKey: CmsPageKey): void {
		this.sidebarOpen = false;
		this.activeView = 'cms';
		if (pageKey === this.selectedPageKey) return;
		this.pendingCmsNavigation = true;
		void this.router.navigate(['/admin', pageKey]);
	}

	toggleSidebar(): void {
		this.sidebarOpen = !this.sidebarOpen;
	}

	loadPage(pageKey: CmsPageKey): void {
		this.statusMessage = '';
		this.errorMessage = '';
		this.isLoading = true;
		this.currentContent = structuredClone(cmsPageDefaults[pageKey]);

		this.contentService.loadPageState(pageKey, cmsPageDefaults[pageKey]).subscribe({
			next: content => {
				this.currentContent = content;
				this.isLoading = false;
			},
			error: () => {
				this.isLoading = false;
				this.errorMessage = 'تعذر تحميل المحتوى من السيرفر، تم عرض القالب الافتراضي.';
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

	resetToDefaults(): void {
		this.currentContent = structuredClone(cmsPageDefaults[this.selectedPageKey]);
		this.statusMessage = 'تم الرجوع للقالب الافتراضي.';
		this.errorMessage = '';
	}

	save(): void {
		this.errorMessage = '';
		this.statusMessage = '';
		this.isSaving = true;

		this.contentService.savePageState(this.selectedPageKey, this.currentContent).subscribe({
			next: saved => {
				this.isSaving = false;
				this.currentContent = saved;
				this.statusMessage = 'تم الحفظ على السيرفر بنجاح ✓';
				this.refreshSummaries();
			},
			error: (err: HttpErrorResponse) => {
				this.isSaving = false;
				if (err.status === 401) {
					this.handleSessionExpired();
					return;
				}
				this.errorMessage = 'فشل حفظ التعديلات على السيرفر.';
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
		return ['home', 'faq', 'contact', 'subscription-details', 'subscription-engineering-ar', 'subscription-engineering-en', 'subscription-computers-ar', 'subscription-computers-en', 'subscription-intensive', 'news-app', 'news-equation'].includes(this.selectedPageKey);
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

	get leadsOnlyAccount(): boolean {
		return this.auth.isLeadsOnly();
	}

	get fullAdminAccount(): boolean { return this.auth.getRole() === 'admin'; }

	canAccessPage(pageKey: string): boolean { return this.auth.canAccessPage(pageKey); }

	canAccessFeature(feature: 'leads' | 'wheel'): boolean { return this.auth.canAccessFeature(feature); }
}
