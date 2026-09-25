import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
	username = 'jr1';
	password = '';
	isSubmitting = false;
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

		this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
			next: () => {
				this.isSubmitting = false;
				void this.router.navigateByUrl('/admin');
			},
			error: (error: unknown) => {
				this.isSubmitting = false;
				if (error instanceof HttpErrorResponse && error.status === 401) {
					this.errorMessage = 'اسم المستخدم أو كلمة المرور غير صحيح.';
					return;
				}

				this.errorMessage = 'تعذر الوصول إلى السيرفر. تأكد أن API شغال ثم أعد المحاولة.';
			}
		});
	}
}
