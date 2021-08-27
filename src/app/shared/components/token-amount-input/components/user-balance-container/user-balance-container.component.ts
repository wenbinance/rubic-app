import { Component, ChangeDetectionStrategy, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-user-balance-container',
  templateUrl: './user-balance-container.component.html',
  styleUrls: ['./user-balance-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserBalanceContainerComponent {
  @Input() public token;

  @Input() public type: 'from' | 'to';

  @Input() public hide: 'maxButton' | 'balance';

  @Output() public maxButtonClickEvent: EventEmitter<void>;

  constructor() {
    this.maxButtonClickEvent = new EventEmitter<void>();
  }

  public maxButtonClick(): void {
    this.maxButtonClickEvent.emit();
  }
}
