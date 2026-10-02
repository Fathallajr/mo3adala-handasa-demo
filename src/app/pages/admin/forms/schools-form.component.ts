import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { DEFAULT_SCHOOLS } from '../../../core/schools.defaults';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

interface SchoolItem {
	id: number;
	name: string;	type: string;	category: string;	logo: string;	programs: Array<'engineering' | 'computers'>;
}

@Component({
	selector: 'app-schools-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + `
		.schools-help{color:#718096;line-height:1.75;margin:0 0 1rem}.schools-list{display:flex;flex-direction:column;gap:.7rem}.school-card{display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start;padding:.85rem;border:1px solid #e6eaf1;border-radius:11px;background:#fff}.school-card__fields{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.school-card__fields .cms-field{margin:0}.school-card__del{align-self:start;padding:.45rem .65rem;border:0;border-radius:8px;background:#fff1f3;color:#c24b67;cursor:pointer;font:inherit;font-weight:800}.school-card__del:hover{background:#ffe2e8}.schools-empty{padding:1.5rem;text-align:center;color:#8993a8;border:1px dashed #dfe4ed;border-radius:11px}.schools-count{color:#8993a8;font-size:.78rem;font-weight:700}
		.schools-table-filters{display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:.6rem;margin:0 0 1rem;padding:.75rem;border:1px solid #e6eaf1;border-radius:11px;background:#f8faff}.schools-table-filters .cms-field{margin:0}.schools-table-filters .cms-label{font-size:.72rem}.schools-table-filters__clear{align-self:end;min-height:38px;padding:.45rem .8rem;border:1px solid #d9d3ff;border-radius:8px;color:#6241df;background:#f4f1ff;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}@media(max-width:900px){.schools-table-filters{grid-template-columns:1fr 1fr}}@media(max-width:520px){.schools-table-filters{grid-template-columns:1fr}}
		@media(max-width:700px){.school-card__fields{grid-template-columns:1fr}}
	`],
	template: `
		<div class="cms-form schools-cms-form" *ngIf="content">
			<div class="cms-section">
				<div class="cms-section-title"><span>دليل المدارس والمعاهد</span><span class="schools-count">{{ items.length }} مؤسسة</span></div>
				<p class="schools-help">أضف المدرسة أو المعهد من هنا، وحدد التصنيف المناسب ليظهر تلقائيًا في صفحة المدارس مع الفلترة الصحيحة.</p>
				<div class="cms-row">
					<label class="cms-field"><span class="cms-label">اسم الصفحة</span><input class="cms-input" [(ngModel)]="content.title" placeholder="المدارس والمعاهد"></label>
					<label class="cms-field"><span class="cms-label">حالة الصفحة</span><select class="cms-select" [(ngModel)]="content.visible"><option [ngValue]="true">ظاهرة للطلاب</option><option [ngValue]="false">مخفية</option></select></label>
				</div>
			</div>

			<div class="cms-section">
				<div class="cms-section-title">إضافة مدرسة أو معهد</div>
				<div class="cms-row-3">
					<label class="cms-field"><span class="cms-label">الاسم *</span><input class="cms-input" [(ngModel)]="draft.name" placeholder="مثال: مدرسة النيل الصناعية"></label>
					<label class="cms-field"><span class="cms-label">النوع</span><select class="cms-select" [(ngModel)]="draft.type"><option value="مدرسة صناعية">مدرسة صناعية</option><option value="مدرسة تكنولوجية">مدرسة تكنولوجية</option><option value="معهد فني">معهد فني</option></select></label>
					<label class="cms-field"><span class="cms-label">التصنيف *</span><select class="cms-select" [(ngModel)]="draft.category"><option value="" disabled>اختر التصنيف</option><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
					<label class="cms-field"><span class="cms-label">المعادلة *</span><select class="cms-select" [(ngModel)]="draft.program"><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></label>
				</div>
				<label class="cms-field"><span class="cms-label">رابط الصورة (اختياري)</span><input class="cms-input" [(ngModel)]="draft.logo" placeholder="/assets/schools/tech-school.png"><label class="cms-upload-btn">📤 {{ uploadingKey === 'draft' ? 'جاري الرفع...' : 'رفع صورة من الجهاز' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="uploadDraftImage($event)"></label></label>
			<button type="button" class="cms-button" (click)="addItem()">+ إضافة للمؤسسات</button>
			<p class="cms-error" *ngIf="errorMessage">{{ errorMessage }}</p>
			</div>

			<div class="cms-section schools-table-section">
				<div class="cms-section-title"><span>كل المدارس والمعاهد</span><span class="schools-count">{{ filteredItems.length }} من {{ items.length }} مؤسسة</span></div>
				<div class="schools-table-filters">
					<label class="cms-field"><span class="cms-label">بحث بالاسم</span><input class="cms-input" [(ngModel)]="tableSearch" placeholder="اكتب اسم المؤسسة"></label>
					<label class="cms-field"><span class="cms-label">النوع</span><select class="cms-select" [(ngModel)]="tableType"><option value="">كل الأنواع</option><option value="مدرسة صناعية">مدرسة صناعية</option><option value="مدرسة تكنولوجية">مدرسة تكنولوجية</option><option value="معهد فني">معهد فني</option></select></label>
					<label class="cms-field"><span class="cms-label">التصنيف</span><select class="cms-select" [(ngModel)]="tableCategory"><option value="">كل التصنيفات</option><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
					<label class="cms-field"><span class="cms-label">المعادلة</span><select class="cms-select" [(ngModel)]="tableProgram"><option value="">كل المعادلات</option><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></label>
					<button type="button" class="schools-table-filters__clear" (click)="clearTableFilters()">مسح الفلاتر</button>
				</div>
				<div class="schools-table-wrap" *ngIf="items.length; else emptyState">
					<table class="schools-table"><thead><tr><th>#</th><th>اسم المؤسسة</th><th>النوع</th><th>التصنيف</th><th>المعادلة</th><th>رابط الصورة</th><th>إجراء</th></tr></thead><tbody>
						<tr *ngFor="let item of filteredItems; let i = index"><td class="schools-table__index">{{ item.id }}</td><td><input class="cms-input" [(ngModel)]="item.name"></td><td><select class="cms-select" [(ngModel)]="item.type"><option value="مدرسة صناعية">مدرسة صناعية</option><option value="مدرسة تكنولوجية">مدرسة تكنولوجية</option><option value="معهد فني">معهد فني</option></select></td><td><select class="cms-select" [(ngModel)]="item.category"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></td><td><select class="cms-select" [ngModel]="programSelection(item)" (ngModelChange)="setProgram(item, $event)"><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></td><td><input class="cms-input" [(ngModel)]="item.logo" dir="ltr"><label class="cms-upload-btn">📤 {{ uploadingKey === 'item-' + i ? 'جاري الرفع...' : 'رفع صورة' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="uploadItemImage(item, i, $event)"></label></td><td><button type="button" class="school-card__del" (click)="removeItem(items.indexOf(item))" aria-label="حذف المؤسسة">حذف</button></td></tr>
					</tbody></table>
				</div>
				<ng-template #emptyState><div class="schools-empty">لا توجد مؤسسات محفوظة حاليًا.</div></ng-template>
			</div>
		</div>
	`
})
export class SchoolsFormComponent implements OnChanges {
	@Input() content: any;
	private readonly cms = inject(MonthlyContentService);
	readonly categories = ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجية نظام 3 سنوات', 'مدارس تكنولوجية نظام 5 سنوات'];
	readonly programOptions = [{ value: 'engineering', label: 'هندسة' }, { value: 'computers', label: 'حاسبات' }, { value: 'both', label: 'هندسة وحاسبات' }] as const;
	items: SchoolItem[] = [];
	draft: Partial<SchoolItem> & { program?: 'engineering' | 'computers' | 'both' } = this.emptyDraft();
	errorMessage = '';
	uploadingKey: string | null = null;
	tableSearch = '';
	tableType = '';
	tableCategory = '';
	tableProgram = '';

	get filteredItems(): SchoolItem[] {
		const search = this.tableSearch.trim().toLowerCase();
		return this.items.filter(item => {
			const matchesSearch = !search || item.name.toLowerCase().includes(search);
			const matchesType = !this.tableType || item.type === this.tableType;
			const matchesCategory = !this.tableCategory || item.category === this.tableCategory;
			const matchesProgram = !this.tableProgram || item.programs.includes(this.tableProgram as 'engineering' | 'computers');
			return matchesSearch && matchesType && matchesCategory && matchesProgram;
		});
	}

	ngOnChanges(): void {
		if (!this.content || typeof this.content !== 'object') return;
		if (!Array.isArray(this.content.items) || !this.content.items.length) this.content.items = DEFAULT_SCHOOLS.map((item, index) => ({ ...item, id: item.id ?? index + 1 }));
		this.items = this.content.items.map((item: any) => ({ ...item, programs: Array.isArray(item.programs) && item.programs.length ? item.programs : ['engineering'] }));
		this.content.items = this.items;
		this.draft = this.emptyDraft();
	}

	addItem(): void {
		const name = String(this.draft.name || '').trim();
		if (!name) { this.errorMessage = 'اكتب اسم المدرسة أو المعهد أولًا.'; return; }
		if (!this.draft.category) { this.errorMessage = 'اختار تصنيف المؤسسة أولًا.'; return; }
		const nextId = this.items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
		this.items.push({ id: nextId, name, type: this.draft.type || 'مدرسة صناعية', category: this.draft.category, logo: this.draft.logo || '/assets/schools/tech-school.png', programs: this.programsFromSelection(this.draft.program || 'engineering') });
		this.content.items = this.items;
		this.errorMessage = '';
		this.draft = this.emptyDraft();
	}

	removeItem(index: number): void { this.items.splice(index, 1); }
	clearTableFilters(): void { this.tableSearch = ''; this.tableType = ''; this.tableCategory = ''; this.tableProgram = ''; }
	programSelection(item: SchoolItem): 'engineering' | 'computers' | 'both' { return item.programs.includes('engineering') && item.programs.includes('computers') ? 'both' : item.programs.includes('computers') ? 'computers' : 'engineering'; }
	setProgram(item: SchoolItem, value: 'engineering' | 'computers' | 'both'): void { item.programs = this.programsFromSelection(value); }

	uploadDraftImage(event: Event): void { this.uploadImage(event, 'draft'); }
	uploadItemImage(item: SchoolItem, index: number, event: Event): void { this.uploadImage(event, 'item-' + index, item); }

	private uploadImage(event: Event, key: string, item?: SchoolItem): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (!file) return;
		const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
		if (!allowedTypes.has(file.type) || file.size > 8 * 1024 * 1024) {
			this.errorMessage = !allowedTypes.has(file.type) ? 'نوع الملف غير مدعوم. ارفع JPG أو PNG أو WEBP أو GIF.' : 'حجم الصورة أكبر من 8 ميجابايت.';
			return;
		}
		this.errorMessage = '';
		this.uploadingKey = key;
		this.cms.uploadImage(file, 'schools').subscribe({
			next: url => { if (item) item.logo = url; else this.draft.logo = url; this.uploadingKey = null; },
			error: error => { this.uploadingKey = null; this.errorMessage = error?.error?.message || 'تعذر رفع الصورة. حاول مرة أخرى.'; }
		});
	}

	private programsFromSelection(value: 'engineering' | 'computers' | 'both'): Array<'engineering' | 'computers'> { return value === 'both' ? ['engineering', 'computers'] : [value]; }
	private emptyDraft(): Partial<SchoolItem> & { program: 'engineering' } { return { name: '', type: 'مدرسة صناعية', category: 'مدارس الثانوية الصناعية نظام 3 سنوات', logo: '/assets/schools/tech-school.png', program: 'engineering' }; }
}
