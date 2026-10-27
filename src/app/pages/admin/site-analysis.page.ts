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
	readonly pageSize = 5; performancePage = 1; recentSessionsPage = 1; adminSessionsPage = 1;
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
		this.performancePage = 1; this.recentSessionsPage = 1; this.adminSessionsPage = 1;
		this.loading = true; this.error = '';
		this.api.getAnalyticsSummary(this.from, this.to, this.device).subscribe({ next: result => { this.summary = result; this.loading = false; this.loadAdminSessions(); this.changeDetector.detectChanges(); }, error: error => { this.error = error?.error?.message || 'تعذر تحميل تحليل الموقع.'; this.loading = false; this.changeDetector.detectChanges(); } });
	}
	saveFilters(): void { try { localStorage.setItem('momentix.site-analysis.filters', JSON.stringify({ from: this.from, to: this.to, device: this.device })); } catch { /* storage may be unavailable */ } }
	restoreFilters(): void { try { const raw = localStorage.getItem('momentix.site-analysis.filters'); if (!raw) return; const saved = JSON.parse(raw); if (/^\d{4}-\d{2}-\d{2}$/.test(saved?.from || '')) this.from = saved.from; if (/^\d{4}-\d{2}-\d{2}$/.test(saved?.to || '')) this.to = saved.to; if (['', 'mobile', 'desktop', 'tablet', 'غير محدد'].includes(saved?.device)) this.device = saved.device; } catch { /* keep defaults */ } }
	private loadAdminSessions(): void { this.api.getAdminActivitySessions().subscribe({ next: result => { this.adminSessions = result.data || []; this.adminSessionsPage = 1; this.changeDetector.detectChanges(); } }); }
	pageNumbers(total: number): number[] { return Array.from({ length: Math.max(1, Math.ceil(total / this.pageSize)) }, (_, index) => index + 1); }
	performanceRows(): AnalyticsSummary['performance'] { const rows = this.summary?.performance || []; return rows.slice((this.performancePage - 1) * this.pageSize, this.performancePage * this.pageSize); }
	recentSessionRows(): AnalyticsSummary['recentSessions'] { const rows = this.summary?.recentSessions || []; return rows.slice((this.recentSessionsPage - 1) * this.pageSize, this.recentSessionsPage * this.pageSize); }
	adminSessionRows(): AdminActivitySession[] { return this.adminSessions.slice((this.adminSessionsPage - 1) * this.pageSize, this.adminSessionsPage * this.pageSize); }
	setPerformancePage(page: number): void { this.performancePage = Math.min(Math.max(page, 1), this.pageNumbers(this.summary?.performance.length || 0).length); }
	setRecentSessionsPage(page: number): void { this.recentSessionsPage = Math.min(Math.max(page, 1), this.pageNumbers(this.summary?.recentSessions.length || 0).length); }
	setAdminSessionsPage(page: number): void { this.adminSessionsPage = Math.min(Math.max(page, 1), this.pageNumbers(this.adminSessions.length).length); }
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
	locationLabel(value: string, type: 'country' | 'region'): string {
		const raw = String(value || '').trim(); if (!raw || raw === 'غير محدد') return 'Unknown';
		const key = raw.toUpperCase().replace(/[\s_-]+/g, '').replace(/GOVERNORATE$/, '').replace(/^(EG|GB)/, '');
		if (type === 'country') {
			const countries: Record<string, string> = { EG: 'مصر', EGYPT: 'مصر', GB: 'المملكة المتحدة', UK: 'المملكة المتحدة', UNITEDKINGDOM: 'المملكة المتحدة', US: 'الولايات المتحدة', UNITEDSTATES: 'الولايات المتحدة', AE: 'الإمارات العربية المتحدة', SA: 'السعودية', DE: 'ألمانيا', FR: 'فرنسا', IT: 'إيطاليا', ES: 'إسبانيا', TR: 'تركيا', QA: 'قطر', KW: 'الكويت', JO: 'الأردن', MA: 'المغرب', DZ: 'الجزائر', TN: 'تونس', CA: 'كندا', AU: 'أستراليا' };
			if (countries[key]) return countries[key];
			if (/^[A-Z]{2}$/.test(key)) { try { return new Intl.DisplayNames(['ar'], { type: 'region' }).of(key) || raw; } catch { return raw; } }
			return raw;
		}
		const regions: Record<string, string> = { C: 'القاهرة', CAIRO: 'القاهرة', GIZA: 'الجيزة', GZ: 'الجيزة', ALEXANDRIA: 'الإسكندرية', ALX: 'الإسكندرية', QALYUBIA: 'القليوبية', ALQALYUBIYAH: 'القليوبية', QLY: 'القليوبية', KB: 'القليوبية', DAKAHLIA: 'الدقهلية', DAQAHLIYAH: 'الدقهلية', DK: 'الدقهلية', SHARQIA: 'الشرقية', SHQ: 'الشرقية', SHR: 'الشرقية', GHARBIA: 'الغربية', GHR: 'الغربية', GH: 'الغربية', MENOUFIA: 'المنوفية', MNF: 'المنوفية', BEHEIRA: 'البحيرة', BH: 'البحيرة', KAFRELSHEIKH: 'كفر الشيخ', KFS: 'كفر الشيخ', DAMIETTA: 'دمياط', DAM: 'دمياط', DT: 'دمياط', DMT: 'دمياط', PORTSAID: 'بورسعيد', PTS: 'بورسعيد', ISMAILIA: 'الإسماعيلية', IS: 'الإسماعيلية', SUEZ: 'السويس', SUZ: 'السويس', MATROUH: 'مطروح', MAT: 'مطروح', MT: 'مطروح', FAYOUM: 'الفيوم', FYM: 'الفيوم', BENISUEF: 'بني سويف', BNS: 'بني سويف', MINYA: 'المنيا', MN: 'المنيا', ASSIUT: 'أسيوط', AST: 'أسيوط', SOHAG: 'سوهاج', SOH: 'سوهاج', SHG: 'سوهاج', QENA: 'قنا', QN: 'قنا', KN: 'قنا', LUXOR: 'الأقصر', LX: 'الأقصر', ASWAN: 'أسوان', ASN: 'أسوان', REDSEA: 'البحر الأحمر', RED: 'البحر الأحمر', BA: 'البحر الأحمر', NORTHSINAI: 'شمال سيناء', SIN: 'شمال سيناء', SOUTHSINAI: 'جنوب سيناء', SYN: 'جنوب سيناء', JS: 'جنوب سيناء', NEWVALLEY: 'الوادي الجديد', WAD: 'الوادي الجديد', ENG: 'إنجلترا', ENGLAND: 'إنجلترا' };
		if (regions[key]) return regions[key];
		return raw;
	}
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
		workbook.creator = 'Momentix Admin'; workbook.created = new Date(); workbook.modified = new Date();
		workbook.properties.date1904 = false;
		const palette = { navy: '173A88', blue: '2456B8', pale: 'EAF1FF', border: 'D9E2F2', text: '18243B', muted: '687A9B', green: '13825F' };
		const dateOnly = (value: string): Date | string => { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : date; };
		const dateTime = (value: string): Date | string => { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date; };
		const duration = (seconds: number): number => Math.max(Number(seconds || 0), 0) / 86400;
		const columnLetter = (column: number): string => { let value = ''; for (let current = column; current > 0; current = Math.floor((current - 1) / 26)) value = String.fromCharCode(65 + ((current - 1) % 26)) + value; return value; };
		let tableNumber = 0;
		const addSheet = (name: string, headers: string[], rows: unknown[][], formats: Record<number, string> = {}): ExcelJS.Worksheet => {
			const sheet = workbook.addWorksheet(name, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }] });
			sheet.addRow([name]); sheet.mergeCells(1, 1, 1, headers.length);
			sheet.addRow([`الفترة: ${data.from} إلى ${data.to}  |  الجهاز: ${this.device || 'كل الأجهزة'}`]); sheet.mergeCells(2, 1, 2, headers.length);
			sheet.addRow([]); const headerRow = sheet.addRow(headers); rows.forEach(row => sheet.addRow(row));
			const title = sheet.getCell(1, 1); title.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } }; title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.navy } }; title.alignment = { horizontal: 'right', vertical: 'middle' };
			const subtitle = sheet.getCell(2, 1); subtitle.font = { name: 'Arial', size: 10, color: { argb: palette.muted } }; subtitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.pale } }; subtitle.alignment = { horizontal: 'right', vertical: 'middle' };
			sheet.getRow(1).height = 32; sheet.getRow(2).height = 22; sheet.getRow(3).height = 8; headerRow.height = 25;
			headerRow.eachCell(cell => { cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.blue } }; cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true }; cell.border = { bottom: { style: 'thin', color: { argb: palette.border } } }; });
			for (let rowIndex = 5; rowIndex <= rows.length + 4; rowIndex++) { const row = sheet.getRow(rowIndex); row.eachCell(cell => { cell.font = { name: 'Arial', size: 10, color: { argb: palette.text } }; cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true }; }); if (rowIndex % 2 === 1) row.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F7F9FD' } }; }); }
			Object.entries(formats).forEach(([column, format]) => { for (let rowIndex = 5; rowIndex <= rows.length + 4; rowIndex++) sheet.getCell(rowIndex, Number(column)).numFmt = format; });
			sheet.columns = headers.map((header, index) => { const values = rows.map(row => String(row[index] ?? '')); const width = Math.max(header.length + 3, ...values.map(value => Math.min(value.length + 3, 38))); return { width: Math.min(38, Math.max(13, width)) }; });
			if (rows.length) { tableNumber += 1; sheet.addTable({ name: `AnalyticsTable${tableNumber}`, ref: `A4:${columnLetter(headers.length)}${rows.length + 4}`, headerRow: true, style: { theme: 'TableStyleMedium2', showRowStripes: true }, columns: headers.map(name => ({ name })), rows: rows as (string | number | boolean | Date | null)[][] }); }
			sheet.autoFilter = { from: `A4`, to: `${columnLetter(headers.length)}${rows.length + 4}` };
			return sheet;
		};
		addSheet('ملخص', ['البند', 'القيمة'], [
			['من تاريخ', dateOnly(data.from)], ['إلى تاريخ', dateOnly(data.to)], ['فلتر الجهاز', this.device || 'كل الأجهزة'], ['الزوار المميزون', data.visitors], ['الجلسات', data.sessions], ['مشاهدات الصفحات', data.pageViews], ['متوسط الجلسة', duration(data.averageSessionDuration)], ['صفحات لكل جلسة', data.pagesPerSession], ['التسجيلات', data.leads], ['معدل التحويل', Number(data.conversionRate || 0) / 100]
		], { 1: 'dd-mm-yyyy', 2: 'dd-mm-yyyy', 7: '[m]" د "ss" ث"', 10: '0.0%' });
		addSheet('الزيارات اليومية', ['التاريخ', 'الجلسات'], data.trafficOverTime.map(item => [dateOnly(item.date), item.value]), { 1: 'dd-mm-yyyy', 2: '#,##0' });
		const breakdownRows: unknown[][] = [];
		[['الدول', data.countries], ['المناطق', data.regions], ['الأجهزة', data.devices], ['مصادر الزيارة', data.referrers]].forEach(([category, items]) => (items as Array<{ label: string; value: number }>).forEach(item => breakdownRows.push([category, category === 'الدول' ? this.locationLabel(item.label, 'country') : category === 'المناطق' ? this.locationLabel(item.label, 'region') : item.label, item.value])));
		addSheet('التقسيمات', ['التصنيف', 'القيمة', 'العدد'], breakdownRows, { 3: '#,##0' });
		addSheet('الصفحات الأكثر مشاهدة', ['الصفحة', 'المسار', 'المشاهدات'], data.topPages.map(item => [this.pageLabel(item.path), item.path, item.value]), { 3: '#,##0' });
		addSheet('أداء المواقع', ['الصفحة', 'المسار', 'الزوار', 'الجلسات', 'مشاهدات الصفحات', 'متوسط الجلسة', 'صفحات لكل جلسة'], data.performance.map(item => [this.pageLabel(item.path), item.path, item.visitors, item.sessions, item.pageViews, duration(item.averageSessionDuration), item.pagesPerSession]), { 3: '#,##0', 4: '#,##0', 5: '#,##0', 6: '[m]" د "ss" ث"', 7: '0.00' });
		addSheet('التسجيلات', ['الشهر', 'عدد التسجيلات'], data.leadsByMonth.map(item => [this.formatMonth(item.month), item.value]), { 2: '#,##0' });
		addSheet('جلسات الزوار', ['المعرف', 'الجهاز', 'المتصفح', 'نظام التشغيل', 'صفحة الدخول', 'المصدر', 'عدد الصفحات', 'المدة', 'آخر نشاط'], data.recentSessions.map(session => [session.id, session.device, session.browser, session.os, session.landingPath, session.referrer || 'مباشر', session.pageViews, duration(session.durationSeconds), dateTime(session.lastSeen)]), { 7: '#,##0', 8: '[m]" د "ss" ث"', 9: 'dd-mm-yyyy hh:mm' });
		addSheet('جلسات الأدمن', ['المستخدم', 'الصلاحية', 'وقت الدخول', 'آخر نشاط', 'المدة', 'الحالة'], this.adminSessions.map(session => [session.username || 'غير محدد', session.role, dateTime(session.loginAt), dateTime(session.lastSeen), duration(Math.max(0, Math.round((Date.parse(session.logoutAt || session.lastSeen) - Date.parse(session.loginAt)) / 1000))), session.logoutAt ? 'منتهية' : 'نشطة']), { 3: 'dd-mm-yyyy hh:mm', 4: 'dd-mm-yyyy hh:mm', 5: '[m]" د "ss" ث"' });
		const buffer = await workbook.xlsx.writeBuffer(); const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `تحليل-الموقع-${data.from}-${data.to}.xlsx`; link.click(); URL.revokeObjectURL(url);
	}
}
