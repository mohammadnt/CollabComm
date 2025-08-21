import {ConversationInfo, MessageInfo, SystemMessageData} from "../../models/ChatModels";
import {MessageType, SystemMessageType} from '../../models/enums';
import {replaceAll} from '../util';
import {CollabUserInfo} from '../../models/UserModels';

export function getMessageSummary(message: MessageInfo | undefined, conversation: ConversationInfo | undefined, senderUser: CollabUserInfo | undefined) {
  if (!message) {
    return '';
  }
  switch (message.type as MessageType) {
    case MessageType.text:
      return message.text;
    case MessageType.voice:
      return 'voice';
    case MessageType.voice_ogg:
      return 'voice';
    case MessageType.file:
      return 'file';
    case MessageType.image:
      return 'photo';
    case MessageType.system_message:
      if (!conversation) {
        return 'Forbidden';
      }
      const user = conversation.user;
      const data = JSON.parse(message?.data ?? '') as SystemMessageData;
      if (data.type_id === SystemMessageType.CreateGroup) {
        const userFullName = user ? `${user?.first_name} ${user?.last_name}` : '';
        if (message?.text.includes('%2')) {
          return replaceAll(replaceAll(message?.text, '%2', userFullName),
            '%1', senderUser ? `${senderUser?.first_name} ${senderUser?.last_name}` : '');
        } else {
          return `${senderUser?.first_name} ${senderUser?.last_name} has created the group "${userFullName}"`;
        }

      }
      return 'Unsupported Message';
  }
  return 'Unknown Message';

}


