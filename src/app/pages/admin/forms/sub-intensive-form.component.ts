import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

@Component({
	selector: 'app-sub-intensive-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles],
	templateUrl: './sub-intensive-form.component.html'
})
export class SubIntensiveFormComponent implements OnChanges {
	@Input() content: unknown;
	private readonly cms = inject(MonthlyContentService);
	data: any = null;

	ngOnChanges(): void {
		const raw = this.content as any;
		if (!raw) return;

		const sd = raw.subscriptionDetails ??= {};
		sd.paymentPlans ??= {};
		const legacyInstallment2 = sd.paymentPlans.installments?.installment2;
		sd.paymentPlans.installment2 ??= legacyInstallment2 ?? {};
		sd.vodafoneNumbers ??= [];
		sd.requiredInfo ??= [];
		sd.subscriptionWarnings ??= {};
		sd.subscriptionWarnings.validity ??= { title: 'مدة صلاحية الاشتراك:', points: [] };
		sd.subscriptionWarnings.refund ??= { title: 'سياسة الاسترداد:', points: [] };

		if (!Array.isArray(sd.subscriptionWarnings.validity.points)) sd.subscriptionWarnings.validity.points = [];
		if (!Array.isArray(sd.subscriptionWarnings.refund.points)) sd.subscriptionWarnings.refund.points = [];

		this.data = raw;
	}

	addVodafone(): void { this.data.subscriptionDetails.vodafoneNumbers.push({ number: '', owner: '' }); }
	removeVodafone(i: number): void { this.data.subscriptionDetails.vodafoneNumbers.splice(i, 1); }

	addRequired(): void { this.data.subscriptionDetails.requiredInfo.push(''); }
	removeRequired(i: number): void { this.data.subscriptionDetails.requiredInfo.splice(i, 1); }

	addValidityPoint(): void { this.data.subscriptionDetails.subscriptionWarnings.validity.points.push(''); }
	removeValidityPoint(i: number): void { this.data.subscriptionDetails.subscriptionWarnings.validity.points.splice(i, 1); }

	addRefundPoint(): void { this.data.subscriptionDetails.subscriptionWarnings.refund.points.push(''); }
	removeRefundPoint(i: number): void { this.data.subscriptionDetails.subscriptionWarnings.refund.points.splice(i, 1); }
}
