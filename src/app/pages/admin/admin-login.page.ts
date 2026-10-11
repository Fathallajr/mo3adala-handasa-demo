import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminAuthService } from '../../core/services/admin-auth.service';
import { SeoService } from '../../core/seo.service';

@Component({
	selector: 'app-admin-login-page',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './admin-login.page.html',
	styleUrls: ['./admin-login.page.css']
})
export class AdminLoginPageComponent {
	username = '';
	password = '';
	isSubmitting = false;
	showPassword = false;
	errorMessage = '';

	constructor(
		private auth: AdminAuthService,
		private router: Router,
		private seo: SeoService
	) {
		this.seo.setTitle('تسجيل دخول الإدارة');
		this.seo.setRobots('noindex, nofollow, noarchive');
	}

	submit(): void {
		if (this.isSubmitting) return;
		if (!this.username.trim()) {
			this.errorMessage = 'اكتب اسم المستخدم الأول.';
			return;
		}

		if (!this.password.trim()) {
			this.errorMessage = 'اكتب كلمة المرور الأول.';
			return;
		}

		this.isSubmitting = true;
		this.errorMessage = '';

		this.auth.login({ username: this.username.trim(), password: this.password }).pipe(
			// Always unlock the form, including timeouts and errors thrown while
			// the server is checking a disabled or missing account.
			finalize(() => { this.isSubmitting = false; })
		).subscribe({
			next: () => {
				void this.router.navigateByUrl('/admin');
			},
			error: (error: unknown) => {
				if (error instanceof HttpErrorResponse && error.status === 401) {
					this.errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيح.';
					return;
				}
				if (error instanceof HttpErrorResponse && error.status === 429) {
					this.errorMessage = 'تم إيقاف المحاولات مؤقتًا لكثرتها. انتظر قليلًا ثم حاول مرة أخرى.';
					return;
				}
				if (error instanceof HttpErrorResponse && error.status === 0) {
					this.errorMessage = 'تعذر الاتصال بالسيرفر. حاول مرة أخرى بعد لحظات.';
					return;
				}
				if (error && typeof error === 'object' && 'name' in error && error.name === 'TimeoutError') {
					this.errorMessage = 'السيرفر لم يستجب في الوقت المحدد. حاول مرة أخرى.';
					return;
				}

				this.errorMessage = 'تعذر الوصول إلى السيرفر. تأكد أن API شغال ثم أعد المحاولة.';
			}
		});
	}
}
