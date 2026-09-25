import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';

interface RequirementStep { title: string; description: string; }
interface RequirementsContent { visible: boolean; title: string; description: string; engineeringConditions: string[]; computersConditions: string[]; documents: string[]; steps: RequirementStep[]; }

@Component({
	selector: 'app-requirements-form', standalone: true, imports: [CommonModule, FormsModule],
	template: `<div class="cms-form" *ngIf="data"><div class="cms-section"><div class="cms-section-title">صفحة شروط المعادلة</div><label class="cms-label">إظهار الصفحة <input type="checkbox" [(ngModel)]="data.visible"></label><div class="cms-field"><label class="cms-label">العنوان</label><input class="cms-input" [(ngModel)]="data.title"></div><div class="cms-field"><label class="cms-label">الوصف</label><textarea class="cms-textarea" [(ngModel)]="data.description" rows="2"></textarea></div></div><div class="cms-section"><div class="cms-section-title">الشروط — كل سطر شرط</div><div class="cms-field"><label class="cms-label">هندسة</label><textarea class="cms-textarea" [ngModel]="engineeringText" (ngModelChange)="setList('engineeringConditions',$event)" rows="6"></textarea></div><div class="cms-field"><label class="cms-label">حاسبات</label><textarea class="cms-textarea" [ngModel]="computersText" (ngModelChange)="setList('computersConditions',$event)" rows="6"></textarea></div></div><div class="cms-section"><div class="cms-section-title">المستندات</div><textarea class="cms-textarea" [ngModel]="documentsText" (ngModelChange)="setList('documents',$event)" rows="5"></textarea></div><div class="cms-section"><div class="cms-section-title">خطوات التقديم</div><div class="cms-array-list"><div class="cms-array-item" *ngFor="let step of data.steps; let i=index"><b>{{ i + 1 }}</b><div><input class="cms-input" [(ngModel)]="step.title" placeholder="عنوان الخطوة"><textarea class="cms-textarea" [(ngModel)]="step.description" rows="2" placeholder="وصف الخطوة"></textarea></div></div></div></div></div>`,
	styles: [adminFormStyles]
})
export class RequirementsFormComponent implements OnChanges {
	@Input() content: unknown; data: RequirementsContent | null = null; engineeringText = ''; computersText = ''; documentsText = '';
	ngOnChanges(): void { const raw = (this.content || {}) as Partial<RequirementsContent>; this.data = { visible: raw.visible !== false, title: raw.title || 'كل شروط المعادلة في مكان واحد', description: raw.description || '', engineeringConditions: raw.engineeringConditions || [], computersConditions: raw.computersConditions || [], documents: raw.documents || [], steps: raw.steps || [] }; this.refresh(); if (this.content && typeof this.content === 'object') Object.assign(this.content, this.data); }
	setList(key: 'engineeringConditions'|'computersConditions'|'documents', value: string): void { if (this.data) this.data[key] = value.split('\n').map(item => item.trim()).filter(Boolean); this.refresh(); }
	private refresh(): void { this.engineeringText = this.data?.engineeringConditions.join('\n') || ''; this.computersText = this.data?.computersConditions.join('\n') || ''; this.documentsText = this.data?.documents.join('\n') || ''; }
}
