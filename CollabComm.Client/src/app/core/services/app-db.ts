import {MessageInfo} from "../../models/ChatModels";
import Dexie from "dexie";
import Table = Dexie.Table;
import {CollabUserInfo} from '../../models/UserModels';


export class AppDB {


  get userItems(): Promise<Table<CollabUserInfo, string> | undefined> {
    return this.Ready.then(() => {
      return this.db1.table('chat_users')
    });
  }

  get messageItems(): Promise<Table<MessageInfo, string> | undefined> {
    return this.Ready.then(() => {
      return this.db1.table('chat_messages')
    });
  }

  db1!: Dexie;
  public Ready: Promise<any>;

  constructor() {

    this.Ready = new Promise((resolve, reject) => {
      this.setup().then(result => {
        resolve(result);
      }).catch(reject);
    });
  }

  async setup() {
    Dexie.exists('ngdexieliveQuery').then((s: any) => {
      if (s) {
        Dexie.delete('ngdexieliveQuery')
      }
    })
    const s = await Dexie.exists("app");
    if (!s) {
      this.db1 = new Dexie('app');
      this.db1.version(1).stores({
        chat_users: 'id',
        chat_messages: 'id',
        cafe_local_cart: 'id',
      })
    } else {

      this.db1 = new Dexie('app');
      await this.db1.open()
    }
    return true;
  }
}

export const db = new AppDB();
