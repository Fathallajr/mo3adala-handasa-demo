import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminActivitySession, AnalyticsSummary, AdminApiService } from '../../core/services/admin-api.service';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { Router } from '@angular/router';
import * as ExcelJS from 'exceljs';

@Component({
	selector: 'app-site-analysis-page', standalone: true, imports: [CommonModule, FormsModule],
	templateUrl: './site-analysis.page.html', styleUrls: ['./site-analysis.page.css', './admin-dashboard.page.css']
})
export class SiteAnalysisPageComponent implements OnInit, OnDestroy {
	private readonly api = inject(AdminApiService);
	private readonly auth = inject(AdminAuthService);
	private readonly router = inject(Router);
	private readonly changeDetector = inject(ChangeDetectorRef);
	from = this.daysAgo(29); to = this.today(); device = ''; loading = false; error = ''; summary: AnalyticsSummary | null = null;
	sidebarOpen = false; sidebarCollapsed = false; adminUsername = this.auth.getUsername(); adminSessions: AdminActivitySession[] = []; private refreshTimer?: ReturnType<typeof setInterval>;
	readonly sitePages = [
		{ label: 'دفعة 2027 والعجلة', route: '/admin/batch-2027' }, { label: 'بوب‑أب الخصم', route: '/admin/launch-offer' },
		{ label: 'أخبار المعادلة', route: '/admin/news-equation' }, { label: 'المدارس والمعاهد', route: '/admin/schools' },
		{ label: 'الموظفون', route: '/admin/employees' }, { label: 'اشتراك هندسة عربي — دفعة 2027', route: '/admin/subscription-engineering-ar' },
		{ label: 'اشتراك هندسة لغات — دفعة 2027', route: '/admin/subscription-engineering-en' }, { label: 'اشتراك حاسبات عربي — دفعة 2027', route: '/admin/subscription-computers-ar' },
		{ label: 'اشتراك حاسبات لغات — دفعة 2027', route: '/admin/subscription-computers-en' }
	];

	ngOnInit(): void { if (!this.auth.canAccessFeature('analytics') && this.auth.getUsername() !== 'localadmin') { void this.router.navigateByUrl('/admin'); return; } this.load(); this.refreshTimer = setInterval(() => { if (!this.loading) this.load(); }, 30000); }
	ngOnDestroy(): void { if (this.refreshTimer) clearInterval(this.refreshTimer); }
	today(): string { return new Date().toISOString().slice(0, 10); }
	daysAgo(days: number): string { return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10); }
	load(): void {
		this.restoreFilters(); this.saveFilters();
		this.loading = true; this.error = '';
		this.api.getAnalyticsSummary(this.from, this.to, this.device).subscribe({ next: result => { this.summary = result; this.loading = false; this.loadAdminSessions(); this.changeDetector.detectChanges(); }, error: error => { this.error = error?.error?.message || 'تعذر تحميل تحليل الموقع.'; this.loading = false; this.changeDetector.detectChanges(); } });
	}
	saveFilters(): void { try { localStorage.setItem('momentix.site-analysis.filters', JSON.stringify({ from: this.from, to: this.to, device: this.device })); } catch { /* storage may be unavailable */ } }
	restoreFilters(): void { try { const raw = localStorage.getItem('momentix.site-analysis.filters'); if (!raw) return; const saved = JSON.parse(raw); if (/^\d{4}-\d{2}-\d{2}$/.test(saved?.from || '')) this.from = saved.from; if (/^\d{4}-\d{2}-\d{2}$/.test(saved?.to || '')) this.to = saved.to; if (['', 'mobile', 'desktop', 'tablet', 'غير محدد'].includes(saved?.device)) this.device = saved.device; } catch { /* keep defaults */ } }
	private loadAdminSessions(): void { this.api.getAdminActivitySessions().subscribe({ next: result => { this.adminSessions = result.data || []; this.changeDetector.detectChanges(); } }); }
	canAccessFeature(feature: 'leads' | 'customers' | 'feedback' | 'analytics' | 'wheel' | 'free-codes' | 'finance'): boolean { return this.auth.canAccessFeature(feature); }
	navigateAdmin(view: string): void { this.sidebarOpen = false; void this.router.navigateByUrl(`/admin?view=${encodeURIComponent(view)}`); }
	navigatePage(route: string): void { this.sidebarOpen = false; void this.router.navigateByUrl(route); }
	toggleSidebar(): void { this.sidebarOpen = !this.sidebarOpen; }
	toggleSidebarControl(): void { if (window.innerWidth <= 1100) this.toggleSidebar(); else this.toggleDesktopSidebar(); }
	toggleDesktopSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }
	openPreview(): void { window.open('/', '_blank', 'noopener,noreferrer'); }
	logout(): void { this.auth.logout(); this.router.navigateByUrl('/admin/login'); }
	backToAdmin(): void { this.router.navigateByUrl('/admin'); }
	formatDuration(seconds: number): string { const value = Number(seconds || 0); return `${Math.floor(value / 60)} د ${String(value % 60).padStart(2, '0')} ث`; }
	formatAdminSessionDuration(session: AdminActivitySession): string { const start = Date.parse(session.loginAt); const end = Date.parse(session.logoutAt || session.lastSeen); return this.formatDuration(Math.max(0, Math.round((end - start) / 1000))); }
	maxValue(items: Array<{ value: number }> = []): number { return Math.max(...items.map(item => Number(item.value || 0)), 1); }
	activeDays(items: Array<{ date: string; value: number }> = []): number { return items.filter(item => Number(item.value || 0) > 0).length; }
	peakDay(items: Array<{ date: string; value: number }> = []): { date: string; value: number } { return items.reduce((peak, item) => Number(item.value || 0) > Number(peak.value || 0) ? item : peak, { date: '', value: 0 }); }
	formatTrafficDate(date: string): string { if (!date) return '—'; const months: Record<string, string> = { '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل', '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس', '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر' }; return `${Number(date.slice(8, 10))} ${months[date.slice(5, 7)] || date.slice(5, 7)}`; }
	formatMonth(month: string): string { if (!month) return '—'; const months: Record<string, string> = { '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل', '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس', '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر' }; return `${months[month.slice(5, 7)] || month.slice(5, 7)} ${month.slice(0, 4)}`; }
	pageLabel(path: string): string {
		const labels: Record<string, string> = {
			'/': 'الرئيسية', '/faq': 'الأسئلة الشائعة', '/contact': 'التواصل معنا', '/requirements': 'شروط المعادلة',
			'/batch-2027': 'دفعة 2027 والعجلة', '/success-stories': 'قصص النجاح', '/feedback': 'آراء الطلاب',
			'/photos-2025': 'صور الطلاب', '/news-equation': 'أخبار المعادلة', '/engineers-ar': 'المهندسين والمدرسين',
			'/schools': 'المدارس والمعاهد', '/subscription-engineering-ar': 'اشتراك هندسة عربي — دفعة 2027',
			'/subscription-engineering-en': 'اشتراك هندسة لغات — دفعة 2027', '/subscription-computers-ar': 'اشتراك حاسبات عربي — دفعة 2027',
			'/subscription-computers-en': 'اشتراك حاسبات لغات — دفعة 2027'
		};
		if (labels[path]) return labels[path];
		if (path.startsWith('/news/')) return 'تفاصيل خبر';
		return path || 'الرئيسية';
	}
	openSession(id: string): void { void this.router.navigate(['/admin/site-analysis/session', id]); }
	async exportExcel(): Promise<void> {
		const data = this.summary;
		if (!data || this.loading) return;
		const workbook = new ExcelJS.Workbook();
		workbook.creator = 'Momentix Admin'; workbook.created = new Date();
		const addSheet = (name: string, headers: string[], rows: unknown[][]): ExcelJS.Worksheet => {
			const sheet = workbook.addWorksheet(name); sheet.views = [{ rightToLeft: true }];
			sheet.addRow(headers); rows.forEach(row => sheet.addRow(row));
			sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2456B8' } };
			sheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' }; sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + Math.min(headers.length, 26))}1` }; sheet.views = [{ rightToLeft: true, state: 'frozen', ySplit: 1 }];
			sheet.columns.forEach(column => { const number = column.number || 1; const lengths = sheet.getColumn(number).values.slice(1).map(value => String(value ?? '').length + 2); column.width = Math.min(42, Math.max(14, ...lengths)); });
			return sheet;
		};
		addSheet('ملخص', ['البند', 'القيمة'], [
			['من تاريخ', data.from], ['إلى تاريخ', data.to], ['فلتر الجهاز', this.device || 'كل الأجهزة'], ['الزوار المميزون', data.visitors], ['الجلسات', data.sessions], ['مشاهدات الصفحات', data.pageViews], ['متوسط الجلسة', this.formatDuration(data.averageSessionDuration)], ['صفحات لكل جلسة', data.pagesPerSession], ['التسجيلات', data.leads], ['معدل التحويل', `${data.conversionRate}%`]
		]);
		addSheet('الزيارات اليومية', ['التاريخ', 'الجلسات'], data.trafficOverTime.map(item => [item.date, item.value]));
		const breakdownRows: unknown[][] = [];
		[['الدول', data.countries], ['المناطق', data.regions], ['الأجهزة', data.devices], ['مصادر الزيارة', data.referrers]].forEach(([category, items]) => (items as Array<{ label: string; value: number }>).forEach(item => breakdownRows.push([category, item.label, item.value])));
		addSheet('التقسيمات', ['التصنيف', 'القيمة', 'العدد'], breakdownRows);
		addSheet('الصفحات الأكثر مشاهدة', ['الصفحة', 'المسار', 'المشاهدات'], data.topPages.map(item => [this.pageLabel(item.path), item.path, item.value]));
		addSheet('أداء المواقع', ['الصفحة', 'المسار', 'الزوار', 'الجلسات', 'مشاهدات الصفحات', 'متوسط الجلسة', 'صفحات لكل جلسة'], data.performance.map(item => [this.pageLabel(item.path), item.path, item.visitors, item.sessions, item.pageViews, this.formatDuration(item.averageSessionDuration), item.pagesPerSession]));
		addSheet('التسجيلات', ['الشهر', 'عدد التسجيلات'], data.leadsByMonth.map(item => [this.formatMonth(item.month), item.value]));
		addSheet('جلسات الزوار', ['المعرف', 'الجهاز', 'المتصفح', 'نظام التشغيل', 'صفحة الدخول', 'المصدر', 'عدد الصفحات', 'المدة', 'آخر نشاط'], data.recentSessions.map(session => [session.id, session.device, session.browser, session.os, session.landingPath, session.referrer || 'مباشر', session.pageViews, this.formatDuration(session.durationSeconds), session.lastSeen]));
		addSheet('جلسات الأدمن', ['المستخدم', 'الصلاحية', 'وقت الدخول', 'آخر نشاط', 'المدة', 'الحالة'], this.adminSessions.map(session => [session.username || 'غير محدد', session.role, session.loginAt, session.lastSeen, this.formatAdminSessionDuration(session), session.logoutAt ? 'انتهت' : 'نشطة']));
		const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `تحليل-الموقع-${data.from}-${data.to}.xlsx`; link.click(); URL.revokeObjectURL(url);
	}
}
