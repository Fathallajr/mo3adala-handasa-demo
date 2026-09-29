import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

interface LaunchOfferContent {
	visible: boolean;
	eyebrow: string;
	title: string;
	highlight: string;
	description: string;
	expiresAt: string;
}

@Component({
	selector: 'app-launch-offer-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + `.cms-help{margin:.35rem 0 0;color:#718096;line-height:1.75;font-size:.8rem}.cms-preview-note{padding:.8rem 1rem;border:1px solid #dbeafe;border-radius:10px;color:#1e40af;background:#eff6ff;line-height:1.75}`],
	template: `
		<div class="cms-form" *ngIf="data">
			<div class="cms-section">
				<div class="cms-section-title">حالة البوب‑أب</div>
				<div class="cms-toggle-wrap">
					<label class="cms-switch"><input type="checkbox" [ngModel]="data.visible" (ngModelChange)="setValue('visible', $event)" /><span class="cms-slider"></span></label>
					<span class="cms-toggle-label">{{ data.visible ? 'البوب‑أب مفتوح للزوار' : 'البوب‑أب مغلق عن الزوار' }}</span>
				</div>
				<p class="cms-help">لن يتغير الظهور في البرودكشن إلا بعد الضغط على «حفظ على السيرفر».</p>
			</div>

			<div class="cms-section">
				<div class="cms-section-title">محتوى العرض</div>
				<div class="cms-row">
					<label class="cms-field"><span class="cms-label">الشارة</span><input class="cms-input" [ngModel]="data.eyebrow" (ngModelChange)="setValue('eyebrow', $event)" /></label>
					<label class="cms-field"><span class="cms-label">العنوان</span><input class="cms-input" [ngModel]="data.title" (ngModelChange)="setValue('title', $event)" /></label>
				</div>
				<label class="cms-field"><span class="cms-label">الجملة المميزة</span><input class="cms-input" [ngModel]="data.highlight" (ngModelChange)="setValue('highlight', $event)" /></label>
				<label class="cms-field"><span class="cms-label">الوصف</span><textarea class="cms-textarea" [ngModel]="data.description" (ngModelChange)="setValue('description', $event)"></textarea></label>
			</div>

			<div class="cms-section">
				<div class="cms-section-title">عداد انتهاء العرض</div>
				<label class="cms-field"><span class="cms-label">موعد إغلاق العرض</span><input class="cms-input" type="datetime-local" [ngModel]="localExpiresAt" (ngModelChange)="setExpiry($event)" /></label>
				<p class="cms-preview-note">{{ expiryLabel }}</p>
				<p class="cms-help">العداد يعتمد على هذا التاريخ المحفوظ في السيرفر، ولا يتم إنشاء تاريخ جديد تلقائيًا من جهاز الزائر.</p>
			</div>
		</div>
	`,
})
export class LaunchOfferFormComponent implements OnChanges {
	@Input() content: unknown;
	data: LaunchOfferContent | null = null;
	localExpiresAt = '';

	ngOnChanges(): void {
		const raw = (this.content || {}) as Partial<LaunchOfferContent>;
		this.data = {
			visible: raw.visible === true,
			eyebrow: String(raw.eyebrow || ''),
			title: String(raw.title || ''),
			highlight: String(raw.highlight || ''),
			description: String(raw.description || ''),
			expiresAt: String(raw.expiresAt || '')
		};
		this.localExpiresAt = this.toLocalDateTime(this.data.expiresAt);
	}

	setValue(key: keyof LaunchOfferContent, value: string | boolean): void {
		if (!this.data || !this.content || typeof this.content !== 'object') return;
		(this.data as any)[key] = value;
		(this.content as Record<string, unknown>)[key] = value;
	}

	setExpiry(value: string): void {
		this.localExpiresAt = value;
		this.setValue('expiresAt', value ? new Date(value).toISOString() : '');
	}

	get expiryLabel(): string {
		if (!this.data?.expiresAt) return 'لم يتم تحديد موعد إغلاق للعرض.';
		const timestamp = Date.parse(this.data.expiresAt);
		if (!Number.isFinite(timestamp)) return 'التاريخ غير صحيح.';
		return `سيُغلق العرض في: ${new Date(timestamp).toLocaleString('ar-EG')}`;
	}

	private toLocalDateTime(value: string): string {
		const timestamp = Date.parse(value || '');
		if (!Number.isFinite(timestamp)) return '';
		const date = new Date(timestamp);
		const pad = (part: number) => String(part).padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}
}
