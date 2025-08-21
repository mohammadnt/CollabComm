import {MessageType, MethodCode} from './enums';

export interface WebsocketModel {
  identifier: string;
  method: MethodCode;
  data: string;
}


export interface SendMessageWebsocketModel {
  type: MessageType | undefined;
  file_id: string | undefined;
  reply_id: string | undefined;
  forward_message_id: string | undefined;
  forward_conversation_id: string | undefined;
  client_id: string | undefined;
  to_id: string;
  data: string | undefined;
  text: string | undefined;
  is_link: boolean | undefined;
  advanced_forward: boolean | undefined;
};
