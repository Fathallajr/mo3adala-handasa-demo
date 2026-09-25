import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CanonicalService } from '../../core/canonical.service';
import { SeoService } from '../../core/seo.service';
import { fadeInUp, staggerList } from '../../shared/animations';
import { SuccessStory, successStories } from './success-stories.data';
import { SubscriptionChoiceTriggerComponent } from '../../shared/components/subscription-choice-trigger/subscription-choice-trigger.component';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';

@Component({
	selector: 'app-success-stories',
	standalone: true,
	imports: [CommonModule, RouterLink, SubscriptionChoiceTriggerComponent],
	animations: [fadeInUp, staggerList],
	templateUrl: './success-stories.page.html',
	styleUrls: ['./success-stories.page.css']
})
export class SuccessStoriesPageComponent implements OnInit {
	stories: SuccessStory[] = successStories;
	eyebrow = 'قصص حقيقية من طلابنا';
	title = 'كل خطوة صغيرة';
	highlight = 'بتقرّبك من حلمك';
	description = 'شوف تجارب طلاب بدأوا من نفس المكان، وكملوا بطريقتهم لحد ما حققوا هدفهم في معادلة كلية الهندسة.';
	isPageVisible = true;

	constructor(
		private seo: SeoService,
		private canonical: CanonicalService,
		private contentService: MonthlyContentService
	) {}

	ngOnInit(): void {
		if (typeof window === 'undefined') {
			return;
		}

		const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
		const title = 'قصص نجاح طلاب أبلكيشن معادلة كلية هندسة';
		const description = 'شاهد قصص نجاح طلاب أبلكيشن معادلة كلية هندسة وتجاربهم الحقيقية مع المذاكرة والمتابعة حتى تحقيق هدفهم.';
		const url = `${siteUrl}/success-stories`;

		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
		this.contentService.loadPageState('success-stories', cmsPageDefaults['success-stories']).subscribe(content => {
			const state = content as any;
			this.isPageVisible = state?.visible !== false;
			this.eyebrow = state?.eyebrow || this.eyebrow;
			this.title = state?.title || this.title;
			this.highlight = state?.highlight || this.highlight;
			this.description = state?.description || this.description;
			if (Array.isArray(state?.stories) && state.stories.length) this.stories = state.stories;
		});
	}

}
