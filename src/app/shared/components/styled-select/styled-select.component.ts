import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
	selector: 'app-styled-select',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './styled-select.component.html',
	styleUrls: ['./styled-select.component.css'],
	providers: [{
		provide: NG_VALUE_ACCESSOR,
		useExisting: forwardRef(() => StyledSelectComponent),
		multi: true
	}]
})
export class StyledSelectComponent implements ControlValueAccessor {
	@Input() options: string[] = [];
	@Input() placeholder = 'اختار';
	@Input() name = '';

	value = '';
	isOpen = false;
	isDisabled = false;

	private onChange: (value: string) => void = () => {};
	private onTouched: () => void = () => {};

	constructor(private elementRef: ElementRef<HTMLElement>) {}

	writeValue(value: string | null): void {
		this.value = value || '';
	}

	registerOnChange(fn: (value: string) => void): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: () => void): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.isDisabled = isDisabled;
		if (isDisabled) this.isOpen = false;
	}

	toggle(): void {
		if (!this.isDisabled) this.isOpen = !this.isOpen;
	}

	select(option: string): void {
		if (this.isDisabled) return;
		this.value = option;
		this.onChange(option);
		this.onTouched();
		this.isOpen = false;
	}

	@HostListener('document:click', ['$event'])
	onDocumentClick(event: Event): void {
		if (!this.elementRef.nativeElement.contains(event.target as Node)) {
			this.isOpen = false;
		}
	}
}
