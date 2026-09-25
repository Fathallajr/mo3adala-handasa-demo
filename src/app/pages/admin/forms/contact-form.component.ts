import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

export interface ContactContent {
	studentWhatsapp: string;
	parentWhatsapp: string;
	phoneNumber: string;
}

@Component({
	selector: 'app-contact-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles],
	template: `
<div class="cms-form" *ngIf="data">
	<div class="cms-section">
		<div class="cms-section-title">أرقام التواصل</div>
		<div class="cms-row">
			<div class="cms-field">
				<label class="cms-label">واتساب الطلاب</label>
				<input class="cms-input" [(ngModel)]="data.studentWhatsapp" placeholder="201554843745" dir="ltr" />
			</div>
			<div class="cms-field">
				<label class="cms-label">واتساب أولياء الأمور</label>
				<input class="cms-input" [(ngModel)]="data.parentWhatsapp" placeholder="201554843745" dir="ltr" />
			</div>
		</div>
		<div class="cms-field">
			<label class="cms-label">رقم التليفون</label>
			<input class="cms-input" [(ngModel)]="data.phoneNumber" placeholder="+201554843745" dir="ltr" />
		</div>
		<p style="font-size:0.8rem;color:#94a3b8;margin:0.5rem 0 0">أدخل الأرقام بصيغة دولية بدون + أو بها. مثال: 201554843745 أو +201554843745</p>
	</div>
</div>
`
})
export class ContactFormComponent implements OnChanges {
	@Input() content: unknown;
	data: ContactContent | null = null;

	ngOnChanges(): void {
		const raw = this.content as Partial<ContactContent> | null;
		this.data = {
			studentWhatsapp: raw?.studentWhatsapp ?? '201554843745',
			parentWhatsapp: raw?.parentWhatsapp ?? '201554843745',
			phoneNumber: raw?.phoneNumber ?? '+201554843745'
		};
		Object.assign(this.content as object, this.data);
	}
}
