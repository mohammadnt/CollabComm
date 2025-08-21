
export enum MediaType {
  none = 0,
  audio = 1,
  image = 2,
  video = 3,
  vtt = 4,
  text = 5,
  file = 6,
  ogg = 7,
}

export enum MethodCode {
  send_message = 1,
  send_message_resposne = 2,
  ping = 3,
  sync = 4,
  CafeNewOrder = 101,
}

export enum SyncMethod {
  seen = 1,
  delete = 2,
}

export enum MessageType {
  text = 1,
  voice = 2,
  system_message = 3,
  file = 4,
  image = 5,
  voice_ogg = 6,
}

export enum SystemMessageType {
  CreateGroup = 1,
}

export enum UserType {
  user = 1,
  group = 2,
  channel = 3,
}
