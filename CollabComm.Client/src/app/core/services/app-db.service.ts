import {Injectable} from '@angular/core';
import {MessageInfo} from '../../models/ChatModels';
import {db} from "./app-db";
import {CollabUserInfo} from '../../models/UserModels';

@Injectable({
  providedIn: 'root'
})
export class AppDbService {

  constructor() {

  }


  async putUsers(users: CollabUserInfo[]) {
    const x = await db.userItems;
    if (x) {
      x.bulkPut(users);
    } else {
    }
  }

  async getUsers(userIds: string[]) {
    const x = await db.userItems;
    if (x) {
      return (x).bulkGet(userIds);
    } else {
      const t: (CollabUserInfo | undefined)[] = [];
      return new Promise<(CollabUserInfo | undefined)[]>((resolve, reject) => resolve(t));
    }
  }

  async putMessages(msgs: MessageInfo[]) {
    const x = await db.messageItems;
    if (x) {
      await x.bulkPut(msgs);
    } else {
    }

  }

  async tryToUpdateMessages(msgs: MessageInfo[]) {
    const haveMsgs = await this.getMessages(msgs.map(s => s.id));
    var newMsgs: MessageInfo[] = [];
    haveMsgs.forEach(oldMsg => {
      if (oldMsg) {
        var newMsg = msgs.find(s => s.id == oldMsg.id);
        if (newMsg) {
          newMsgs.push(newMsg)
        }
      }
    });

    this.putMessages(newMsgs)

  }

  async getMessages(msgIds: string[]) : Promise<(MessageInfo | undefined)[]> {
    const x = await db.messageItems;
    if (x) {
      return x.bulkGet(msgIds);
    } else {
      const t: (MessageInfo | undefined)[] = [];
      return t;
    }
  }
}
