import {Component, Input, OnInit} from '@angular/core';
import {ConversationInfo, MessageInfo, SystemMessageData} from '../../../../models/ChatModels';
import {CollabUserInfo} from '../../../../models/UserModels';
import {SystemMessageType} from '../../../../models/enums';
import {replaceAll} from '../../../../core/util';

@Component({
  selector: 'app-message-system-template',
  templateUrl: './message-system-template.component.html',
  styleUrls: ['./message-system-template.component.scss'],
  standalone: false
})
export class MessageSystemTemplateComponent implements OnInit {
  @Input() message: MessageInfo | undefined;
  @Input() conversation: ConversationInfo | undefined;
  @Input() senderUser: CollabUserInfo | undefined;
  @Input() user: CollabUserInfo | undefined;


  constructor() {
  }

  ngOnInit(): void {

  }

  getText() {
    const senderUserFullName = this.senderUser ? `${this.senderUser.first_name} ${this,this.senderUser.last_name}` : '';
    const userFullName = this.user ? `${this.user.first_name} ${this,this.user.last_name}` : '';
    const data = JSON.parse(this.message?.data ?? '') as SystemMessageData;
    if (data.type_id === SystemMessageType.CreateGroup) {
      if (this.message?.text.includes('%2')) {
        return replaceAll(replaceAll(this.message?.text, '%2', userFullName),
          '%1', senderUserFullName);
      } else {
        return `${senderUserFullName} has created the group "${userFullName}"`;
      }

    }
    return 'Unsupported Message';
  }
}
