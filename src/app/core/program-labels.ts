/**
 * User-facing program labels. Internal program values intentionally stay
 * unchanged so existing leads, filters, exports, and API integrations keep
 * working without a data migration.
 */
export function displayProgramLabel(value: string | null | undefined): string {
	if (!value) return value || '';
	return value
		.replace(/(معادلة|اشتراك) (هندسة|حاسبات) (إنجليزي|انجليزي)/g, '$1 $2 لغات')
		.replace(/(هندسة|حاسبات) (إنجليزي|انجليزي)/g, '$1 لغات')
		.replace(/مهندسين المعادلة (إنجليزي|انجليزي)/g, 'مهندسين المعادلة لغات');
}
