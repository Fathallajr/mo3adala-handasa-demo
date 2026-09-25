import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BatchContent { visible: boolean; eyebrow: string; title: string; highlight: string; features: string[]; programOptions: string[]; studentTypeOptions: string[]; sourceOptions: string[]; joinEyebrow: string; joinTitle: string; joinHighlight: string; joinDescription: string; submitLabel: string; }

@Component({
	selector: 'app-batch-2027-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<div class="cms-form" *ngIf="data">
			<div class="cms-section"><div class="cms-section-title">واجهة دفعة 2027</div>
				<label class="cms-label">إظهار الصفحة <input type="checkbox" [(ngModel)]="data.visible"></label>
				<div class="cms-row"><div class="cms-field"><label class="cms-label">الشارة الصغيرة</label><input class="cms-input" [(ngModel)]="data.eyebrow"></div><div class="cms-field"><label class="cms-label">عنوان الهيرو</label><input class="cms-input" [(ngModel)]="data.title"></div></div>
				<div class="cms-field"><label class="cms-label">العنوان المميز</label><input class="cms-input" [(ngModel)]="data.highlight"></div>
				<div class="cms-row"><div class="cms-field"><label class="cms-label">عنوان التسجيل</label><input class="cms-input" [(ngModel)]="data.joinTitle"></div><div class="cms-field"><label class="cms-label">العنوان المميز للتسجيل</label><input class="cms-input" [(ngModel)]="data.joinHighlight"></div></div>
				<div class="cms-field"><label class="cms-label">وصف التسجيل</label><textarea class="cms-textarea" [(ngModel)]="data.joinDescription" rows="2"></textarea></div>
				<div class="cms-field"><label class="cms-label">نص زر التسجيل</label><input class="cms-input" [(ngModel)]="data.submitLabel"></div>
			</div>
			<div class="cms-section"><div class="cms-section-title">القوائم التي تظهر للطالب</div>
				<div class="cms-field"><label class="cms-label">مميزات الهيرو — كل سطر ميزة</label><textarea class="cms-textarea" [ngModel]="featuresText" (ngModelChange)="updateList('features',$event)" rows="4"></textarea></div>
				<div class="cms-field"><label class="cms-label">أنواع المعادلة — كل سطر اختيار</label><textarea class="cms-textarea" [ngModel]="programsText" (ngModelChange)="updateList('programOptions',$event)" rows="4"></textarea></div>
				<div class="cms-field"><label class="cms-label">أنواع التعليم — كل سطر اختيار</label><textarea class="cms-textarea" [ngModel]="studentTypesText" (ngModelChange)="updateList('studentTypeOptions',$event)" rows="4"></textarea></div>
				<div class="cms-field"><label class="cms-label">مصادر المعرفة — كل سطر اختيار</label><textarea class="cms-textarea" [ngModel]="sourcesText" (ngModelChange)="updateList('sourceOptions',$event)" rows="4"></textarea></div>
			</div>
		</div>
	`,
	styles: [`.cms-form{display:flex;flex-direction:column;gap:1.25rem}.cms-section{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:1.25rem}.cms-section-title{font-weight:800;margin-bottom:1rem}.cms-row{display:grid;grid-template-columns:1fr 1fr;gap:.75rem}.cms-field{display:flex;flex-direction:column;gap:.35rem;margin-bottom:.75rem}.cms-label{font-size:.83rem;font-weight:700;color:#475569}.cms-input,.cms-textarea{width:100%;box-sizing:border-box;padding:.7rem .85rem;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit}.cms-textarea{resize:vertical}`]
})
export class Batch2027FormComponent implements OnChanges {
	@Input() content: unknown;
	data: BatchContent | null = null;
	featuresText = ''; programsText = ''; studentTypesText = ''; sourcesText = '';

	ngOnChanges(): void {
		const raw = (this.content || {}) as Partial<BatchContent>;
		this.data = { visible: raw.visible !== false, eyebrow: raw.eyebrow || 'مشوارك يبدأ من هنا', title: raw.title || 'كلية هندسة', highlight: raw.highlight || 'أقرب مما تتخيل', features: raw.features || [], programOptions: raw.programOptions || [], studentTypeOptions: raw.studentTypeOptions || [], sourceOptions: raw.sourceOptions || [], joinEyebrow: raw.joinEyebrow || 'خليك أول واحد يعرف', joinTitle: raw.joinTitle || 'سجل دلوقتي', joinHighlight: raw.joinHighlight || 'وخد أولوية العروض والخصومات', joinDescription: raw.joinDescription || '', submitLabel: raw.submitLabel || 'احصل على الخصم الآن' };
		this.refreshTexts();
		if (this.content && typeof this.content === 'object') Object.assign(this.content, this.data);
	}
	updateList(key: 'features' | 'programOptions' | 'studentTypeOptions' | 'sourceOptions', value: string): void { if (this.data) this.data[key] = value.split('\n').map(item => item.trim()).filter(Boolean); this.refreshTexts(); }
	private refreshTexts(): void { this.featuresText = this.data?.features.join('\n') || ''; this.programsText = this.data?.programOptions.join('\n') || ''; this.studentTypesText = this.data?.studentTypeOptions.join('\n') || ''; this.sourcesText = this.data?.sourceOptions.join('\n') || ''; }
}
