import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { fadeInUp } from '../../animations';

@Component({
	selector: 'app-what-is-equation',
	standalone: true,
	imports: [CommonModule],
	animations: [fadeInUp],
	templateUrl: './what-is-equation.component.html',
	styleUrls: ['./what-is-equation.component.css'],
})
export class WhatIsEquationComponent implements OnInit, OnDestroy {
	@Input() title = 'يعني إيه معادلة؟';
	@Input() text = 'اختبار يؤهّلك لدخول كلية الهندسة أو الحاسبات لطلاب الدبلومات والمعاهد والمدارس التكنولوجية. بنوفّر لك شرح مبسّط وخطط مذاكرة وتمارين تساعدك تتأهل وتنجح.';
	isVideoLoaded = false;
	animatedVideos = 0;
	animatedStudents = 0;
	animatedExperience = 0;
	private counterTimer?: ReturnType<typeof setInterval>;

	constructor(private sanitizer: DomSanitizer) {}

	ngOnInit(): void {
		const targets = { videos: 5000, students: 350, experience: 5 };
		if (typeof window === 'undefined') {
			this.animatedVideos = targets.videos;
			this.animatedStudents = targets.students;
			this.animatedExperience = targets.experience;
			return;
		}
		let progress = 0;
		this.counterTimer = setInterval(() => {
			progress = Math.min(progress + 0.08, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			this.animatedVideos = Math.round(targets.videos * eased);
			this.animatedStudents = Math.round(targets.students * eased);
			this.animatedExperience = Math.round(targets.experience * eased);
			if (progress >= 1) this.stopCounter();
		}, 35);
	}

	private stopCounter(): void {
		if (this.counterTimer) clearInterval(this.counterTimer);
		this.counterTimer = undefined;
	}

	ngOnDestroy(): void {
		this.stopCounter();
	}

	loadVideo(): void {
		this.isVideoLoaded = true;
	}

	getVideoThumbnail(): string {
		return 'https://img.youtube.com/vi/KWeC2tNedQs/hqdefault.jpg';
	}

	getVideoEmbedUrl(): SafeResourceUrl {
		return this.sanitizer.bypassSecurityTrustResourceUrl('https://www.youtube.com/embed/KWeC2tNedQs?autoplay=1&rel=0');
	}
}


