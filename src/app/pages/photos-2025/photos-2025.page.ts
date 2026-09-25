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
		this.monthlyContent.loadPageState('photos-2025', { visible: true, albums: [{ year: 2025, items: this.studentPhotos2025 }, { year: 2024, items: this.studentPhotos2024 }] }).subscribe((state: any) => {
			if (state?.visible === false) return;
			const albums = Array.isArray(state?.albums) ? state.albums : [];
			const album2025 = albums.find((album: any) => Number(album.year) === 2025);
			const album2024 = albums.find((album: any) => Number(album.year) === 2024);
			if (Array.isArray(album2025?.items) && album2025.items.length) this.studentPhotos2025 = album2025.items;
			if (Array.isArray(album2024?.items) && album2024.items.length) this.studentPhotos2024 = album2024.items;
		});
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
	studentPhotos2025 = [
		'طلاب 2025/WhatsApp Image 2025-10-28 at 16.40.57_bf8b0500.jpg',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.22.25_1031edee.jpg',
		'طلاب 2025/WhatsApp Image 2025-10-28 at 18.52.05_6cf2a0b2.jpg',
		'طلاب 2025/IMG-20251027-WA0015.jpg',
		'طلاب 2025/IMG-20251027-WA0016.jpg',
		'طلاب 2025/IMG-20251027-WA0017.jpg',
		'طلاب 2025/IMG-20251027-WA0018.jpg',
		'طلاب 2025/IMG-20251027-WA0019.jpg',
		'طلاب 2025/IMG-20251027-WA0020.jpg',
		'طلاب 2025/IMG-20251027-WA0021.jpg',
		'طلاب 2025/IMG-20251027-WA0022.jpg',
		'طلاب 2025/IMG-20251027-WA0023.jpg',
		'طلاب 2025/IMG-20251027-WA0086.jpg',
		'طلاب 2025/IMG-20251027-WA0024.jpg',
		'طلاب 2025/IMG-20251027-WA0025.jpg',
		'طلاب 2025/IMG-20251027-WA0026.jpg',
		'طلاب 2025/IMG-20251027-WA0027.jpg',
		'طلاب 2025/IMG-20251027-WA0028.jpg',
		'طلاب 2025/IMG-20251027-WA0029.jpg',
		'طلاب 2025/IMG-20251027-WA0030.jpg',
		'طلاب 2025/IMG-20251027-WA0031.jpg',
		'طلاب 2025/IMG-20251027-WA0032.jpg',
		'طلاب 2025/IMG-20251027-WA0033.jpg',
		'طلاب 2025/IMG-20251027-WA0034.jpg',
		'طلاب 2025/IMG-20251027-WA0035.jpg',
		'طلاب 2025/IMG-20251027-WA0036.jpg',
		'طلاب 2025/IMG-20251027-WA0037.jpg',
		'طلاب 2025/IMG-20251027-WA0038.jpg',
		'طلاب 2025/IMG-20251027-WA0039.jpg',
		'طلاب 2025/IMG-20251027-WA0040.jpg',
		'طلاب 2025/IMG-20251027-WA0041.jpg',
		'طلاب 2025/IMG-20251027-WA0042.jpg',
		'طلاب 2025/IMG-20251027-WA0043.jpg',
		'طلاب 2025/IMG-20251027-WA0044.jpg',
		'طلاب 2025/IMG-20251027-WA0045.jpg',
		'طلاب 2025/IMG-20251027-WA0046.jpg',
		'طلاب 2025/IMG-20251027-WA0047.jpg',
		'طلاب 2025/IMG-20251027-WA0048.jpg',
		'طلاب 2025/IMG-20251027-WA0049.jpg',
		'طلاب 2025/IMG-20251027-WA0050.jpg',
		'طلاب 2025/IMG-20251027-WA0051.jpg',
		'طلاب 2025/IMG-20251027-WA0052.jpg',
		'طلاب 2025/IMG-20251027-WA0053.jpg',
		'طلاب 2025/IMG-20251027-WA0054.jpg',
		'طلاب 2025/IMG-20251027-WA0055.jpg',
		'طلاب 2025/IMG-20251027-WA0056.jpg',
		'طلاب 2025/IMG-20251027-WA0057.jpg',
		'طلاب 2025/IMG-20251027-WA0058.jpg',
		'طلاب 2025/IMG-20251027-WA0059.jpg',
		'طلاب 2025/IMG-20251027-WA0060.jpg',
		'طلاب 2025/IMG-20251027-WA0061.jpg',
		'طلاب 2025/IMG-20251027-WA0062.jpg',
		'طلاب 2025/IMG-20251027-WA0063.jpg',
		'طلاب 2025/IMG-20251027-WA0064.jpg',
		'طلاب 2025/IMG-20251027-WA0065.jpg',
		'طلاب 2025/IMG-20251027-WA0066.jpg',
		'طلاب 2025/IMG-20251027-WA0067.jpg',
		'طلاب 2025/IMG-20251027-WA0068.jpg',
		'طلاب 2025/IMG-20251027-WA0069.jpg',
		'طلاب 2025/IMG-20251027-WA0070.jpg',
		'طلاب 2025/IMG-20251027-WA0071.jpg',
		'طلاب 2025/IMG-20251027-WA0072.jpg',
		'طلاب 2025/IMG-20251027-WA0073.jpg',
		'طلاب 2025/IMG-20251027-WA0074.jpg',
		'طلاب 2025/IMG-20251027-WA0076.jpg',
		'طلاب 2025/IMG-20251027-WA0077.jpg',
		'طلاب 2025/IMG-20251027-WA0078.jpg',
		'طلاب 2025/IMG-20251027-WA0079.jpg',
		'طلاب 2025/IMG-20251027-WA0080.jpg',
		'طلاب 2025/IMG-20251027-WA0081.jpg',
		'طلاب 2025/IMG-20251027-WA0082.jpg',
		'طلاب 2025/IMG-20251027-WA0083.jpg',
		'طلاب 2025/IMG-20251027-WA0084.jpg',
		'طلاب 2025/IMG-20251027-WA0085.jpg'
	];

	studentPhotos2024 = [
		'طلاب 2024/IMG-20251028-WA0010.jpg',
		'طلاب 2024/IMG-20251028-WA0011.jpg',
		'طلاب 2024/IMG-20251028-WA0012.jpg',
		'طلاب 2024/IMG-20251028-WA0013.jpg',
		'طلاب 2024/IMG-20251028-WA0014.jpg',
		'طلاب 2024/IMG-20251028-WA0015.jpg',
		'طلاب 2024/IMG-20251028-WA0016.jpg',
		'طلاب 2024/IMG-20251028-WA0017.jpg',
		'طلاب 2024/IMG-20251028-WA0018.jpg',
		'طلاب 2024/IMG-20251028-WA0019.jpg',
		'طلاب 2024/IMG-20251028-WA0020.jpg',
		'طلاب 2024/IMG-20251028-WA0021.jpg',
		'طلاب 2024/IMG-20251028-WA0022.jpg',
		'طلاب 2024/IMG-20251028-WA0023.jpg',
		'طلاب 2024/IMG-20251028-WA0024.jpg',
		'طلاب 2024/IMG-20251028-WA0025.jpg',
		'طلاب 2024/IMG-20251028-WA0026.jpg',
		'طلاب 2024/IMG-20251028-WA0027.jpg',
		'طلاب 2024/IMG-20251028-WA0028.jpg',
		'طلاب 2024/IMG-20251028-WA0029.jpg',
		'طلاب 2024/IMG-20251028-WA0030.jpg',
		'طلاب 2024/IMG-20251028-WA0031.jpg',
		'طلاب 2024/IMG-20251028-WA0032.jpg',
		'طلاب 2024/IMG-20251028-WA0033.jpg',
		'طلاب 2024/IMG-20251028-WA0034.jpg',
		'طلاب 2024/IMG-20251028-WA0035.jpg',
		'طلاب 2024/IMG-20251028-WA0036.jpg',
		'طلاب 2024/IMG-20251028-WA0037.jpg',
		'طلاب 2024/IMG-20251028-WA0038.jpg',
		'طلاب 2024/IMG-20251028-WA0039.jpg',
		'طلاب 2024/IMG-20251028-WA0040.jpg',
		'طلاب 2024/IMG-20251028-WA0041.jpg',
		'طلاب 2024/IMG-20251028-WA0042.jpg',
		'طلاب 2024/IMG-20251028-WA0043.jpg',
		'طلاب 2024/IMG-20251028-WA0044.jpg',
		'طلاب 2024/IMG-20251028-WA0045.jpg',
		'طلاب 2024/IMG-20251028-WA0046.jpg',
		'طلاب 2024/IMG-20251028-WA0047.jpg',
		'طلاب 2024/IMG-20251028-WA0048.jpg',
		'طلاب 2024/IMG-20251028-WA0049.jpg',
		'طلاب 2024/IMG-20251028-WA0050.jpg',
		'طلاب 2024/IMG-20251028-WA0051.jpg',
		'طلاب 2024/IMG-20251028-WA0052.jpg',
		'طلاب 2024/IMG-20251028-WA0053.jpg',
		'طلاب 2024/IMG-20251028-WA0054.jpg',
		'طلاب 2024/IMG-20251028-WA0055.jpg',
		'طلاب 2024/IMG-20251028-WA0056.jpg',
		'طلاب 2024/IMG-20251028-WA0057.jpg',
		'طلاب 2024/IMG-20251028-WA0058.jpg',
		'طلاب 2024/IMG-20251028-WA0059.jpg',
		'طلاب 2024/IMG-20251029-WA0060.jpg',
		'طلاب 2024/IMG-20251029-WA0061.jpg'
	];
}


