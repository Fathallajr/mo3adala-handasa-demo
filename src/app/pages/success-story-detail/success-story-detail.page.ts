import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CanonicalService } from '../../core/canonical.service';
import { SeoService } from '../../core/seo.service';
import { fadeInUp } from '../../shared/animations';
import { SuccessStory, successStories } from '../success-stories/success-stories.data';
import { MonthlyContentService } from '../../core/services/monthly-content.service';
import { cmsPageDefaults } from '../../core/cms-page.registry';

@Component({
	selector: 'app-success-story-detail',
	standalone: true,
	imports: [CommonModule, RouterLink],
	animations: [fadeInUp],
	templateUrl: './success-story-detail.page.html',
	styleUrls: ['./success-story-detail.page.css']
})
export class SuccessStoryDetailPageComponent implements OnInit {
	story: SuccessStory | undefined;

	constructor(
		private route: ActivatedRoute,
		private seo: SeoService,
		private canonical: CanonicalService,
		private contentService: MonthlyContentService
	) {}

	ngOnInit(): void {
		const storyId = Number(this.route.snapshot.paramMap.get('id'));
		this.contentService.loadPageState('success-stories', { ...(cmsPageDefaults['success-stories'] as object), stories: successStories }).subscribe(content => {
			const stories = Array.isArray((content as any)?.stories) && (content as any).stories.length ? (content as any).stories as SuccessStory[] : successStories;
			this.story = stories.find(item => item.id === storyId);
			if (!this.story) { this.setNotFoundSeo(); return; }
			this.setStorySeo(this.story);
		});
	}

	hasVideo(story: SuccessStory): boolean {
		return story.videoUrls.length > 0;
	}

	private setStorySeo(story: SuccessStory): void {
		if (typeof window === 'undefined') {
			return;
		}

		const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
		const title = `قصة نجاح ${story.name} - ابلكيشن معادلة كلية هندسة`;
		const description = `${story.result}. ${story.quote}`;
		const url = `${siteUrl}/success-stories/${story.id}`;

		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
	}

	private setNotFoundSeo(): void {
		if (typeof window === 'undefined') {
			return;
		}

		const siteUrl = (window as any)['NG_SITE_URL'] || 'https://www.appmo3adla.com';
		const title = 'قصة النجاح غير موجودة - ابلكيشن معادلة كلية هندسة';
		const description = 'هذه القصة غير متاحة حالياً.';
		const url = `${siteUrl}/success-stories`;

		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.canonical.setCanonical(url);
	}
}
