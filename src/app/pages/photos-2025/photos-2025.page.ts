import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { fadeInUp, staggerList } from '../../shared/animations';
import { SeoService } from '../../core/seo.service';
import { CanonicalService } from '../../core/canonical.service';

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
	photoAlbums: Array<{ year: number; photos: string[] }> = [];

	constructor(private seo: SeoService, private canonical: CanonicalService) {
		const siteUrl = (typeof window !== 'undefined' ? (window as any)['NG_SITE_URL'] : process.env['NG_SITE_URL']) || 'https://www.appmo3adla.com';
		const title = 'صور الطلاب الناجحين 2025 - معادلة كلية هندسة';
		const description = 'شاهد صور طلاب أبلكيشن معادلة كلية الهندسة الناجحين وتجاربهم بعد اجتياز المعادلة.';
    const url = `${siteUrl}/graduation-photos`;
		this.seo.setTitle(title);
		this.seo.setDescription(description);
		this.seo.setOgTags({ title, description, url });
		this.seo.setTwitterTags({ title, description });
		this.canonical.setCanonical(url);
	}

	ngOnInit(): void {
		// The YAS WEBP batch is the 2026 graduation set. Keep it separate and
		// first, while the older hard-coded albums remain below it.
		const photos2026 = this.studentPhotos2025.filter(photo => photo.includes('/YAS_'));
		const photos2025 = this.studentPhotos2025.filter(photo => !photo.includes('/YAS_'));
		this.photoAlbums = [
			{ year: 2026, photos: this.shufflePhotos(photos2026) },
			{ year: 2025, photos: this.shufflePhotos(photos2025) },
			{ year: 2024, photos: this.shufflePhotos(this.studentPhotos2024) }
		];
		this.studentPhotos = this.photoAlbums.flatMap(album => album.photos);
	}

	private shufflePhotos(photos: string[]): string[] {
		const shuffled = [...photos];
		for (let index = shuffled.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
		}
		return shuffled;
	}

	photoSrc(photo: string): string {
		return '/' + ['assets', ...photo.split('/')].map(segment => encodeURIComponent(segment)).join('/');
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
		'طلاب 2025/IMG-20251027-WA0085.webp',
		'طلاب 2025/YAS_1459.webp',
		'طلاب 2025/YAS_1460.webp',
		'طلاب 2025/YAS_1461.webp',
		'طلاب 2025/YAS_1462.webp',
		'طلاب 2025/YAS_1463.webp',
		'طلاب 2025/YAS_1464.webp',
		'طلاب 2025/YAS_1465.webp',
		'طلاب 2025/YAS_1466.webp',
		'طلاب 2025/YAS_1467.webp',
		'طلاب 2025/YAS_1468.webp',
		'طلاب 2025/YAS_1469.webp',
		'طلاب 2025/YAS_1470.webp',
		'طلاب 2025/YAS_1471.webp',
		'طلاب 2025/YAS_1472.webp',
		'طلاب 2025/YAS_1473.webp',
		'طلاب 2025/YAS_1474.webp',
		'طلاب 2025/YAS_1475.webp',
		'طلاب 2025/YAS_1476.webp',
		'طلاب 2025/YAS_1477.webp',
		'طلاب 2025/YAS_1478.webp',
		'طلاب 2025/YAS_1479.webp',
		'طلاب 2025/YAS_1481.webp',
		'طلاب 2025/YAS_1482.webp',
		'طلاب 2025/YAS_1483.webp',
		'طلاب 2025/YAS_1484.webp',
		'طلاب 2025/YAS_1485.webp',
		'طلاب 2025/YAS_1486.webp',
		'طلاب 2025/YAS_1487.webp',
		'طلاب 2025/YAS_1489.webp',
		'طلاب 2025/YAS_1490.webp',
		'طلاب 2025/YAS_1491.webp',
		'طلاب 2025/YAS_1492.webp',
		'طلاب 2025/YAS_1493.webp',
		'طلاب 2025/YAS_1495.webp',
		'طلاب 2025/YAS_1497.webp',
		'طلاب 2025/YAS_1498.webp',
		'طلاب 2025/YAS_1499.webp',
		'طلاب 2025/YAS_1500.webp',
		'طلاب 2025/YAS_1501.webp',
		'طلاب 2025/YAS_1502.webp',
		'طلاب 2025/YAS_1503.webp',
		'طلاب 2025/YAS_1504.webp',
		'طلاب 2025/YAS_1505.webp',
		'طلاب 2025/YAS_1507.webp',
		'طلاب 2025/YAS_1508.webp',
		'طلاب 2025/YAS_1509.webp',
		'طلاب 2025/YAS_1511.webp',
		'طلاب 2025/YAS_1513.webp',
		'طلاب 2025/YAS_1515.webp',
		'طلاب 2025/YAS_1517.webp',
		'طلاب 2025/YAS_1518.webp',
		'طلاب 2025/YAS_1523.webp',
		'طلاب 2025/YAS_1524.webp',
		'طلاب 2025/YAS_1525.webp',
		'طلاب 2025/YAS_1527.webp',
		'طلاب 2025/YAS_1528.webp',
		'طلاب 2025/YAS_1529.webp',
		'طلاب 2025/YAS_1531.webp',
		'طلاب 2025/YAS_1532.webp',
		'طلاب 2025/YAS_1534.webp'
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

