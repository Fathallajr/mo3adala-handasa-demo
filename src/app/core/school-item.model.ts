export interface SchoolItem {
	id?: number;
	name: string;
	type: string;
	category: string;
	logo: string;
	programs: Array<'engineering' | 'computers'>;
}
