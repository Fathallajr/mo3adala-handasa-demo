import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminAuthInterceptor: HttpInterceptorFn = (req, next) => {
	const auth = inject(AdminAuthService);
	const token = auth.getToken();
	if (!token || req.headers.has('Authorization') || !req.url.includes('/api/')) {
		return next(req);
	}
	return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
