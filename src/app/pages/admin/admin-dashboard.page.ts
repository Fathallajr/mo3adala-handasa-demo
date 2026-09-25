import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsPageKey, cmsPageDefaults, cmsPageOptions } from '../../core/cms-page.registry';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { AdminApiService, DashboardSummary, Lead, Program, WheelClaim } from '../../core/services/admin-api.service';
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
		RequirementsFormComponent
	],
	templateUrl: './admin-dashboard.page.html',
	styleUrls: ['./admin-dashboard.page.css']
})
export class AdminDashboardPageComponent implements OnInit {
	activeView: 'overview' | 'leads' | 'programs' | 'wheel' | 'cms' = 'overview';
	dashboard: DashboardSummary | null = null;
	leads: Lead[] = [];
	programs: Program[] = [];
	wheelClaims: WheelClaim[] = [];
	leadSearch = '';
	leadStatus = '';
	leadSource = '';
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
	pageOptions: PageOption[] = cmsPageOptions;

	selectedPageKey: CmsPageKey = 'home';
	currentContent: unknown = null;
	statusMessage = '';
	errorMessage = '';
	isSaving = false;
	isLoading = false;
	pageSummaries: Record<string, { hasContent: boolean; updatedAt?: string }> = {};

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
		this.loadOverview();
		this.refreshSummaries();
		this.route.paramMap.subscribe(params => {
			this.activeView = params.get('pageKey') ? 'cms' : this.activeView;
			const pageKey = this.resolvePageKey(params.get('pageKey'));
			this.selectedPageKey = pageKey;
			this.loadPage(pageKey);
		});
	}

	setView(view: 'overview' | 'leads' | 'programs' | 'wheel' | 'cms'): void {
		this.activeView = view;
		this.statusMessage = '';
		this.errorMessage = '';
		if (view === 'overview') this.loadOverview();
		if (view === 'leads') this.loadLeads();
		if (view === 'programs') this.loadPrograms();
		if (view === 'wheel') this.loadWheelClaims();
	}

	loadOverview(): void { this.adminApi.getSummary().subscribe({ next: value => { this.dashboard = value; this.leadProgramOptions = Array.from(new Set([...this.defaultLeadProgramOptions, ...Object.keys(value.byProgram || {})])).sort((a, b) => a.localeCompare(b, 'ar')); }, error: err => this.handleApiError(err) }); }
	loadLeads(): void {
		this.adminApi.listLeads(this.leadSearch.trim(), this.leadStatus, this.leadSource, this.leadProgram, this.leadDateFrom, this.leadDateTo, this.leadsPage).subscribe({
			next: result => { this.leads = result.data; this.leadsPages = result.pagination.pages || 1; this.leadsTotal = result.pagination.total; },
			error: err => this.handleApiError(err)
		});
	}
	searchLeads(): void { this.leadsPage = 1; this.loadLeads(); }
	clearLeadFilters(): void { this.leadSearch = ''; this.leadSource = ''; this.leadStatus = ''; this.leadProgram = ''; this.leadDateFrom = ''; this.leadDateTo = ''; this.searchLeads(); }
	downloadLeadsExcel(): void {
		if (this.leadDateFrom && this.leadDateTo && this.leadDateFrom > this.leadDateTo) { this.errorMessage = 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'; return; }
		this.adminApi.exportLeads({ search: this.leadSearch.trim(), status: this.leadStatus, source: this.leadSource, program: this.leadProgram, from: this.leadDateFrom, to: this.leadDateTo }).subscribe({
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
	loadWheelClaims(): void { this.adminApi.listWheelClaims().subscribe({ next: result => this.wheelClaims = result.data, error: err => this.handleApiError(err) }); }

	private handleApiError(err: HttpErrorResponse): void {
		if (err.status === 401) { this.handleSessionExpired(); return; }
		this.errorMessage = err.error?.message || 'تعذر تحميل البيانات من السيرفر.';
	}

	selectPage(pageKey: CmsPageKey): void {
		this.activeView = 'cms';
		if (pageKey === this.selectedPageKey) return;
		void this.router.navigate(['/admin', pageKey]);
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
		return this.pageOptions.reduce<Array<{ group: string; pages: PageOption[] }>>((groups, page) => {
			const existingGroup = groups.find(item => item.group === page.group);
			if (existingGroup) { existingGroup.pages.push(page); return groups; }
			groups.push({ group: page.group, pages: [page] });
			return groups;
		}, []);
	}

	private resolvePageKey(value: string | null): CmsPageKey {
		const page = this.pageOptions.find(item => item.key === value);
		return page?.key || 'home';
	}
}
