import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminApiService } from '../../core/services/admin-api.service';

@Component({ selector: 'app-site-session-details-page', standalone: true, imports: [CommonModule], templateUrl: './site-session-details.page.html', styleUrls: ['./site-session-details.page.css'] })
export class SiteSessionDetailsPageComponent implements OnInit {
	private readonly route = inject(ActivatedRoute); private readonly router = inject(Router); private readonly api = inject(AdminApiService); private readonly changeDetector = inject(ChangeDetectorRef);
	session: any = null; loading = true; error = '';
	ngOnInit(): void { const id = this.route.snapshot.paramMap.get('id') || ''; this.api.getAnalyticsSessionDetails(id).subscribe({ next: data => { this.session = data; this.loading = false; this.changeDetector.detectChanges(); }, error: error => { this.error = error?.error?.message || 'تعذر تحميل تفاصيل الجلسة.'; this.loading = false; this.changeDetector.detectChanges(); } }); }
	back(): void { void this.router.navigateByUrl('/admin/site-analysis'); }
	formatDuration(seconds: number): string { const value = Number(seconds || 0); return `${Math.floor(value / 60)} د ${String(value % 60).padStart(2, '0')} ث`; }
	pageDuration(page: any): string { return this.formatDuration(page.activeSeconds); }
	isSessionActive(): boolean { const lastSeen = Date.parse(this.session?.lastSeen || ''); return !this.session?.endedAt && Number.isFinite(lastSeen) && Date.now() - lastSeen < 5 * 60 * 1000; }
	pageExitTime(page: any): string | null { return page.exitedAt || (!this.isSessionActive() ? (this.session?.lastSeen || null) : null); }
	pageCount(): number { return Array.isArray(this.session?.pageViewsDetails) ? this.session.pageViewsDetails.length : Number(this.session?.pageViews || 0); }
	formatIp(ip: string): string { return ip === '::1' ? '127.0.0.1' : String(ip || '').replace(/^::ffff:/i, ''); }
	pageLabel(path: string): string { const labels: Record<string, string> = { '/': 'الرئيسية', '/contact': 'التواصل معنا', '/faq': 'الأسئلة الشائعة', '/requirements': 'شروط المعادلة', '/batch-2027': 'دفعة 2027 والعجلة', '/success-stories': 'قصص النجاح', '/subscription-engineering-ar': 'اشتراك هندسة عربي — دفعة 2027', '/schools': 'المدارس والمعاهد' }; return labels[path] || path || 'الرئيسية'; }
}
