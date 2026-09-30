import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { adminAuthInterceptor } from './core/interceptors/admin-auth.interceptor';

export const appConfig: ApplicationConfig = {
	providers: [
		// Keep route chunks lazy. PreloadAllModules downloads every page (including
		// the admin dashboard) immediately after the first paint.
		provideRouter(routes),
		provideClientHydration(),
		provideAnimations(),
		provideHttpClient(withInterceptors([adminAuthInterceptor])),
	],
};
