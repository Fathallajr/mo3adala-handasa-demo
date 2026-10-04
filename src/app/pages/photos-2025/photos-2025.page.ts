import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp, staggerList } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';
import { MonthlyContentService } from '../../core/services/monthly-content.service';

@Component({
	selector: 'app-photos-2025-page',
	standalone: true,
	imports: [CommonModule, RouterLink],
	animations: [fadeInUp, staggerList],
	templateUrl: './photos-2025.page.html',
	styleUrls: ['./photos-2025.page.css'],
})
export class Photos2025PageComponent implements OnInit {
	selectedPhoto: string | null = null;

	constructor(private seo: SeoService, private canonical: CanonicalService, private monthlyContent: MonthlyContentService) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'صور الطلاب الناجحين 2025 - معادلة كلية هندسة';
		const description = 'شاهد صور طلاب أبلكيشن معادلة كلية الهندسة الناجحين وتجاربهم بعد اجتياز المعادلة.';
		const url = `${siteUrl}/photos-2025`;
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
	}

	ngOnInit(): void {
		this.studentPhotos = this.shufflePhotos([...this.studentPhotos2025, ...this.studentPhotos2024]);
		this.monthlyContent.loadPageState('photos-2025', { visible: true, albums: [{ year: 2025, items: this.studentPhotos2025 }, { year: 2024, items: this.studentPhotos2024 }] }).subscribe((state: any) => {
			if (state?.visible === false) return;
			const albums = Array.isArray(state?.albums) ? state.albums : [];
			const album2025 = albums.find((album: any) => Number(album.year) === 2025);
			const album2024 = albums.find((album: any) => Number(album.year) === 2024);
			const photos2025 = Array.isArray(album2025?.items) && album2025.items.length ? album2025.items : this.studentPhotos2025;
			const photos2024 = Array.isArray(album2024?.items) && album2024.items.length ? album2024.items : this.studentPhotos2024;
			this.studentPhotos = this.shufflePhotos([...photos2025, ...photos2024]);
		});
	}

	private shufflePhotos(photos: string[]): string[] {
		const shuffled = [...photos];
		for (let index = shuffled.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
		}
		return shuffled;
	}

	openPhoto(photo: string) {
		this.selectedPhoto = photo;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'hidden';
		}
	}

	closePhoto() {
		this.selectedPhoto = null;
		if (typeof document !== 'undefined') {
			document.body.style.overflow = 'auto';
		}
	}

	studentPhotos: string[] = [];
	studentPhotos2025 = [
		'طلاب 2025/WhatsApp Image 2025-10-28 at 16.40.57_bf8b0500.webp',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.22.25_1031edee.webp',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.52.05_6cf2a0b2.webp',
		'طلاب 2025/IMG-20251027-WA0015.webp',
		'طلاب 2025/IMG-20251027-WA0016.webp',
		'طلاب 2025/IMG-20251027-WA0017.webp',
		'طلاب 2025/IMG-20251027-WA0018.webp',
		'طلاب 2025/IMG-20251027-WA0019.webp',
		'طلاب 2025/IMG-20251027-WA0020.webp',
		'طلاب 2025/IMG-20251027-WA0021.webp',
		'طلاب 2025/IMG-20251027-WA0022.webp',
		'طلاب 2025/IMG-20251027-WA0023.webp',
		'طلاب 2025/IMG-20251027-WA0086.webp',
		'طلاب 2025/IMG-20251027-WA0024.webp',
		'طلاب 2025/IMG-20251027-WA0025.webp',
		'طلاب 2025/IMG-20251027-WA0026.webp',
		'طلاب 2025/IMG-20251027-WA0027.webp',
		'طلاب 2025/IMG-20251027-WA0028.webp',
		'طلاب 2025/IMG-20251027-WA0029.webp',
		'طلاب 2025/IMG-20251027-WA0030.webp',
		'طلاب 2025/IMG-20251027-WA0031.webp',
		'طلاب 2025/IMG-20251027-WA0032.webp',
		'طلاب 2025/IMG-20251027-WA0033.webp',
		'طلاب 2025/IMG-20251027-WA0034.webp',
		'طلاب 2025/IMG-20251027-WA0035.webp',
		'طلاب 2025/IMG-20251027-WA0036.webp',
		'طلاب 2025/IMG-20251027-WA0037.webp',
		'طلاب 2025/IMG-20251027-WA0038.webp',
		'طلاب 2025/IMG-20251027-WA0039.webp',
		'طلاب 2025/IMG-20251027-WA0040.webp',
		'طلاب 2025/IMG-20251027-WA0041.webp',
		'طلاب 2025/IMG-20251027-WA0042.webp',
		'طلاب 2025/IMG-20251027-WA0043.webp',
		'طلاب 2025/IMG-20251027-WA0044.webp',
		'طلاب 2025/IMG-20251027-WA0045.webp',
		'طلاب 2025/IMG-20251027-WA0046.webp',
		'طلاب 2025/IMG-20251027-WA0047.webp',
		'طلاب 2025/IMG-20251027-WA0048.webp',
		'طلاب 2025/IMG-20251027-WA0049.webp',
		'طلاب 2025/IMG-20251027-WA0050.webp',
		'طلاب 2025/IMG-20251027-WA0051.webp',
		'طلاب 2025/IMG-20251027-WA0052.webp',
		'طلاب 2025/IMG-20251027-WA0053.webp',
		'طلاب 2025/IMG-20251027-WA0054.webp',
		'طلاب 2025/IMG-20251027-WA0055.webp',
		'طلاب 2025/IMG-20251027-WA0056.webp',
		'طلاب 2025/IMG-20251027-WA0057.webp',
		'طلاب 2025/IMG-20251027-WA0058.webp',
		'طلاب 2025/IMG-20251027-WA0059.webp',
		'طلاب 2025/IMG-20251027-WA0060.webp',
		'طلاب 2025/IMG-20251027-WA0061.webp',
		'طلاب 2025/IMG-20251027-WA0062.webp',
		'طلاب 2025/IMG-20251027-WA0063.webp',
		'طلاب 2025/IMG-20251027-WA0064.webp',
		'طلاب 2025/IMG-20251027-WA0065.webp',
		'طلاب 2025/IMG-20251027-WA0066.webp',
		'طلاب 2025/IMG-20251027-WA0067.webp',
		'طلاب 2025/IMG-20251027-WA0068.webp',
		'طلاب 2025/IMG-20251027-WA0069.webp',
		'طلاب 2025/IMG-20251027-WA0070.webp',
		'طلاب 2025/IMG-20251027-WA0071.webp',
		'طلاب 2025/IMG-20251027-WA0072.webp',
		'طلاب 2025/IMG-20251027-WA0073.webp',
		'طلاب 2025/IMG-20251027-WA0074.webp',
		'طلاب 2025/IMG-20251027-WA0076.webp',
		'طلاب 2025/IMG-20251027-WA0077.webp',
		'طلاب 2025/IMG-20251027-WA0078.webp',
		'طلاب 2025/IMG-20251027-WA0079.webp',
		'طلاب 2025/IMG-20251027-WA0080.webp',
		'طلاب 2025/IMG-20251027-WA0081.webp',
		'طلاب 2025/IMG-20251027-WA0082.webp',
		'طلاب 2025/IMG-20251027-WA0083.webp',
		'طلاب 2025/IMG-20251027-WA0084.webp',
		'طلاب 2025/IMG-20251027-WA0085.webp'
	];

	studentPhotos2024 = [
		'طلاب 2024/IMG-20251028-WA0010.webp',
		'طلاب 2024/IMG-20251028-WA0011.webp',
		'طلاب 2024/IMG-20251028-WA0012.webp',
		'طلاب 2024/IMG-20251028-WA0013.webp',
		'طلاب 2024/IMG-20251028-WA0014.webp',
		'طلاب 2024/IMG-20251028-WA0015.webp',
		'طلاب 2024/IMG-20251028-WA0016.webp',
		'طلاب 2024/IMG-20251028-WA0017.webp',
		'طلاب 2024/IMG-20251028-WA0018.webp',
		'طلاب 2024/IMG-20251028-WA0019.webp',
		'طلاب 2024/IMG-20251028-WA0020.webp',
		'طلاب 2024/IMG-20251028-WA0021.webp',
		'طلاب 2024/IMG-20251028-WA0022.webp',
		'طلاب 2024/IMG-20251028-WA0023.webp',
		'طلاب 2024/IMG-20251028-WA0024.webp',
		'طلاب 2024/IMG-20251028-WA0025.webp',
		'طلاب 2024/IMG-20251028-WA0026.webp',
		'طلاب 2024/IMG-20251028-WA0027.webp',
		'طلاب 2024/IMG-20251028-WA0028.webp',
		'طلاب 2024/IMG-20251028-WA0029.webp',
		'طلاب 2024/IMG-20251028-WA0030.webp',
		'طلاب 2024/IMG-20251028-WA0031.webp',
		'طلاب 2024/IMG-20251028-WA0032.webp',
		'طلاب 2024/IMG-20251028-WA0033.webp',
		'طلاب 2024/IMG-20251028-WA0034.webp',
		'طلاب 2024/IMG-20251028-WA0035.webp',
		'طلاب 2024/IMG-20251028-WA0036.webp',
		'طلاب 2024/IMG-20251028-WA0037.webp',
		'طلاب 2024/IMG-20251028-WA0038.webp',
		'طلاب 2024/IMG-20251028-WA0039.webp',
		'طلاب 2024/IMG-20251028-WA0040.webp',
		'طلاب 2024/IMG-20251028-WA0041.webp',
		'طلاب 2024/IMG-20251028-WA0042.webp',
		'طلاب 2024/IMG-20251028-WA0043.webp',
		'طلاب 2024/IMG-20251028-WA0044.webp',
		'طلاب 2024/IMG-20251028-WA0045.webp',
		'طلاب 2024/IMG-20251028-WA0046.webp',
		'طلاب 2024/IMG-20251028-WA0047.webp',
		'طلاب 2024/IMG-20251028-WA0048.webp',
		'طلاب 2024/IMG-20251028-WA0049.webp',
		'طلاب 2024/IMG-20251028-WA0050.webp',
		'طلاب 2024/IMG-20251028-WA0051.webp',
		'طلاب 2024/IMG-20251028-WA0052.webp',
		'طلاب 2024/IMG-20251028-WA0053.webp',
		'طلاب 2024/IMG-20251028-WA0054.webp',
		'طلاب 2024/IMG-20251028-WA0055.webp',
		'طلاب 2024/IMG-20251028-WA0056.webp',
		'طلاب 2024/IMG-20251028-WA0057.webp',
		'طلاب 2024/IMG-20251028-WA0058.webp',
		'طلاب 2024/IMG-20251028-WA0059.webp',
		'طلاب 2024/IMG-20251029-WA0060.webp',
		'طلاب 2024/IMG-20251029-WA0061.webp'
	];
}

