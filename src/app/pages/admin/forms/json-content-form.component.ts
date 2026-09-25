import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

@Component({
	selector: 'app-json-content-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles + `.cms-help{color:#718096;line-height:1.75}.json-editor{width:100%;box-sizing:border-box;font-family:Consolas,monospace;border:1px solid #dfe4ed;border-radius:10px;padding:1rem}.cms-error{color:#a43a50;font-weight:800}`],
	template: `
		<div class="cms-form" *ngIf="content">
			<div class="cms-section">
				<div class="cms-section-title">محرر بيانات الصفحة</div>
				<p class="cms-help">الصفحة دي جديدة أو محتواها متغير. عدّل البيانات بصيغة JSON، ثم اضغط «حفظ على السيرفر». أي تغيير هنا يظهر مباشرة في الصفحة بعد إعادة تحميلها.</p>
				<textarea class="cms-textarea json-editor" [(ngModel)]="jsonText" (ngModelChange)="sync()" rows="28" dir="ltr" spellcheck="false"></textarea>
				<p class="cms-error" *ngIf="parseError">{{ parseError }}</p>
			</div>
		</div>
	`
})
export class JsonContentFormComponent implements OnChanges {
	@Input() content: unknown;
	jsonText = '';
	parseError = '';

	ngOnChanges(): void {
		this.jsonText = JSON.stringify(this.content ?? {}, null, 2);
		this.parseError = '';
	}

	sync(): void {
		try {
			const parsed = JSON.parse(this.jsonText);
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('لازم تكون البيانات Object بصيغة JSON.');
			if (this.content && typeof this.content === 'object') {
				for (const key of Object.keys(this.content as object)) delete (this.content as Record<string, unknown>)[key];
				Object.assign(this.content, parsed);
			}
			this.parseError = '';
		} catch {
			this.parseError = 'صيغة JSON غير صحيحة. راجع الأقواس والفواصل قبل الحفظ.';
		}
	}
}
