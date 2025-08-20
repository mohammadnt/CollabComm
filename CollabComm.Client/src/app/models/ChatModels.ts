import {CollabUserInfo} from './UserModels';

export interface CommonGroupResponse{
  groups: CollabUserInfo[];
  user: CollabUserInfo;
}
export interface ConversationInfo {
  id: string;
  creation_date: string;
  from_id: string;
  to_id: string;
  unread_count: number;
  last_message_counter: number;
  last_message_id: string;
  last_message_date: string | undefined;
  pin: number;
  mute: boolean;
  block: boolean;
  favorite: boolean;
  last_seen_id: string;
  last_seen_counter: number;
  pin_message_id: number;
  last_read_counter: number;
  first_message_id: string;
  deleted: boolean;

  last_message: MessageInfo | undefined;
  user: CollabUserInfo | undefined;
  user_group: UserGroupInfo | undefined;
}

export interface ConversationResponse {
  conversations: ConversationInfo[];
  user_groups: UserGroupInfo[];
  users: CollabUserInfo[];
  is_chat_super_admin: boolean;
}

export interface UserGroupInfo {
  id: string;
  creation_date: string;
  user_id: string;
  group_id: string;
  is_owner: boolean;
  is_admin: boolean;
  last_seen_id: string;
  last_seen_counter: number;
  creator_userids: string[];
  deleted: boolean;
  pin: boolean;
  mute: boolean;
  favorite: boolean;
  first_message_id: string;

  user: CollabUserInfo;
}

export interface ContactInfo {
  id: string;
  creation_date: string;
  title: string;
  user_id: string;
  target_id: string;
  mobile: string;
  deleted: boolean;

  user: CollabUserInfo;
}

export interface FullConversationInfo {
  conversation: ConversationInfo;
  user: CollabUserInfo;
  user_group: UserGroupInfo;
}

export interface MessageInfo {
  id: string;
  from_id: string;
  to_id: string;
  conversation_counter: number;
  creation_date: string;
  data: string | undefined;
  deleted: boolean;
  forward_id: string | undefined;
  forward_user_id: string | undefined;
  is_delivered: boolean;
  media_id: string | undefined;
  media_path: string | undefined;
  text: string;
  type: number;
  original_from_id: string | undefined;
  original_to_id: string | undefined;
  read_date: string | undefined;
  reply_id: string | undefined;
  user_counter: number | undefined;
  is_group: boolean;
  is_sender: boolean | undefined;

  is_local: boolean;
  user: CollabUserInfo | undefined;
  fakeData: FakeMessageData;
}

export interface FakeMessageData {
  subscriber: any;
  uploadRatio: number;
  isFailed: boolean;
  imageUri: string | undefined;
}

export interface FileData {
  width: number;
  height: number;
  size: number;
  duration: string;
  org_file_name: string;
  file_name: string;
  // location: MessageLocationDataModelErlang;
  // call_data: MessageCallDataModelErlang;
  // bot: BotDataModelErlang;
  // MessageTextStyleErlang: repeated;
  // sticker: StickerMessageErlang;
}

export interface SystemMessageData {
  id: string;
  type_id: number;
  value: string;
}

export interface SyncInfo {
  from_id: string;
  to_id: string;
  value: string;
  method: number;
}

export interface SeenModel {
  seen_id: string;
  seen_counter: number;
}

export interface DeleteMessageModel {
  message_id: string;
}
