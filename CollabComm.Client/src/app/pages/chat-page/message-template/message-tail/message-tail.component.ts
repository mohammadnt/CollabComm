import {Component, Input} from '@angular/core';
import {MessageInfo} from '../../../../models/ChatModels';
import {MessageType} from '../../../../models/enums';

@Component({
  selector: 'app-message-tail',
  templateUrl: './message-tail.component.html',
  styleUrls: ['./message-tail.component.scss'],
  standalone: false
})
export class MessageTailComponent {
  @Input() message: MessageInfo | undefined;

  protected readonly MessageType = MessageType;
}
