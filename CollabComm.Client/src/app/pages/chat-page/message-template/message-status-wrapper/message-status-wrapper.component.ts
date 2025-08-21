import {Component, Input} from '@angular/core';
import {ConversationInfo, MessageInfo} from '../../../../models/ChatModels';
import {MessageType} from '../../../../models/enums';
import { faExclamation } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-message-status-wrapper',
  templateUrl: './message-status-wrapper.component.html',
  styleUrls: ['./message-status-wrapper.component.scss'],
  standalone: false
})
export class MessageStatusWrapperComponent {
  @Input() message: MessageInfo | undefined;
  @Input() conversation: ConversationInfo | undefined;

  protected readonly MessageType = MessageType;

  getMessageDate(message: MessageInfo) {
    const date = new Date(message.creation_date);
    return `${date.getHours().twoDigit()}:${date.getMinutes().twoDigit()}`;
  }

  protected readonly faExclamation = faExclamation;
}
