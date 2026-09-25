import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

@Component({
	selector: 'app-sub-ab-reviews-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles],
	templateUrl: './sub-ab-reviews-form.component.html'
})
export class SubAbReviewsFormComponent implements OnChanges {
	@Input() content: unknown;
	private readonly cms = inject(MonthlyContentService);
	data: any = null;
	uploadingField: string | null = null;

	ngOnChanges(): void {
		const raw = this.content as any;
		if (!raw) return;

		const sd = raw.subscriptionDetails ??= {};
		sd.vodafoneNumbers ??= [];
		sd.scheduleImages ??= [];
		sd.features ??= [];
		sd.requiredInfo ??= [];
		sd.review ??= { name: 'مراجعات A-B', price: '800' };
		sd.googleForm ??= {};
		if (!sd.googleForm.link && sd.googleForms) {
			sd.googleForm = { ...sd.googleForm, ...(sd.googleForms.groupA ?? sd.googleForms.groupB ?? {}) };
		}
		sd.subscriptionWarnings ??= {};
		sd.subscriptionWarnings.validity ??= { title: 'مدة صلاحية الاشتراك:', points: [] };
		sd.subscriptionWarnings.refund ??= { title: 'سياسة الاسترداد:', points: [] };

		if (!Array.isArray(sd.subscriptionWarnings.validity.points)) sd.subscriptionWarnings.validity.points = [];
		if (!Array.isArray(sd.subscriptionWarnings.refund.points)) sd.subscriptionWarnings.refund.points = [];

		this.data = raw;
	}

	addVodafone(): void { this.data.subscriptionDetails.vodafoneNumbers.push({ number: '', owner: '' }); }
	removeVodafone(i: number): void { this.data.subscriptionDetails.vodafoneNumbers.splice(i, 1); }

	addSchedule(): void { this.data.subscriptionDetails.scheduleImages.push({ group: '', src: '', alt: '', note: '' }); }
	removeSchedule(i: number): void { this.data.subscriptionDetails.scheduleImages.splice(i, 1); }

	addFeature(): void { this.data.subscriptionDetails.features.push(''); }
	removeFeature(i: number): void { this.data.subscriptionDetails.features.splice(i, 1); }

	addRequired(): void { this.data.subscriptionDetails.requiredInfo.push(''); }
	removeRequired(i: number): void { this.data.subscriptionDetails.requiredInfo.splice(i, 1); }

	addValidityPoint(): void { this.data.subscriptionDetails.subscriptionWarnings.validity.points.push(''); }
	removeValidityPoint(i: number): void { this.data.subscriptionDetails.subscriptionWarnings.validity.points.splice(i, 1); }

	addRefundPoint(): void { this.data.subscriptionDetails.subscriptionWarnings.refund.points.push(''); }
	removeRefundPoint(i: number): void { this.data.subscriptionDetails.subscriptionWarnings.refund.points.splice(i, 1); }

	uploadScheduleImage(index: number, event: Event): void {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const key = 'schedule-' + index;
		this.uploadingField = key;
		this.cms.uploadImage(file).subscribe({
			next: url => {
				this.data.subscriptionDetails.scheduleImages[index].src = url;
				this.uploadingField = null;
			},
			error: () => { this.uploadingField = null; }
		});
	}

	resolveUrl(url: string): string { return this.cms.resolveAssetUrl(url); }
}
