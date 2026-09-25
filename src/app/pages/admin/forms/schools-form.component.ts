import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

interface SchoolItem {
	id: number;
	name: string;	type: string;	category: string;	logo: string;
}

@Component({
	selector: 'app-schools-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + `
		.schools-help{color:#718096;line-height:1.75;margin:0 0 1rem}.schools-list{display:flex;flex-direction:column;gap:.7rem}.school-card{display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start;padding:.85rem;border:1px solid #e6eaf1;border-radius:11px;background:#fff}.school-card__fields{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.school-card__fields .cms-field{margin:0}.school-card__del{align-self:start;padding:.45rem .65rem;border:0;border-radius:8px;background:#fff1f3;color:#c24b67;cursor:pointer;font:inherit;font-weight:800}.school-card__del:hover{background:#ffe2e8}.schools-empty{padding:1.5rem;text-align:center;color:#8993a8;border:1px dashed #dfe4ed;border-radius:11px}.schools-count{color:#8993a8;font-size:.78rem;font-weight:700}
		@media(max-width:700px){.school-card__fields{grid-template-columns:1fr}}
	`],
	template: `
		<div class="cms-form" *ngIf="content">
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
				</div>
				<label class="cms-field"><span class="cms-label">رابط الصورة (اختياري)</span><input class="cms-input" [(ngModel)]="draft.logo" placeholder="/assets/schools/tech-school.png"></label>
			<button type="button" class="cms-button" (click)="addItem()">+ إضافة للمؤسسات</button>
			<p class="cms-error" *ngIf="errorMessage">{{ errorMessage }}</p>
			</div>

			<div class="cms-section">
				<div class="cms-section-title">المؤسسات المضافة</div>
				<div class="schools-list" *ngIf="items.length; else emptyState">
					<div class="school-card" *ngFor="let item of items; let i = index">
						<div class="school-card__fields">
							<label class="cms-field"><span class="cms-label">اسم المؤسسة</span><input class="cms-input" [(ngModel)]="item.name"></label>
							<label class="cms-field"><span class="cms-label">النوع</span><select class="cms-select" [(ngModel)]="item.type"><option value="مدرسة صناعية">مدرسة صناعية</option><option value="مدرسة تكنولوجية">مدرسة تكنولوجية</option><option value="معهد فني">معهد فني</option></select></label>
							<label class="cms-field"><span class="cms-label">التصنيف</span><select class="cms-select" [(ngModel)]="item.category"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
							<label class="cms-field"><span class="cms-label">رابط الصورة</span><input class="cms-input" [(ngModel)]="item.logo"></label>
						</div>
						<button type="button" class="school-card__del" (click)="removeItem(i)">حذف</button>
					</div>
				</div>
				<ng-template #emptyState><div class="schools-empty">لا توجد مؤسسات محفوظة حاليًا.</div></ng-template>
			</div>
		</div>
	`
})
export class SchoolsFormComponent implements OnChanges {
	@Input() content: any;
	readonly categories = ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجية نظام 3 سنوات', 'مدارس تكنولوجية نظام 5 سنوات'];
	items: SchoolItem[] = [];
	draft: Partial<SchoolItem> = this.emptyDraft();
	errorMessage = '';

	ngOnChanges(): void {
		if (!this.content || typeof this.content !== 'object') return;
		if (!Array.isArray(this.content.items)) this.content.items = [];
		this.items = this.content.items;
		this.draft = this.emptyDraft();
	}

	addItem(): void {
		const name = String(this.draft.name || '').trim();
		if (!name) { this.errorMessage = 'اكتب اسم المدرسة أو المعهد أولًا.'; return; }
		if (!this.draft.category) { this.errorMessage = 'اختار تصنيف المؤسسة أولًا.'; return; }
		const nextId = this.items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
		this.items.push({ id: nextId, name, type: this.draft.type || 'مدرسة صناعية', category: this.draft.category, logo: this.draft.logo || '/assets/schools/tech-school.png' });
		this.errorMessage = '';
		this.draft = this.emptyDraft();
	}

	removeItem(index: number): void { this.items.splice(index, 1); }

	private emptyDraft(): Partial<SchoolItem> { return { name: '', type: 'مدرسة صناعية', category: '', logo: '/assets/schools/tech-school.png' }; }
}
