import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

interface BatchContent { wheelVisible: boolean; [key: string]: unknown; }

@Component({
	selector: 'app-batch-2027-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<div class="cms-form" *ngIf="data">
			<div class="cms-section"><div class="cms-section-title">إعدادات العجلة</div>
				<div class="cms-toggle-wrap">
					<label class="cms-switch"><input type="checkbox" [(ngModel)]="data.wheelVisible" /><span class="cms-slider"></span></label>
					<span class="cms-toggle-label">{{ data.wheelVisible ? 'العجلة ظاهرة للزوار' : 'العجلة مخفية عن الزوار' }}</span>
				</div>
				<p class="cms-help">احفظ التعديلات لتطبيق الحالة على صفحة دفعة 2027.</p>
			</div>
		</div>
	`,
	styles: [adminFormStyles]
})
export class Batch2027FormComponent implements OnChanges {
	@Input() content: unknown;
	data: BatchContent | null = null;

	ngOnChanges(): void {
		const raw = (this.content || {}) as Partial<BatchContent>;
		this.data = { wheelVisible: raw.wheelVisible !== false };
		if (this.content && typeof this.content === 'object') Object.assign(this.content, this.data);
	}
}
