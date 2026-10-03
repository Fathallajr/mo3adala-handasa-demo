import { Component, EventEmitter, HostListener, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { DEFAULT_SCHOOLS } from '../../../core/schools.defaults';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

interface SchoolItem {
	id: number;
	name: string;	type: string;	category: string;	logo: string;	programs: Array<'engineering' | 'computers'>;
}
type SchoolPaginationItem = number | '…';

@Component({
	selector: 'app-schools-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + `
		.schools-help{color:#718096;line-height:1.75;margin:0 0 1rem}.schools-list{display:flex;flex-direction:column;gap:.7rem}.school-card{display:grid;grid-template-columns:1fr auto;gap:.75rem;align-items:start;padding:.85rem;border:1px solid #e6eaf1;border-radius:11px;background:#fff}.school-card__fields{display:grid;grid-template-columns:1fr 1fr;gap:.65rem}.school-card__fields .cms-field{margin:0}.school-card__del{align-self:start;padding:.45rem .65rem;border:0;border-radius:8px;background:#fff1f3;color:#c24b67;cursor:pointer;font:inherit;font-weight:800}.school-card__del:hover{background:#ffe2e8}.schools-empty{padding:1.5rem;text-align:center;color:#8993a8;border:1px dashed #dfe4ed;border-radius:11px}.schools-count{color:#8993a8;font-size:.78rem;font-weight:700}
		.schools-table-filters{display:grid;grid-template-columns:2fr repeat(3,1fr) auto;gap:.6rem;margin:0 0 1rem;padding:.75rem;border:1px solid #e6eaf1;border-radius:11px;background:#f8faff}.schools-table-filters .cms-field{margin:0}.schools-table-filters .cms-label{font-size:.72rem}.schools-table-filters__clear{align-self:end;min-height:38px;padding:.45rem .8rem;border:1px solid #d9d3ff;border-radius:8px;color:#6241df;background:#f4f1ff;font:inherit;font-size:.78rem;font-weight:800;cursor:pointer}@media(max-width:900px){.schools-table-filters{grid-template-columns:1fr 1fr}}@media(max-width:520px){.schools-table-filters{grid-template-columns:1fr}}
		.schools-actions-cell{position:relative;white-space:nowrap}.school-actions-trigger{width:32px;height:30px;border:1px solid #cfc5ff;border-radius:8px;color:#6241df;background:#f4f1ff;font-size:20px;line-height:1;cursor:pointer}.school-actions-menu{position:absolute;z-index:5;top:calc(100% + 4px);right:0;display:grid;min-width:100px;padding:4px;border:1px solid #e2e5ee;border-radius:9px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.16)}.school-actions-menu button{padding:8px;border:0;border-radius:6px;background:transparent;color:#526078;font:inherit;font-size:11px;font-weight:800;text-align:right;cursor:pointer}.school-actions-menu button:hover{background:#f4f1ff;color:#6241df}.school-actions-menu button:last-child{color:#c33f5d}.school-modal-backdrop{position:fixed;z-index:40;inset:0;display:grid;place-items:center;padding:20px;background:rgba(15,23,42,.45)}.school-modal{width:min(520px,100%);max-height:90vh;overflow:auto;padding:22px;border:1px solid #e2e5ee;border-radius:18px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28)}.school-modal-close{border:0;background:transparent;color:#64748b;font-size:25px;cursor:pointer}.school-modal-actions{display:flex;justify-content:flex-start;gap:8px;margin-top:15px}.school-delete-modal p{color:#526078;line-height:1.8}
		.schools-local-save{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-top:.85rem;padding:.7rem .8rem;border:1px solid #d8ceff;border-radius:10px;background:#faf8ff;color:#5d4aaf;font-size:.72rem;font-weight:900}.schools-local-save .cms-button{margin:0;white-space:nowrap}
		.schools-table-section{position:relative}.school-actions-popover{position:fixed!important;z-index:10000;top:var(--school-actions-top,1.5rem);right:auto;left:var(--school-actions-left,1rem);display:grid;width:max-content;min-width:120px;max-width:calc(100vw - 20px);box-sizing:border-box;padding:5px;gap:3px;border:1px solid #d9d3ff;border-radius:10px;background:#fff;box-shadow:0 12px 28px rgba(15,23,42,.16);font-size:11px;isolation:isolate}.school-actions-popover button{padding:8px 9px;border:0;border-radius:7px;color:#6241df;background:#f4f1ff;font:inherit;font-weight:800;text-align:right;white-space:nowrap;cursor:pointer}.school-actions-popover__delete{color:#c33f5d!important;background:#fff0f3!important}
		.schools-logo-cell{width:110px;text-align:center}.schools-logo-cell img{display:block;width:54px;height:54px;margin:auto;border:1px solid #e5e9f2;border-radius:12px;background:#fff;object-fit:contain;padding:5px}
		.schools-name-cell{width:220px;max-width:220px;white-space:normal;line-height:1.5}.schools-name-cell>span{display:block;overflow-wrap:anywhere}.school-name-more{margin-top:4px;padding:0;border:0;color:#6241df;background:transparent;font:inherit;font-size:.72rem;font-weight:800;cursor:pointer}.school-name-more:hover{text-decoration:underline}
		.schools-table{width:100%;table-layout:fixed}.schools-table th:nth-child(1),.schools-table td:nth-child(1){width:42px}.schools-table th:nth-child(2),.schools-table td:nth-child(2){width:30%}.schools-table th:nth-child(3),.schools-table td:nth-child(3){width:20%;white-space:normal;line-height:1.45}.schools-table th:nth-child(4),.schools-table td:nth-child(4){width:11%;white-space:normal;line-height:1.45}.schools-table th:nth-child(5),.schools-table td:nth-child(5){width:100px}.schools-table th:nth-child(6),.schools-table td:nth-child(6){width:70px}
		.schools-pagination{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;padding:10px 0;color:#8993a8;font-size:.78rem}.schools-pagination__pages{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:center}.schools-pagination__button,.schools-pagination__page{min-height:34px;padding:7px 11px;border:1px solid #e1e6f0;border-radius:9px;color:#59647b;background:#fff;font:inherit;font-weight:800;cursor:pointer}.schools-pagination__page{min-width:34px;padding:0 8px}.schools-pagination__page.is-active{border-color:#6d4aff;color:#fff;background:#6d4aff;box-shadow:0 5px 14px #6d4aff2b}.schools-pagination__page.is-ellipsis{min-width:20px;padding:0 2px;border-color:transparent;color:#8993a8;background:transparent;box-shadow:none;cursor:default}.schools-pagination__button:disabled,.schools-pagination__page:disabled{opacity:.5;cursor:not-allowed}.schools-pagination__summary{white-space:nowrap}@media(max-width:520px){.schools-pagination{gap:6px;font-size:.68rem}.schools-pagination__button{padding:6px 8px}.schools-pagination__page{min-width:30px}}
		@media(max-width:700px){.school-card__fields{grid-template-columns:1fr}.schools-local-save{align-items:stretch;flex-direction:column}.schools-local-save .cms-button{width:100%}}
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
					<label class="cms-field"><span class="cms-label">النوع *</span><select class="cms-select" [(ngModel)]="draft.type"><option value="" disabled>اختر النوع</option><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
					<label class="cms-field"><span class="cms-label">المعادلة *</span><select class="cms-select" [(ngModel)]="draft.program"><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></label>
				</div>
				<label class="cms-field"><span class="cms-label">رابط الصورة (اختياري)</span><input class="cms-input" [(ngModel)]="draft.logo" placeholder="/assets/schools/tech-school.png"><label class="cms-upload-btn">📤 {{ uploadingKey === 'draft' ? 'جاري الرفع...' : 'رفع صورة من الجهاز' }}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="uploadDraftImage($event)"></label></label>
			<button type="button" class="cms-button" (click)="addItem()">+ إضافة للمؤسسات</button>
			<div class="schools-local-save" *ngIf="hasPendingChanges"><span>تم تعديل بيانات المدارس</span><button type="button" class="cms-button" (click)="requestSave()">حفظ التعديلات على السيرفر</button></div>
			<p class="cms-error" *ngIf="errorMessage">{{ errorMessage }}</p>
			</div>

			<div class="cms-section schools-table-section">
				<div class="cms-section-title"><span>كل المدارس والمعاهد</span><span class="schools-count">{{ filteredItems.length }} من {{ items.length }} مؤسسة</span></div>
				<div class="schools-table-filters">
					<label class="cms-field"><span class="cms-label">بحث بالاسم</span><input class="cms-input" [(ngModel)]="tableSearch" placeholder="اكتب اسم المؤسسة"></label>
					<label class="cms-field"><span class="cms-label">النوع</span><select class="cms-select" [(ngModel)]="tableType"><option value="">كل الأنواع</option><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
					<label class="cms-field"><span class="cms-label">المعادلة</span><select class="cms-select" [(ngModel)]="tableProgram"><option value="">كل المعادلات</option><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></label>
					<button type="button" class="schools-table-filters__clear" (click)="clearTableFilters()">مسح الفلاتر</button>
				</div>
				<div class="schools-table-wrap" *ngIf="items.length; else emptyState">
					<table class="schools-table"><thead><tr><th>#</th><th>اسم المؤسسة</th><th>النوع</th><th>المعادلة</th><th>الصورة</th><th>إجراء</th></tr></thead><tbody>
		<tr *ngFor="let item of paginatedItems"><td class="schools-table__index">{{ item.id }}</td><td class="schools-name-cell"><span>{{ schoolNamePreview(item) }}</span><button *ngIf="hasLongSchoolName(item.name)" type="button" class="school-name-more" (click)="toggleSchoolName(item)">{{ schoolNameToggleLabel(item) }}</button></td><td>{{ item.type }}</td><td>{{ programSelection(item) === 'both' ? 'هندسة وحاسبات' : (programSelection(item) === 'computers' ? 'حاسبات' : 'هندسة') }}</td><td class="schools-logo-cell"><img [src]="schoolLogoUrl(item.logo)" (error)="handleSchoolLogoError($event)" [alt]="item.name" loading="lazy"></td><td class="schools-actions-cell"><button type="button" class="school-actions-trigger" (click)="toggleItemActions(item, $event)" aria-label="إجراءات المؤسسة">⋮</button></td></tr>
					</tbody></table>
				</div>
				<nav class="schools-pagination" *ngIf="schoolsPages > 1" aria-label="صفحات المدارس والمعاهد"><button type="button" class="schools-pagination__button" (click)="goToSchoolPage(currentSchoolsPage - 1)" [disabled]="currentSchoolsPage <= 1">السابق</button><div class="schools-pagination__pages"><button type="button" class="schools-pagination__page" *ngFor="let page of schoolPageNumbers" [class.is-active]="page === currentSchoolsPage" [class.is-ellipsis]="page === '…'" [disabled]="page === '…'" [attr.aria-label]="page === '…' ? 'فاصل' : 'الصفحة ' + page" (click)="goToSchoolPage(page)">{{ page }}</button></div><span class="schools-pagination__summary">صفحة {{ currentSchoolsPage }} من {{ schoolsPages }}</span><button type="button" class="schools-pagination__button" (click)="goToSchoolPage(currentSchoolsPage + 1)" [disabled]="currentSchoolsPage >= schoolsPages">التالي</button></nav>
				<div class="school-actions-popover" *ngIf="openItem">
					<button type="button" (click)="startEdit(openItem)">✏️ تعديل</button>
					<button type="button" class="school-actions-popover__delete" (click)="confirmDelete(openItem)">🗑️ حذف</button>
				</div>
				<ng-template #emptyState><div class="schools-empty">لا توجد مؤسسات محفوظة حاليًا.</div></ng-template>
				<div class="schools-local-save" *ngIf="hasPendingChanges"><span>توجد تعديلات لم تُحفظ بعد</span><button type="button" class="cms-button" (click)="requestSave()">حفظ التعديلات على السيرفر</button></div>
			</div>
			<div class="school-modal-backdrop" *ngIf="editDraft" (click)="cancelEdit()">
				<div class="school-modal" (click)="$event.stopPropagation()">
					<div class="cms-section-title"><span>تعديل المؤسسة</span><button type="button" class="school-modal-close" (click)="cancelEdit()">×</button></div>
					<label class="cms-field"><span class="cms-label">اسم المؤسسة</span><input class="cms-input" [(ngModel)]="editDraft.name"></label>
					<label class="cms-field"><span class="cms-label">النوع</span><select class="cms-select" [(ngModel)]="editDraft.type" (ngModelChange)="editDraft.category = $event"><option *ngFor="let category of categories" [value]="category">{{ category }}</option></select></label>
					<label class="cms-field"><span class="cms-label">المعادلة</span><select class="cms-select" [ngModel]="programSelection(editDraft)" (ngModelChange)="setProgram(editDraft, $event)"><option *ngFor="let program of programOptions" [value]="program.value">{{ program.label }}</option></select></label>
					<label class="cms-field"><span class="cms-label">رابط الصورة</span><input class="cms-input" [(ngModel)]="editDraft.logo" dir="ltr"><label class="cms-upload-btn">📤 رفع صورة من الجهاز<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden (change)="uploadEditImage($event)"></label></label>
					<div class="school-modal-actions"><button type="button" class="cms-button" (click)="saveEdit()">حفظ التعديل</button><button type="button" class="schools-table-filters__clear" (click)="cancelEdit()">إلغاء</button></div>
				</div>
			</div>
			<div class="school-modal-backdrop" *ngIf="pendingDeleteItem" (click)="cancelDelete()"><div class="school-modal school-delete-modal" (click)="$event.stopPropagation()"><div class="cms-section-title">تأكيد الحذف</div><p>هل تريد حذف «{{ pendingDeleteItem.name }}»؟</p><div class="school-modal-actions"><button type="button" class="school-card__del" (click)="deleteItem()">حذف</button><button type="button" class="schools-table-filters__clear" (click)="cancelDelete()">إلغاء</button></div></div></div>
		</div>
	`
})
export class SchoolsFormComponent implements OnChanges {
	@Input() content: any;
	@Input() saveVersion = 0;
	@Output() saveRequested = new EventEmitter<void>();
	private readonly cms = inject(MonthlyContentService);
	readonly categories = ['المعاهد الفنية', 'مدارس الثانوية الصناعية نظام 3 سنوات', 'مدارس الثانوية الصناعية نظام 5 سنوات', 'مدارس تكنولوجية نظام 3 سنوات', 'مدارس تكنولوجية نظام 5 سنوات'];
	readonly programOptions = [{ value: 'engineering', label: 'هندسة' }, { value: 'computers', label: 'حاسبات' }] as const;
	items: SchoolItem[] = [];
	readonly expandedSchoolNames = new Set<number>();
	draft: Partial<SchoolItem> & { program?: 'engineering' | 'computers' | 'both' } = this.emptyDraft();
	errorMessage = '';
	uploadingKey: string | null = null;
	openItemActionId: number | null = null;
	editingItem: SchoolItem | null = null;
	editDraft: SchoolItem | null = null;
	pendingDeleteItem: SchoolItem | null = null;
	tableSearch = '';
	tableType = '';
	tableProgram = '';
	schoolsPage = 1;
	readonly schoolsPageSize = 10;
	hasPendingChanges = false;
	private lastSaveVersion = 0;

	get filteredItems(): SchoolItem[] {
		const search = this.tableSearch.trim().toLowerCase();
		return this.items.filter(item => {
			const matchesSearch = !search || item.name.toLowerCase().includes(search);
			const matchesType = !this.tableType || item.category === this.tableType || item.type === this.tableType;
			const matchesProgram = !this.tableProgram || item.programs.includes(this.tableProgram as 'engineering' | 'computers');
			return matchesSearch && matchesType && matchesProgram;
		});
	}
	get schoolsPages(): number { return Math.max(1, Math.ceil(this.filteredItems.length / this.schoolsPageSize)); }
	get currentSchoolsPage(): number { return Math.min(this.schoolsPage, this.schoolsPages); }
	get schoolPageNumbers(): SchoolPaginationItem[] { return this.buildSchoolPaginationItems(this.currentSchoolsPage, this.schoolsPages); }
	get paginatedItems(): SchoolItem[] {
		const start = (this.currentSchoolsPage - 1) * this.schoolsPageSize;
		return this.filteredItems.slice(start, start + this.schoolsPageSize);
	}
	get openItem(): SchoolItem | null { return this.items.find(item => item.id === this.openItemActionId) || null; }

	ngOnChanges(): void {
		if (this.saveVersion !== this.lastSaveVersion) {
			this.lastSaveVersion = this.saveVersion;
			this.hasPendingChanges = false;
		}
		if (!this.content || typeof this.content !== 'object') return;
		if (!Array.isArray(this.content.items) || !this.content.items.length) this.content.items = DEFAULT_SCHOOLS.map((item, index) => ({ ...item, id: item.id ?? index + 1 }));
		this.items = this.content.items.map((item: any) => { const liveType = item.category || item.type || this.categories[0]; return { ...item, type: liveType, category: liveType, programs: Array.isArray(item.programs) && item.programs.length ? item.programs : ['engineering'] }; });
		this.content.items = this.items;
		this.draft = this.emptyDraft();
	}

	addItem(): void {
		const name = String(this.draft.name || '').trim();
		if (!name) { this.errorMessage = 'اكتب اسم المدرسة أو المعهد أولًا.'; return; }
		if (!this.draft.type) { this.errorMessage = 'اختار نوع المؤسسة أولًا.'; return; }
		const nextId = this.items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
		this.items.push({ id: nextId, name, type: this.draft.type, category: this.draft.type, logo: this.draft.logo || '/assets/schools/tech-school.png', programs: this.programsFromSelection(this.draft.program || 'engineering') });
		this.content.items = this.items;
		this.errorMessage = '';
		this.draft = this.emptyDraft();
		this.hasPendingChanges = true;
	}

	removeItem(index: number): void { this.items.splice(index, 1); this.content.items = this.items; this.hasPendingChanges = true; }
	toggleItemActions(item: SchoolItem, event?: MouseEvent): void {
		const shouldOpen = this.openItemActionId !== item.id;
		this.openItemActionId = shouldOpen ? item.id : null;
		if (!shouldOpen) return;
		const trigger = event?.currentTarget as HTMLElement | null;
		const section = trigger?.closest('.schools-table-section') as HTMLElement | null;
		if (!trigger || !section) return;
		const triggerRectAtClick = trigger.getBoundingClientRect();
		const applyPosition = (): void => {
			const triggerRect = trigger.isConnected ? trigger.getBoundingClientRect() : triggerRectAtClick;
			const visualViewport = window.visualViewport;
			const viewportWidth = visualViewport?.width || document.documentElement.clientWidth || window.innerWidth;
			const viewportHeight = visualViewport?.height || document.documentElement.clientHeight || window.innerHeight;
			const edge = 10;
			const renderedMenu = document.querySelector('.school-actions-popover') as HTMLElement | null;
			if (renderedMenu && renderedMenu.parentElement !== document.body) document.body.appendChild(renderedMenu);
			const renderedRect = renderedMenu?.getBoundingClientRect();
			const menuWidth = Math.min(renderedRect?.width || 130, Math.max(112, viewportWidth - edge * 2));
			const menuHeight = Math.min(renderedRect?.height || 82, Math.max(82, viewportHeight - edge * 2));
			const rawTop = triggerRect.top;
			const rawLeft = triggerRect.right + menuWidth + edge <= viewportWidth
				? triggerRect.right + 6
				: triggerRect.left - menuWidth - 6;
			const top = Math.min(Math.max(edge, rawTop), Math.max(edge, viewportHeight - menuHeight - edge));
			const left = Math.min(Math.max(edge, rawLeft), Math.max(edge, viewportWidth - menuWidth - edge));
			if (renderedMenu) {
				renderedMenu.style.top = `${top}px`;
				renderedMenu.style.left = `${left}px`;
			}
		};
		applyPosition();
		requestAnimationFrame(applyPosition);
		setTimeout(applyPosition, 0);
	}
	@HostListener('document:click', ['$event'])
	closeActionsOnOutsideClick(event: MouseEvent): void {
		const target = event.target as HTMLElement | null;
		if (target?.closest('.school-actions-trigger, .school-actions-popover')) return;
		if (this.openItemActionId === null) return;
		this.openItemActionId = null;
	}
	startEdit(item: SchoolItem): void { this.openItemActionId = null; this.editingItem = item; this.editDraft = { ...item, programs: [...item.programs] }; }
	cancelEdit(): void { this.editingItem = null; this.editDraft = null; }
	saveEdit(): void { if (!this.editingItem || !this.editDraft) return; Object.assign(this.editingItem, this.editDraft, { category: this.editDraft.type }); this.cancelEdit(); this.content.items = this.items; this.hasPendingChanges = true; }
	confirmDelete(item: SchoolItem): void { this.openItemActionId = null; this.pendingDeleteItem = item; }
	cancelDelete(): void { this.pendingDeleteItem = null; }
	deleteItem(): void { if (!this.pendingDeleteItem) return; this.items = this.items.filter(item => item.id !== this.pendingDeleteItem?.id); this.content.items = this.items; this.pendingDeleteItem = null; this.hasPendingChanges = true; }
	clearTableFilters(): void { this.tableSearch = ''; this.tableType = ''; this.tableProgram = ''; }
	buildSchoolPaginationItems(currentPage: number, totalPages: number): SchoolPaginationItem[] {
		if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
		const items: SchoolPaginationItem[] = [1];
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);
		if (start > 2) items.push('…');
		for (let page = start; page <= end; page++) items.push(page);
		if (end < totalPages - 1) items.push('…');
		items.push(totalPages);
		return items;
	}
	goToSchoolPage(page: number | string): void {
		if (typeof page !== 'number') return;
		this.schoolsPage = Math.min(Math.max(1, page), this.schoolsPages);
		this.openItemActionId = null;
	}
	schoolLogoUrl(logo: string): string { const value = String(logo || '').trim(); if (!value) return '/assets/logo.webp'; return /^https?:\/\//i.test(value) || value.startsWith('/') ? value : `/${value}`; }
	handleSchoolLogoError(event: Event): void { const image = event.target as HTMLImageElement; if (!image.dataset['fallback']) { image.dataset['fallback'] = 'true'; image.src = '/assets/logo.webp'; } }
	hasLongSchoolName(name: string): boolean { return String(name || '').trim().split(/\s+/).filter(Boolean).length > 5; }
	schoolNamePreview(item: SchoolItem): string { const words = String(item.name || '').trim().split(/\s+/).filter(Boolean); return this.expandedSchoolNames.has(item.id) || words.length <= 5 ? words.join(' ') : `${words.slice(0, 5).join(' ')}…`; }
	schoolNameToggleLabel(item: SchoolItem): string { return this.expandedSchoolNames.has(item.id) ? 'عرض أقل' : 'عرض المزيد'; }
	toggleSchoolName(item: SchoolItem): void { if (this.expandedSchoolNames.has(item.id)) this.expandedSchoolNames.delete(item.id); else this.expandedSchoolNames.add(item.id); }
	requestSave(): void { this.saveRequested.emit(); }
	programSelection(item: SchoolItem): 'engineering' | 'computers' | 'both' { return item.programs.includes('engineering') && item.programs.includes('computers') ? 'both' : item.programs.includes('computers') ? 'computers' : 'engineering'; }
	setProgram(item: SchoolItem, value: 'engineering' | 'computers' | 'both'): void { item.programs = this.programsFromSelection(value); this.hasPendingChanges = true; }

	uploadDraftImage(event: Event): void { this.uploadImage(event, 'draft'); }
	uploadItemImage(item: SchoolItem, index: number, event: Event): void { this.uploadImage(event, 'item-' + index, item); }
	uploadEditImage(event: Event): void { if (this.editDraft) this.uploadImage(event, 'edit', this.editDraft); }

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
			next: url => { if (item) item.logo = url; else this.draft.logo = url; this.hasPendingChanges = true; this.uploadingKey = null; },
			error: error => { this.uploadingKey = null; this.errorMessage = error?.error?.message || 'تعذر رفع الصورة. حاول مرة أخرى.'; }
		});
	}

	private programsFromSelection(value: 'engineering' | 'computers' | 'both'): Array<'engineering' | 'computers'> { return value === 'both' ? ['engineering', 'computers'] : [value]; }
	private emptyDraft(): Partial<SchoolItem> & { program: 'engineering' } { return { name: '', type: this.categories[0], category: this.categories[0], logo: '/assets/schools/tech-school.png', program: 'engineering' }; }
}
