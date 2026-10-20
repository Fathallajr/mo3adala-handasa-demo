import { Component, EventEmitter, Input, OnChanges, Output, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

export interface NewsItem {
	title: string;
	description: string;
	image: string;
	link: string;
	blocks?: NewsBlock[];
}

export interface NewsBlock {
	type: 'text' | 'link' | 'image';
	text: string;
	url: string;
	alt: string;
	color?: string;
	fontSize?: string;
	align?: 'right' | 'center' | 'left';
	bold?: boolean;
	italic?: boolean;
}

interface NewsContent {
	visible: boolean;
	title: string;
	items: NewsItem[];
}

@Component({
	selector: 'app-news-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles, `
		.news-item-preview { display:grid; gap:12px; min-width:0; padding:14px; border:1px solid #e5e9f2; border-radius:14px; background:#fbfcff; }
		.news-items-section__head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
		.news-items-section__head .cms-add-btn { margin:0; }
		.news-item-preview__body { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; min-width:0; }
		.news-item-preview__body strong { display:block; color:#172033; font-size:15px; line-height:1.6; }
		.news-item-preview__body p { margin:5px 0 0; color:#718096; font-size:12px; line-height:1.8; white-space:pre-wrap; }
		.news-item-preview__body img { width:92px; height:68px; flex:0 0 auto; object-fit:cover; border-radius:10px; border:1px solid #e1e6f0; }
		.news-done-btn { align-self:flex-start; margin-top:12px; }
		.news-item-preview__actions { display:flex; gap:8px; flex-wrap:wrap; }
		.news-text-format { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; margin-top:10px; padding:10px; border:1px solid #e5e9f2; border-radius:10px; background:#f8f9fd; }
		.news-text-format label { display:grid; gap:5px; color:#65718b; font-size:10px; font-weight:800; }
		.news-text-format select,.news-text-format input[type=color] { width:100%; min-height:34px; box-sizing:border-box; border:1px solid #dfe4ed; border-radius:7px; padding:4px 7px; color:#263653; background:#fff; font:inherit; font-size:11px; }
		.news-text-format input[type=color] { padding:3px; cursor:pointer; }
		.news-text-format__check { display:flex!important; align-items:center; gap:7px!important; min-height:34px; padding-top:17px; }
		.news-text-format__check input { accent-color:#6d4aff; }
		.news-text-preview { margin-top:10px; padding:12px 14px; border:1px dashed #cfc5ff; border-radius:10px; background:#fff; white-space:pre-wrap; overflow-wrap:anywhere; line-height:1.8; }
		.news-text-preview__label { display:block; margin-bottom:6px; color:#7567b7; font-size:10px; font-weight:900; }
		@media (max-width:600px) { .news-items-section__head { align-items:stretch; flex-direction:column; } .news-items-section__head .cms-add-btn { width:100%; } .news-item-preview__body { flex-direction:column; gap:10px; } .news-item-preview__body img { width:100%; height:120px; } .news-item-preview .cms-button { width:100%; } .news-item-preview__actions { display:grid; grid-template-columns:1fr 1fr; } .news-item-preview__actions .cms-button { width:100%; } }
		@media (max-width:600px) { .news-text-format { grid-template-columns:1fr 1fr; } }
	`],
	template: `
<div class="cms-form news-cms-form" *ngIf="data">

	<div class="cms-section news-page-settings">
		<div class="cms-section-title">إعدادات الصفحة</div>
		<div class="cms-row">
			<div class="cms-field">
				<label class="cms-label">عنوان الصفحة</label>
				<input class="cms-input" [(ngModel)]="data.title" placeholder="أخبار الأبلكيشن" />
			</div>
			<div class="cms-field" style="justify-content:flex-end">
				<label class="cms-label">إظهار / إخفاء الصفحة</label>
				<div class="cms-toggle-wrap">
					<label class="cms-switch">
						<input type="checkbox" [(ngModel)]="data.visible" />
						<span class="cms-slider"></span>
					</label>
					<span class="cms-toggle-label">{{ data.visible ? 'ظاهرة' : 'مخفية' }}</span>
				</div>
			</div>
		</div>
	</div>

	<div class="cms-section news-items-section">
		<div class="cms-section-title news-items-section__head"><span>الأخبار ({{ data.items.length }})</span><button type="button" class="cms-add-btn" (click)="add()">+ إضافة خبر</button></div>
		<div class="cms-array-list">
			<div class="cms-array-item news-editor-item" *ngFor="let item of data.items; let i = index">
				<div style="flex:1" *ngIf="editingIndex === i">
					<div class="cms-array-item__num">خبر {{ i + 1 }}</div>
					<div class="cms-field">
						<label class="cms-label">العنوان</label>
						<input class="cms-input" [(ngModel)]="item.title" (ngModelChange)="onTitleChange(item, i)" placeholder="عنوان الخبر" />
					</div>
					<div class="cms-field">
						<label class="cms-label">الوصف</label>
						<textarea class="cms-textarea" [(ngModel)]="item.description" placeholder="وصف مختصر للخبر" rows="2"></textarea>
					</div>
					<div class="cms-field">
						<label class="cms-label">محتوى صفحة التفاصيل</label>
						<div class="cms-array-list">
							<div class="cms-array-item" *ngFor="let block of item.blocks; let blockIndex = index">
								<div>
									<div class="cms-row">
										<select class="cms-select" [(ngModel)]="block.type">
											<option value="text">نص</option>
											<option value="link">رابط</option>
											<option value="image">صورة</option>
										</select>
										<input *ngIf="block.type !== 'image'" class="cms-input" [(ngModel)]="block.text" [placeholder]="block.type === 'link' ? 'النص الظاهر للرابط' : 'اكتب النص'" />
									</div>
									<textarea *ngIf="block.type === 'text'" class="cms-textarea" [(ngModel)]="block.text" rows="4" placeholder="محتوى النص"></textarea>
									<div *ngIf="block.type === 'text'" class="news-text-format">
										<label>لون الخط<input type="color" [(ngModel)]="block.color" /></label>
										<label>حجم الخط<select [(ngModel)]="block.fontSize"><option value="14px">صغير</option><option value="16px">عادي</option><option value="18px">كبير</option><option value="22px">كبير جدًا</option></select></label>
										<label>المحاذاة<select [(ngModel)]="block.align"><option value="right">يمين</option><option value="center">وسط</option><option value="left">شمال</option></select></label>
										<label class="news-text-format__check"><input type="checkbox" [(ngModel)]="block.bold" /> عريض</label>
										<label class="news-text-format__check"><input type="checkbox" [(ngModel)]="block.italic" /> مائل</label>
									</div>
									<div *ngIf="block.type === 'text'" class="news-text-preview">
										<span class="news-text-preview__label">معاينة مباشرة</span>
										<div [style.color]="block.color || '#374151'" [style.font-size]="block.fontSize || '18px'" [style.text-align]="block.align || 'right'" [style.font-weight]="block.bold ? '800' : '400'" [style.font-style]="block.italic ? 'italic' : 'normal'">{{ block.text || 'اكتب النص لمشاهدة المعاينة...' }}</div>
									</div>
									<input *ngIf="block.type === 'link' || block.type === 'image'" class="cms-input" [(ngModel)]="block.url" dir="ltr" [placeholder]="block.type === 'link' ? 'https://...' : '/uploads/...'" />
									<input *ngIf="block.type === 'image'" class="cms-input" [(ngModel)]="block.alt" placeholder="وصف الصورة" />
									<div *ngIf="block.type === 'image'" class="cms-image-actions">
										<img *ngIf="block.url" [src]="resolveUrl(block.url)" class="cms-image-preview" alt="معاينة الصورة" />
										<label class="cms-upload-btn">📤 رفع صورة<input type="file" accept="image/*" hidden (change)="onBlockFileChange($event, block)" /></label>
										<span *ngIf="uploadingBlock === block" class="cms-uploading">جاري الرفع...</span>
									</div>
								</div>
								<button type="button" class="cms-array-item__del" (click)="removeBlock(item, blockIndex)">×</button>
							</div>
						</div>
						<div class="cms-image-actions">
							<button type="button" class="cms-button cms-button--secondary" (click)="addBlock(item, 'text')">+ نص</button>
							<button type="button" class="cms-button cms-button--secondary" (click)="addBlock(item, 'link')">+ رابط</button>
							<button type="button" class="cms-button cms-button--secondary" (click)="addBlock(item, 'image')">+ صورة</button>
						</div>
					</div>
					<div class="cms-field">
						<label class="cms-label">صورة الخبر</label>
						<div class="cms-image-field">
							<img *ngIf="item.image" [src]="resolveUrl(item.image)" class="cms-image-preview" alt="صورة الخبر" />
							<div class="cms-image-actions">
								<input class="cms-input" [(ngModel)]="item.image" placeholder="رابط الصورة أو ارفع ملف" dir="ltr" style="flex:1" />
								<button type="button" class="cms-upload-btn" (click)="triggerUpload(i)">📤 رفع صورة</button>
								<span *ngIf="uploadingIndex === i" class="cms-uploading">جاري الرفع...</span>
							</div>
							<input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event, item)" />
						</div>
					</div>
					<div class="cms-field" style="margin-bottom:0">
						<label class="cms-label">رابط الخبر (يُولد تلقائيًا)</label>
						<input class="cms-input" [ngModel]="item.link" readonly dir="ltr" />
					</div>
					<button type="button" class="cms-button cms-button--secondary news-done-btn" (click)="finishEditing()">حفظ الخبر</button>
				</div>
				<div class="news-item-preview" *ngIf="editingIndex !== i">
					<div class="cms-array-item__num">خبر {{ i + 1 }}</div>
					<div class="news-item-preview__body">
						<div><strong>{{ item.title || 'خبر بدون عنوان' }}</strong><p>{{ item.description || 'لا يوجد وصف لهذا الخبر.' }}</p></div>
						<img *ngIf="item.image" [src]="resolveUrl(item.image)" [alt]="item.title || 'صورة الخبر'" />
					</div>
					<div class="news-item-preview__actions"><button type="button" class="cms-button cms-button--secondary" (click)="edit(i)">تعديل</button><button type="button" class="cms-button cms-button--danger" (click)="requestRemove(i)">حذف</button></div>
				</div>
			</div>
		</div>
	</div>
</div>
`
})
export class NewsFormComponent implements OnChanges {
	@Input() content: unknown;
	@Output() deleteRequested = new EventEmitter<NewsItem>();
	@Output() saveRequested = new EventEmitter<void>();
	@ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

	private readonly cms = inject(MonthlyContentService);
	data: NewsContent | null = null;
	editingIndex: number | null = null;
	uploadingIndex: number | null = null;
	uploadingBlock: NewsBlock | null = null;
	private pendingUploadItem: NewsItem | null = null;

	ngOnChanges(): void {
		const raw = this.content as Partial<NewsContent> | null;
		if (!raw) return;
		if (typeof raw.visible !== 'boolean') raw.visible = true;
		if (!raw.title) raw.title = '';
		if (!Array.isArray(raw.items)) raw.items = [];
		raw.items.forEach((item, index) => {
			item.link = this.generateNewsLink(item.title, index);
			if (!Array.isArray(item.blocks)) item.blocks = [];
				item.blocks.forEach(block => {
					if (block.type === 'text') {
						block.color ||= '#374151';
						block.fontSize ||= '18px';
						block.align ||= 'right';
					}
				});
		});
		this.data = raw as NewsContent;
		this.editingIndex = null;
	}

	addBlock(item: NewsItem, type: NewsBlock['type']): void {
		if (!item.blocks) item.blocks = [];
		item.blocks.push({ type, text: '', url: '', alt: '', color: '#374151', fontSize: '18px', align: 'right', bold: false, italic: false });
	}

	removeBlock(item: NewsItem, index: number): void {
		item.blocks?.splice(index, 1);
	}

	onBlockFileChange(event: Event, block: NewsBlock): void {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		this.uploadingBlock = block;
		this.cms.uploadImage(file).subscribe({
			next: url => { block.url = url; this.uploadingBlock = null; },
			error: () => { this.uploadingBlock = null; }
		});
	}

	onTitleChange(item: NewsItem, index: number): void {
		item.link = this.generateNewsLink(item.title, index);
	}

	private generateNewsLink(title: string, index: number): string {
		const slug = (title || '')
			.trim()
			.toLowerCase()
			.replace(/[^\p{L}\p{N}]+/gu, '-')
			.replace(/^-+|-+$/g, '');
		return `/news/detail/${slug || `news-${index + 1}`}`;
	}

	add(): void {
		this.data?.items.unshift({ title: '', description: '', image: '', link: '', blocks: [] });
		if (this.data) this.data.items[0].link = this.generateNewsLink('', 0);
		this.editingIndex = 0;
	}

	requestRemove(i: number): void {
		const item = this.data?.items[i];
		if (item) this.deleteRequested.emit(item);
	}

	edit(i: number): void { this.editingIndex = i; }
	finishEditing(): void {
		this.editingIndex = null;
		this.saveRequested.emit();
	}

	triggerUpload(i: number): void {
		this.pendingUploadItem = this.data?.items[i] ?? null;
		this.uploadingIndex = null;
		const input = document.querySelectorAll<HTMLInputElement>('app-news-form input[type=file]')[i];
		if (input) input.click();
	}

	onFileChange(event: Event, item: NewsItem): void {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const idx = this.data?.items.indexOf(item) ?? -1;
		this.uploadingIndex = idx;
		this.cms.uploadImage(file).subscribe({
			next: url => {
				item.image = url;
				this.uploadingIndex = null;
			},
			error: () => {
				this.uploadingIndex = null;
			}
		});
	}

	resolveUrl(url: string): string {
		return this.cms.resolveAssetUrl(url);
	}
}
