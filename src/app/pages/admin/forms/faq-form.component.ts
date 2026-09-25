import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

export interface FaqItem { q: string; a: string; }

@Component({
	selector: 'app-faq-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles],
	template: `
<div class="cms-form" *ngIf="faqs">
	<div class="cms-section">
		<div class="cms-section-title">الأسئلة الشائعة ({{ faqs.length }})</div>
		<div class="cms-array-list">
			<div class="cms-array-item" *ngFor="let item of faqs; let i = index">
				<div>
					<div class="cms-array-item__num">سؤال {{ i + 1 }}</div>
					<div class="cms-field">
						<label class="cms-label">السؤال</label>
						<input class="cms-input" [(ngModel)]="item.q" placeholder="اكتب السؤال هنا" />
					</div>
					<div class="cms-field" style="margin-bottom:0">
						<label class="cms-label">الإجابة</label>
						<textarea class="cms-textarea" [(ngModel)]="item.a" placeholder="اكتب الإجابة هنا" rows="3"></textarea>
					</div>
				</div>
				<button type="button" class="cms-array-item__del" (click)="remove(i)" title="حذف السؤال">×</button>
			</div>
		</div>
		<button type="button" class="cms-add-btn" (click)="add()">+ إضافة سؤال جديد</button>
	</div>
</div>
`
})
export class FaqFormComponent implements OnChanges {
	@Input() content: unknown;
	faqs: FaqItem[] | null = null;

	ngOnChanges(): void {
		const raw = this.content as { faqs?: FaqItem[] } | null;
		if (!raw) return;
		if (!Array.isArray(raw.faqs)) raw.faqs = [];
		this.faqs = raw.faqs;
	}

	add(): void {
		this.faqs?.push({ q: '', a: '' });
	}

	remove(i: number): void {
		this.faqs?.splice(i, 1);
	}
}
