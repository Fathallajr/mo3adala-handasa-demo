import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { successStories, SuccessStory } from '../../success-stories/success-stories.data';
import { adminFormStyles } from './admin-form-styles';

interface SuccessStoriesContent { visible: boolean; eyebrow: string; title: string; highlight: string; description: string; stories: SuccessStory[]; }

@Component({
	selector: 'app-success-stories-form',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<div class="cms-form" *ngIf="data">
			<div class="cms-section">
				<div class="cms-section-title">واجهة قصص النجاح</div>
				<label class="cms-label">إظهار الصفحة <input type="checkbox" [(ngModel)]="data.visible"></label>
				<div class="cms-field"><label class="cms-label">الشارة الصغيرة</label><input class="cms-input" [(ngModel)]="data.eyebrow"></div>
				<div class="cms-row"><div class="cms-field"><label class="cms-label">العنوان</label><input class="cms-input" [(ngModel)]="data.title"></div><div class="cms-field"><label class="cms-label">العنوان المميز</label><input class="cms-input" [(ngModel)]="data.highlight"></div></div>
				<div class="cms-field"><label class="cms-label">الوصف</label><textarea class="cms-textarea" [(ngModel)]="data.description" rows="3"></textarea></div>
			</div>
			<div class="cms-section"><div class="cms-section-title">القصص ({{ data.stories.length }})</div>
				<div class="cms-array-list"><div class="cms-array-item" *ngFor="let story of data.stories; let i = index"><div>
					<div class="cms-array-item__num">قصة {{ i + 1 }}</div>
					<div class="cms-row"><div class="cms-field"><label class="cms-label">اسم الطالب</label><input class="cms-input" [(ngModel)]="story.name"></div><div class="cms-field"><label class="cms-label">النوع</label><select class="cms-select" [(ngModel)]="story.category"><option value="reviews">مراجعات</option><option value="intensive">مكثف</option></select></div></div>
					<div class="cms-field"><label class="cms-label">النتيجة / العنوان</label><input class="cms-input" [(ngModel)]="story.result"></div>
					<div class="cms-field"><label class="cms-label">الملخص</label><textarea class="cms-textarea" [(ngModel)]="story.summary" rows="2"></textarea></div>
					<div class="cms-field"><label class="cms-label">رسالة الطالب</label><textarea class="cms-textarea" [(ngModel)]="story.message" rows="3"></textarea></div>
					<div class="cms-field"><label class="cms-label">رابط الصورة</label><input class="cms-input" dir="ltr" [(ngModel)]="story.image"></div>
				</div><button type="button" class="cms-array-item__del" (click)="remove(i)">×</button></div></div>
				<button type="button" class="cms-add-btn" (click)="add()">+ إضافة قصة</button>
			</div>
		</div>
	`,
	styles: [adminFormStyles]
})
export class SuccessStoriesFormComponent implements OnChanges {
	@Input() content: unknown;
	data: SuccessStoriesContent | null = null;

	ngOnChanges(): void {
		const raw = (this.content || {}) as Partial<SuccessStoriesContent>;
		const stories = Array.isArray(raw.stories) && raw.stories.length ? raw.stories : structuredClone(successStories);
		this.data = { visible: raw.visible !== false, eyebrow: raw.eyebrow || 'قصص حقيقية من طلابنا', title: raw.title || 'كل خطوة صغيرة', highlight: raw.highlight || 'بتقرّبك من حلمك', description: raw.description || 'شوف تجارب طلاب بدأوا من نفس المكان، وكملوا بطريقتهم لحد ما حققوا هدفهم.', stories };
		if (this.content && typeof this.content === 'object') Object.assign(this.content, this.data);
	}

	add(): void { this.data?.stories.push({ id: Date.now(), name: '', honorific: 'البشمهندس', category: 'reviews', badge: 'مراجعات', image: '/assets/logo.png', result: '', summary: '', before: '', after: '', quote: '', message: '', videoUrls: [], details: [] }); }
	remove(index: number): void { this.data?.stories.splice(index, 1); }
}
