import { ChangeDetectorRef, Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';
import { subscriptionFormStyles } from './subscription-form-styles';

@Component({
	selector: 'app-sub-ab-reviews-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + subscriptionFormStyles],
	templateUrl: './sub-ab-reviews-form.component.html'
})
export class SubAbReviewsFormComponent implements OnChanges {
	@Input() content: unknown;
	@Input() pageKey = '';
	private readonly cms = inject(MonthlyContentService);
	private readonly changeDetector = inject(ChangeDetectorRef);
	data: any = null;
	uploadingField: string | null = null;
	uploadError = '';

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
		if (!sd.googleForm.link) {
			sd.googleForm.link = this.pageKey.endsWith('-en')
				? 'https://forms.gle/WFv9urJ1QDu3eE5y9'
				: 'https://forms.gle/mhopqPdxUPxQEN9K8';
		}
		if (!sd.googleForm.link && sd.googleForms) {
			sd.googleForm = { ...sd.googleForm, ...(sd.googleForms.groupA ?? sd.googleForms.groupB ?? {}) };
		}
		sd.subscriptionWarnings ??= {};
		sd.subscriptionWarnings.validity ??= { title: 'مدة صلاحية الاشتراك:', points: [] };
		sd.subscriptionWarnings.refund ??= { title: 'سياسة الاسترداد:', points: [] };
		raw.enrollmentWindow ??= { days: 0, hours: 0, minutes: 0, seconds: 0, startedAt: '', expiresAt: '' };
		for (const unit of ['days', 'hours', 'minutes', 'seconds']) raw.enrollmentWindow[unit] = Math.max(0, Number(raw.enrollmentWindow[unit]) || 0);

		if (!Array.isArray(sd.subscriptionWarnings.validity.points)) sd.subscriptionWarnings.validity.points = [];
		if (!Array.isArray(sd.subscriptionWarnings.refund.points)) sd.subscriptionWarnings.refund.points = [];

	this.data = raw;
	}

	startEnrollmentWindow(): void {
		const window = this.data.enrollmentWindow;
		const totalSeconds = (Number(window.days) || 0) * 86400
			+ (Number(window.hours) || 0) * 3600
			+ (Number(window.minutes) || 0) * 60
			+ (Number(window.seconds) || 0);
		if (totalSeconds <= 0) return;
		const startedAt = new Date();
		window.startedAt = startedAt.toISOString();
		window.expiresAt = new Date(startedAt.getTime() + totalSeconds * 1000).toISOString();
		this.data.isEnrollmentClosed = false;
	}

	clearEnrollmentWindow(): void {
		this.data.enrollmentWindow.startedAt = '';
		this.data.enrollmentWindow.expiresAt = '';
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
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		input.value = '';
		this.uploadError = '';
		const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
		if (!allowedTypes.has(file.type)) {
			this.uploadError = 'نوع الملف غير مدعوم. ارفع JPG أو PNG أو WEBP أو GIF.';
			this.changeDetector.detectChanges();
			return;
		}
		if (file.size > 8 * 1024 * 1024) {
			this.uploadError = 'حجم الصورة أكبر من 8 ميجابايت.';
			this.changeDetector.detectChanges();
			return;
		}
		const key = 'schedule-' + index;
		this.uploadingField = key;
		this.cms.uploadImage(file, this.pageKey).subscribe({
			next: url => {
				this.data.subscriptionDetails.scheduleImages[index].src = url;
				this.uploadingField = null;
				this.changeDetector.detectChanges();
			},
			error: error => {
				this.uploadingField = null;
				this.uploadError = error?.error?.message || 'تعذر رفع الصورة. حاول مرة أخرى.';
				this.changeDetector.detectChanges();
			}
		});
	}

	resolveUrl(url: string): string { return this.cms.resolveAssetUrl(url); }

	normalizeSchedulePath(schedule: any): void {
		if (schedule) schedule.src = this.cms.normalizeAssetPath(schedule.src);
	}
}
