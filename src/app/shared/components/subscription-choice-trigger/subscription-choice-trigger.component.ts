import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
	selector: 'app-subscription-choice-trigger',
	standalone: true,
	imports: [CommonModule, RouterLink],
	templateUrl: './subscription-choice-trigger.component.html',
	styleUrls: ['./subscription-choice-trigger.component.css'],
	encapsulation: ViewEncapsulation.None
})
export class SubscriptionChoiceTriggerComponent {
	@Input() label = 'ابدأ الآن';
	@Input() buttonClass = '';
	showChoices = false;

	toggle(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.showChoices = !this.showChoices;
	}

	close(): void {
		this.showChoices = false;
	}
}
