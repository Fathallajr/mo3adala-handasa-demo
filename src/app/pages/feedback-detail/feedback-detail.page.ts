import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';

interface PublishedFeedback {
	id: string;
	name: string;
	university?: string;
	rating: number;
	message: string;
}

@Component({
	selector: 'app-feedback-detail-page',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './feedback-detail.page.html',
	styleUrls: ['./feedback-detail.page.css'],
})
export class FeedbackDetailPageComponent implements OnInit {
	feedback: PublishedFeedback | null = null;
	isLoading = true;
	isNotFound = false;
	private readonly endpoint = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001/api/feedback/published' : '/api/feedback/published';

	constructor(private route: ActivatedRoute, private http: HttpClient, private seo: SeoService, private canonical: CanonicalService) {}

	ngOnInit(): void {
		const id = this.route.snapshot.paramMap.get('id') || '';
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const url = `${siteUrl}/feedback/view/${id}`;
		this.seo.setTitle('رأي طالب من أبلكيشن معادلة كلية هندسة');
		this.seo.setDescription('اقرأ تجربة أحد طلاب أبلكيشن معادلة كلية الهندسة بالكامل.');
		this.canonical.setCanonical(url);
		this.http.get<{ data: PublishedFeedback }>(`${this.endpoint}/${encodeURIComponent(id)}`).subscribe({
			next: response => {
				this.feedback = response.data;
				this.isLoading = false;
			},
			error: () => {
				this.isLoading = false;
				this.isNotFound = true;
			}
		});
	}
}
