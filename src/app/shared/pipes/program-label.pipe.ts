import { Pipe, PipeTransform } from '@angular/core';
import { displayProgramLabel } from '../../core/program-labels';

@Pipe({ name: 'programLabel', standalone: true })
export class ProgramLabelPipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		return displayProgramLabel(value);
	}
}
