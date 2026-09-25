import { Component, Input, OnChanges, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

export interface NewsItem {
	title: string;
	description: string;
	image: string;
	link: string;
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
	styles: [adminFormStyles],
	template: `
<div class="cms-form" *ngIf="data">

	<div class="cms-section">
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

	<div class="cms-section">
		<div class="cms-section-title">الأخبار ({{ data.items.length }})</div>
		<div class="cms-array-list">
			<div class="cms-array-item" *ngFor="let item of data.items; let i = index">
				<div style="flex:1">
					<div class="cms-array-item__num">خبر {{ i + 1 }}</div>
					<div class="cms-field">
						<label class="cms-label">العنوان</label>
						<input class="cms-input" [(ngModel)]="item.title" placeholder="عنوان الخبر" />
					</div>
					<div class="cms-field">
						<label class="cms-label">الوصف</label>
						<textarea class="cms-textarea" [(ngModel)]="item.description" placeholder="وصف مختصر للخبر" rows="2"></textarea>
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
						<label class="cms-label">رابط الخبر (link)</label>
						<input class="cms-input" [(ngModel)]="item.link" placeholder="https://..." dir="ltr" />
					</div>
				</div>
				<button type="button" class="cms-array-item__del" (click)="remove(i)">×</button>
			</div>
		</div>
		<button type="button" class="cms-add-btn" (click)="add()">+ إضافة خبر</button>
	</div>
</div>
`
})
export class NewsFormComponent implements OnChanges {
	@Input() content: unknown;
	@ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

	private readonly cms = inject(MonthlyContentService);
	data: NewsContent | null = null;
	uploadingIndex: number | null = null;
	private pendingUploadItem: NewsItem | null = null;

	ngOnChanges(): void {
		const raw = this.content as Partial<NewsContent> | null;
		if (!raw) return;
		if (typeof raw.visible !== 'boolean') raw.visible = true;
		if (!raw.title) raw.title = '';
		if (!Array.isArray(raw.items)) raw.items = [];
		this.data = raw as NewsContent;
	}

	add(): void {
		this.data?.items.push({ title: '', description: '', image: '', link: '' });
	}

	remove(i: number): void {
		this.data?.items.splice(i, 1);
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
