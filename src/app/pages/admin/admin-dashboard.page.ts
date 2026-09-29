import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { CmsPageKey, cmsPageOptions } from '../../core/cms-page.registry';
import { displayProgramLabel } from '../../core/program-labels';
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
import { JsonContentFormComponent } from './forms/json-content-form.component';
import { SuccessStoriesFormComponent } from './forms/success-stories-form.component';
import { Batch2027FormComponent } from './forms/batch-2027-form.component';
import { LaunchOfferFormComponent } from './forms/launch-offer-form.component';
import { RequirementsFormComponent } from './forms/requirements-form.component';
import { SchoolsFormComponent } from './forms/schools-form.component';
import { ProgramLabelPipe } from '../../shared/pipes/program-label.pipe';

interface PageOption {
	key: CmsPageKey;
	route: string;
	title: string;
	description: string;
	group: string;
}

type AdminDataView = 'overview' | 'leads' | 'feedback' | 'programs' | 'wheel' | 'admins';

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
	activeView: 'overview' | 'leads' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms' = 'leads';
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
	programs: Program[] = [];
	wheelClaims: WheelClaim[] = [];
	feedbacks: Feedback[] = [];
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
	showAdminUserPassword = false;
	adminUserFormError = '';
	adminUserPasswordDraft: Record<string, string> = {};
	adminUserPasswordVisibility: Record<string, boolean> = {};
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
	readonly adminFeatureOptions = [{ key: 'leads', title: 'الليدز' }, { key: 'wheel', title: 'نتائج العجلة' }, { key: 'feedback', title: 'آراء الطلاب' }];
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
	leadsTotal = 0;
	leadStatuses = ['new', 'contacted', 'no_response', 'interested', 'registered', 'not_interested', 'follow_up', 'closed'];
	readonly leadStatusLabels: Record<string, string> = { new: 'جديد', contacted: 'تم التواصل', no_response: 'لم يرد', interested: 'مهتم', registered: 'مسجل', not_interested: 'غير مهتم', follow_up: 'متابعة', closed: 'مغلق', converted: 'تم التحويل' };
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
	siteMaintenance = false;
	isSavingSiteMode = false;
	isSaving = false;
	isLoading = false;
	isLoadingLeads = false;
	leadPendingDeletion: Lead | null = null;
	wheelPendingDeletion: WheelClaim | null = null;
	pageSummaries: Record<string, { hasContent: boolean; updatedAt?: string }> = {};
	private pendingCmsNavigation = false;
	private leadsRequestId = 0;
	private pageLoadRequestId = 0;

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
			this.auth.loadCurrentUser().subscribe({ next: user => { this.adminUsername = user.username || this.adminUsername; } });
		}
		this.seo.setTitle('لوحة تحكم الإدارة');
		this.seo.setRobots('noindex, nofollow, noarchive');
		this.refreshSummaries();
		this.route.paramMap.subscribe(params => {
			const pageKey = this.resolvePageKey(params.get('pageKey'));
			const isCmsNavigation = this.pendingCmsNavigation;
			this.selectedPageKey = pageKey;
			if (this.pendingCmsNavigation) {
				this.activeView = 'cms';
				this.pendingCmsNavigation = false;
			} else {
			if (this.auth.getRole() === 'admin') {
				this.activeView = this.resolveDataView(this.route.snapshot.queryParamMap.get('view')) || 'leads';
				// Load only the visible section. Loading every admin section at once
				// exhausts the production database connection pool and makes one of
				// the otherwise unrelated requests fail intermittently.
				if (this.activeView === 'overview') this.loadOverview();
				if (this.activeView === 'leads') this.loadLeads();
				if (this.activeView === 'feedback') this.loadFeedback();
				if (this.activeView === 'programs') this.loadPrograms();
				if (this.activeView === 'wheel') this.loadWheelClaims();
				if (this.activeView === 'admins') this.loadAdminUsers();
				this.loadSiteMode();
				} else if (this.auth.isLeadsOnly() || this.auth.canAccessFeature('leads') || this.auth.canAccessFeature('wheel') || this.auth.canAccessFeature('feedback')) {
					const canLoadLeads = this.auth.canAccessFeature('leads');
					const canLoadWheel = this.auth.canAccessFeature('wheel');
					const canLoadFeedback = this.auth.canAccessFeature('feedback');
					this.activeView = canLoadLeads ? 'leads' : canLoadWheel ? 'wheel' : 'feedback';
					if (canLoadLeads) this.loadLeads();
					if (canLoadWheel) this.loadWheelClaims();
					if (canLoadFeedback) this.loadFeedback();
				} else {
					this.activeView = 'cms';
				}
			}
			if (!isCmsNavigation) this.loadPage(pageKey);
		});
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

	setView(view: 'overview' | 'leads' | 'feedback' | 'programs' | 'wheel' | 'admins' | 'cms'): void {
		this.statusMessage = '';
		this.errorMessage = '';
		if (view === 'leads' && !this.auth.canAccessFeature('leads')) return;
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
			void this.router.navigate([], {
				relativeTo: this.route,
				queryParams: { view: view === 'overview' ? null : view },
				queryParamsHandling: 'merge',
				replaceUrl: true
			});
		}
		if (view === 'overview') this.loadOverview();
		if (view === 'leads') this.loadLeads();
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
	loadFeedback(force = false): void {
		if ((this.isLoadingFeedback && !force) || (this.feedbackLoaded && !force)) return;
		this.isLoadingFeedback = true;
		this.statusMessage = '';
		this.errorMessage = '';
		this.adminApi.listFeedback(this.feedbackSearch.trim(), this.feedbackStatus).pipe(
			timeout({ each: 15000 }),
			finalize(() => { this.isLoadingFeedback = false; this.refreshView(); })
		).subscribe({
			next: result => { this.feedbacks = result.data; this.feedbackTotal = result.pagination.total; this.feedbackLoaded = true; this.statusMessage = 'تم تحديث الآراء بنجاح.'; this.refreshView(); },
			error: err => { this.handleApiError(err); this.refreshView(); }
		});
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
		this.adminApi.listLeads(this.leadSearch.trim(), this.leadStatus, this.leadSource, this.leadProgram, this.leadDateFrom, this.leadDateTo, this.leadsPage, 20, this.leadPlatform.trim(), this.leadCampaign.trim()).pipe(timeout({ each: 15000 }), finalize(() => { if (requestId === this.leadsRequestId) this.isLoadingLeads = false; this.refreshView(); })).subscribe({
			next: result => {
				if (requestId !== this.leadsRequestId) return;
				this.leads = result.data;
				this.leadsPages = result.pagination.pages || 1;
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
	changeLeadPage(delta: number): void { this.leadsPage = Math.min(Math.max(this.leadsPage + delta, 1), this.leadsPages); this.loadLeads(true); }
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
		this.leadPendingDeletion = lead;
		this.refreshView();
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
		this.adminApi.listWheelClaims({ search: this.wheelSearch.trim(), gift: this.wheelGift, program: this.wheelProgram, from: this.wheelDateFrom, to: this.wheelDateTo }).pipe(timeout({ each: 15000 }), finalize(() => { this.isLoadingWheelClaims = false; this.refreshView(); })).subscribe({
			next: result => { this.wheelClaims = result.data; this.wheelClaimsLoaded = true; this.statusMessage = 'تم تحديث نتائج العجلة بنجاح.'; this.errorMessage = ''; this.refreshView(); },
			error: err => { this.handleApiError(err); this.refreshView(); }
		});
	}
	searchWheelClaims(): void { this.loadWheelClaims(true); }
	clearWheelFilters(): void { this.wheelSearch = ''; this.wheelGift = ''; this.wheelProgram = ''; this.wheelDateFrom = ''; this.wheelDateTo = ''; this.loadWheelClaims(true); }
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
		this.activeView = 'cms';
		const currentRoutePageKey = this.route.snapshot.paramMap.get('pageKey');
		// Keep the URL in sync even when the selected page is already the
		// component's default. Without this, selecting the first CMS page from
		// /admin only changed the view in memory; a refresh then returned to the
		// default data view instead of the page the user was editing.
		if (pageKey === this.selectedPageKey && currentRoutePageKey === pageKey && this.activeView === 'cms') return;
		this.selectedPageKey = pageKey;
		this.loadPage(pageKey);
		this.pendingCmsNavigation = true;
		void this.router.navigate(['/admin', pageKey], { queryParams: {} });
	}

	toggleSidebar(): void {
		this.sidebarOpen = !this.sidebarOpen;
	}

	loadPage(pageKey: CmsPageKey): void {
		const requestId = ++this.pageLoadRequestId;
		this.statusMessage = '';
		this.errorMessage = '';
		this.isLoading = true;
		this.currentContent = null;

		this.contentService.loadPageState(pageKey).pipe(timeout({ each: 15000 }), finalize(() => {
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
		const allowed: AdminDataView[] = ['leads', 'feedback', 'programs', 'wheel', 'admins'];
		if (!value || !allowed.includes(value as AdminDataView)) return null;
		const view = value as AdminDataView;
		if (view === 'feedback') return this.auth.canAccessFeature('feedback') ? view : null;
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

	canAccessFeature(feature: 'leads' | 'wheel' | 'feedback'): boolean { return this.auth.canAccessFeature(feature); }
}
