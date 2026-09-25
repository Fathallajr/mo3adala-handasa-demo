import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { adminFormStyles } from './admin-form-styles';
import { MonthlyContentService } from '../../../core/services/monthly-content.service';

interface HomeContent {
	seo: { title: string; description: string };
	hero: {
		features: string[];
		descriptions: Array<{ text: string; highlight: string[] }>;
	};
}

@Component({
	selector: 'app-home-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	styles: [adminFormStyles],
	template: `
<div class="cms-form" *ngIf="data">

	<!-- SEO -->
	<div class="cms-section">
		<div class="cms-section-title">🔍 بيانات SEO</div>
		<div class="cms-field">
			<label class="cms-label">عنوان الصفحة (title)</label>
			<input class="cms-input" [(ngModel)]="data.seo.title" placeholder="ابلكيشن معادلة كلية هندسة" />
		</div>
		<div class="cms-field" style="margin-bottom:0">
			<label class="cms-label">وصف الصفحة (description)</label>
			<textarea class="cms-textarea" [(ngModel)]="data.seo.description" rows="2"></textarea>
		</div>
	</div>

	<!-- Features -->
	<div class="cms-section">
		<div class="cms-section-title">✅ مميزات الهيرو</div>
		<div class="cms-array-list">
			<div class="cms-array-item" *ngFor="let f of data.hero.features; let i = index">
				<div style="flex:1">
					<input class="cms-input" [(ngModel)]="data.hero.features[i]" placeholder="ميزة..." />
				</div>
				<button type="button" class="cms-array-item__del" (click)="removeFeature(i)">×</button>
			</div>
		</div>
		<button type="button" class="cms-add-btn" (click)="addFeature()">+ إضافة ميزة</button>
	</div>

	<!-- Animated descriptions -->
	<div class="cms-section">
		<div class="cms-section-title">💬 الجمل المتحركة</div>
		<p style="font-size:0.8rem;color:#94a3b8;margin:0 0 0.75rem">كل جملة تظهر في الهيرو بالتناوب. يمكنك تحديد الكلمات المراد تمييزها بفاصلة.</p>
		<div class="cms-array-list">
			<div class="cms-array-item" *ngFor="let d of data.hero.descriptions; let i = index">
				<div style="flex:1">
					<div class="cms-array-item__num">جملة {{ i + 1 }}</div>
					<div class="cms-field">
						<label class="cms-label">نص الجملة</label>
						<input class="cms-input" [(ngModel)]="d.text" placeholder="اكتب الجملة هنا" />
					</div>
					<div class="cms-field" style="margin-bottom:0">
						<label class="cms-label">الكلمات المميّزة (مفصولة بفاصلة)</label>
						<input class="cms-input" [ngModel]="d.highlight.join(',')" (ngModelChange)="setHighlight(d, $event)" placeholder="كلمة1,كلمة2" dir="rtl" />
					</div>
				</div>
				<button type="button" class="cms-array-item__del" (click)="removeDesc(i)">×</button>
			</div>
		</div>
		<button type="button" class="cms-add-btn" (click)="addDesc()">+ إضافة جملة</button>
	</div>

</div>
`
})
export class HomeFormComponent implements OnChanges {
	@Input() content: unknown;
	private readonly cms = inject(MonthlyContentService);
	data: HomeContent | null = null;

	ngOnChanges(): void {
		const raw = this.content as Partial<HomeContent> | null;
		if (!raw) return;

		if (!raw.seo) raw.seo = { title: '', description: '' };
		if (!raw.hero) raw.hero = { features: [], descriptions: [] };
		if (!Array.isArray(raw.hero.features)) raw.hero.features = [];
		if (!Array.isArray(raw.hero.descriptions)) raw.hero.descriptions = [];

		this.data = raw as HomeContent;
	}

	addFeature(): void { this.data?.hero.features.push(''); }
	removeFeature(i: number): void { this.data?.hero.features.splice(i, 1); }

	addDesc(): void {
		this.data?.hero.descriptions.push({ text: '', highlight: [] });
	}

	removeDesc(i: number): void { this.data?.hero.descriptions.splice(i, 1); }

	setHighlight(desc: { text: string; highlight: string[] }, value: string): void {
		desc.highlight = value.split(',').map(s => s.trim()).filter(Boolean);
	}
}
