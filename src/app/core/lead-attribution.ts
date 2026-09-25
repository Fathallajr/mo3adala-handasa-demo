export interface LeadAttribution {
	platform?: string;
	campaign?: string;
	adSet?: string;
	ad?: string;
	medium?: string;
	content?: string;
	landingPage?: string;
	referrer?: string;
}

const STORAGE_KEY = 'lead-attribution-v1';

function firstValue(params: URLSearchParams, ...keys: string[]): string {
	for (const key of keys) {
		const value = params.get(key)?.trim();
		if (value) return value.slice(0, 300);
	}
	return '';
}

function detectPlatform(params: URLSearchParams): string {
	const source = firstValue(params, 'utm_source', 'source').toLowerCase();
	if (source) {
		if (source.includes('facebook') || source === 'fb' || source.includes('meta')) return 'فيسبوك';
		if (source.includes('instagram') || source === 'ig') return 'إنستجرام';
		if (source.includes('tiktok') || source.includes('tik-tok')) return 'تيك توك';
		if (source.includes('youtube') || source === 'yt') return 'يوتيوب';
		return source.slice(0, 300);
	}
	if (params.has('fbclid')) return 'فيسبوك';
	if (params.has('ttclid')) return 'تيك توك';
	if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) return 'جوجل';
	return '';
}

export function captureLeadAttribution(): LeadAttribution {
	if (typeof window === 'undefined') return {};
	const params = new URLSearchParams(window.location.search);
	let previous: LeadAttribution = {};
	try { previous = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch { previous = {}; }
	const current: LeadAttribution = {
		platform: detectPlatform(params),
		campaign: firstValue(params, 'utm_campaign', 'campaign'),
		adSet: firstValue(params, 'utm_adset', 'utm_adset_name', 'adset', 'adset_name'),
		ad: firstValue(params, 'utm_content', 'utm_ad', 'utm_ad_name', 'ad', 'ad_name'),
		medium: firstValue(params, 'utm_medium'),
		content: firstValue(params, 'utm_term'),
		landingPage: window.location.pathname,
		referrer: document.referrer
	};
	const merged = Object.fromEntries(Object.entries({ ...previous, ...current }).filter(([, value]) => value));
	try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch { /* storage may be blocked */ }
	return merged;
}
