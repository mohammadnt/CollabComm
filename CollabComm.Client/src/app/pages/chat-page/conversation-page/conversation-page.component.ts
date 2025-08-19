import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {first} from 'rxjs/operators';
import {
  ConversationInfo,
  ConversationResponse,
  DeleteMessageModel,
  MessageInfo,
  SeenModel,
  SyncInfo, UserGroupInfo
} from '../../../models/ChatModels';
import {WebsocketService} from '../../../core/services/websocket.service';
import {ActivatedRoute, Router} from '@angular/router';
import {WebsocketModel} from '../../../models/SocketModels';
import {ChatManagerService} from '../../../core/services/chat-manager.service';
import {AppDbService} from '../../../core/services/app-db.service';
import * as uuid from 'uuid';
import {BaseComponent} from "../../../core/classes/base-component";
import {getMessageSummary} from "../../../core/helper/chat-helper";
import {MethodCode, SyncMethod, UserType} from '../../../models/enums';
import {CollabUserInfo} from '../../../models/UserModels';
import {StorageService} from '../../../core/services/storage.service';
import {BaseResult} from '../../../models/BaseResult';
import {endpoint} from '../../../core/cookie-utils';
import {isNullOrUndefined} from '../../../core/util';
import {BasePage} from '../../../core/classes/base-page';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-conversation-page',
  templateUrl: './conversation-page.component.html',
  styleUrls: ['./conversation-page.component.scss'],
  standalone: false
})
export class ConversationPageComponent extends BasePage implements OnInit, OnDestroy {
  usersUnreadCount = 0;
  groupsUnreadCount = 0;
  private isLoadEnded = false;
  private isInLoading = false;
  isChatSuperAdmin = false;
  termCodeModel = '';

  constructor(private websocketService: WebsocketService,
              private route: ActivatedRoute,
              private storageService: StorageService,
              private router: Router,
              private chatManager: ChatManagerService,
              private appDb: AppDbService) {
    super();
    this.forwardMessage = this.router.getCurrentNavigation()?.extras?.state?.['forward_message'];
    this.isGroupChatOnly = this.chatManager.isGroupChatOnly;
    websocketService.messages.subscribe((msg: WebsocketModel) => {
      if (msg.method === MethodCode.send_message_resposne) {
        const t = JSON.parse(msg.data) as MessageInfo;
        this.processMessageReceived(t);
      }
      if (msg.method === MethodCode.send_message) {
        const t = JSON.parse(msg.data) as MessageInfo;
        this.processMessageReceived(t);
      }
      if (msg.method === MethodCode.sync) {
        const sync = JSON.parse(msg.data) as SyncInfo;
        this.handleSync(sync);

      }
    });
  }

  @ViewChild('scrollWrapperDiv') scrollWrapperDivRef!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollDiv') scrollDivRef!: ElementRef<HTMLInputElement>;
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('conversationListDiv') conversationListDivRef!: ElementRef<HTMLDivElement>;
  conversations: ConversationInfo[] = [];
  showingConversations: ConversationInfo[] = [];
  conversationsFiltered: ConversationInfo[] = [];
  UserType = UserType;
  groupSenderUsers: CollabUserInfo[] = [];
  selfId: string | undefined;
  isGroupChatOnly = false;
  private startTime!: number;

  forwardMessage: MessageInfo | undefined;

  protected readonly getMessageSummary = getMessageSummary;

  ngOnDestroy() {
    if (this.conversationListDivRef) {
      this.chatManager.conversationScrollTopValue = this.conversationListDivRef.nativeElement.scrollTop;
    }
  }

  handleSync(sync: SyncInfo) {
    const conv = this.conversations.find(c => c.user && (c.user.type === UserType.user ? sync.from_id === c.user.id : sync.to_id === c.user.id));
    if (!conv) {
      return;
    }

    if (sync.method === SyncMethod.seen) {
      const seen = JSON.parse(sync.value) as SeenModel;
      conv.last_read_counter = seen.seen_counter;
      // conv.last_seen_id = seen.seen_id
    }
    if (sync.method === SyncMethod.delete) {
      const deleteMessage = JSON.parse(sync.value) as DeleteMessageModel;
      const isInLastMessage = conv.last_message?.id === deleteMessage.message_id;
      if (isInLastMessage) {
        this.refresh();
      }
    }
  }

  processMessageReceived(t: MessageInfo) {
    const uid = t.from_id === this.selfId ? t.to_id : t.from_id;
    const conv = this.conversations.find(s => s.from_id === t.from_id && s.to_id === ((t.from_id === this.selfId) ? t.to_id : t.from_id));
    if (conv) {
      conv.last_message = t;
      conv.last_message_counter = t.conversation_counter ?? conv.last_message_counter;
      conv.last_message_id = t.id;
      this.conversations = this.sortConvs(this.conversations);
      this.applySearchFilter();
    } else {
      this.refresh();
    }
  }

  override ngOnInit(): void {

    this.startTime = Date.now();
    window.onbeforeunload = () => this.ngOnDestroy();
    this.selfId = this.storageService?.getFromLocalStorage('user_id') ?? '';
    this.refresh();
  }

  refresh() {
    if (this.isLoadEnded) {
      return;
    }

    if (this.isInLoading) {
      return;
    }
    this.isInLoading = true;
    this.baseRestService.GetConversations().pipe(first())
      .subscribe((d1: BaseResult<ConversationResponse>) => {
        this.isChatSuperAdmin = d1.data.is_chat_super_admin;
          if (d1.data.conversations.length === 0) {
            this.isLoadEnded = true;
          }
          const conversations = d1.data.conversations;
          this.refresh2(conversations);

        },
        error => {
          this.isInLoading = false;
        });
  }

  refresh2(conversations: ConversationInfo[]) {
    const onSuccess = (messages: MessageInfo[]) => {
      conversations.forEach(s => s.last_message = messages.find(x => x.id === s.last_message_id));
      conversations = this.sortConvs(conversations);
      this.refresh3(conversations);
      this.applySearchFilter();


    };
    const msgIds = conversations.map(s => s.last_message_id).filter(s => !!s);
    this.appDb.getMessages(msgIds)
      .then((haveMsgs) => {
        const availableMsgs = haveMsgs.filter(s => !!s).map(s => s as MessageInfo);
        const notHaveMsgIds = msgIds.filter(s => haveMsgs.find(s2 => s2?.id === s) === undefined);
        if (notHaveMsgIds.length === 0) {
          onSuccess(availableMsgs);
        } else {
          this.baseRestService.MessagesByIds(notHaveMsgIds).pipe(first())
            .subscribe((d2: BaseResult<MessageInfo[]>) => {
                const messages = d2.data;
                this.appDb.putMessages(messages);
                onSuccess(availableMsgs.concat(messages));

              },
              error => {
              });

        }
      });


  }

  refresh3(conversations: ConversationInfo[]) {
    const onSuccess = (users: CollabUserInfo[]) => {
      conversations.forEach(s => {
        const userId = s.from_id === s.to_id ? s.from_id : s.to_id;
        s.user = users.find(x => x.id === userId);
      });
      conversations = conversations.filter(s => s.user?.type !== UserType.channel)
      this.conversations = conversations;
      setTimeout(() => {
        this.isInLoading = false;
      }, 50)
      setTimeout(() => {
        if (this.chatManager.conversationScrollTopValue) {
          this.conversationListDivRef.nativeElement.scrollTop = this.chatManager.conversationScrollTopValue;
          this.chatManager.conversationScrollTopValue = undefined;
        }
      }, 0);
      this.applySearchFilter();

      this.refresh4(conversations);
    };
    const userIds = conversations.map(s => s.from_id === s.to_id ? s.from_id : s.to_id);
    this.appDb.getUsers(userIds)
      .then((haveUsers) => {
        const availableUserrs = haveUsers.filter(s => !!s).map(s => s as CollabUserInfo);
        const notHaveUserIds = userIds.filter(s => haveUsers.find(s2 => s2?.id === s) === undefined);
        if (notHaveUserIds.length === 0) {
          onSuccess(availableUserrs);
        } else {
          this.baseRestService.GetUsers(notHaveUserIds).pipe(first())
            .subscribe((d3: BaseResult<CollabUserInfo[]>) => {
                const users = d3.data;
                this.appDb.putUsers(users);
                onSuccess(availableUserrs.concat(users));
              },
              error => {
              });
        }
      });

  }


  refresh4(conversations: ConversationInfo[]) {

    const onSuccess = (users: CollabUserInfo[]) => {
      this.groupSenderUsers = users;
    };
    const groupSenderUsers = conversations.filter(s => s.user?.type === UserType.group)
      .map(s => s.last_message?.to_id)
      .filter(s => s !== undefined);
    this.appDb.getUsers(groupSenderUsers as string[])
      .then((haveUsers) => {
        const availableUserrs = haveUsers.filter(s => !!s).map(s => s as CollabUserInfo);
        const notHaveUserIds = groupSenderUsers.filter(s => haveUsers.find(s2 => s2?.id === s) === undefined);
        if (notHaveUserIds.length === 0) {
          onSuccess(availableUserrs);
        } else {
          this.baseRestService.GetUsers(notHaveUserIds).pipe(first())
            .subscribe((d3: BaseResult<CollabUserInfo[]>) => {
                const users = d3.data;
                this.appDb.putUsers(users);
                onSuccess(availableUserrs.concat(users));
              },
              error => {
              });
        }
      });
  }

  onConversation(conversation: ConversationInfo) {
    this.router.navigate([`/chat/${conversation.to_id}`], {
      state: {
        conversation,
        forward_message: this.forwardMessage
      }
    });
  }

  getHeaderName(conv: ConversationInfo) {
    let firstName = '';
    let lastName = '';
    if (conv && conv.user) {
      if (conv.user.first_name && conv.user.first_name !== '') {
        firstName = conv.user.first_name;
      }
      if (conv.user.last_name && conv.user.last_name !== '') {
        lastName = conv.user.last_name;
      }
    }

    return (firstName.length > 0 ? firstName[0] : '') + '‌' + (lastName.length > 0 ? lastName[0] : '');
  }

  getMessageTime(creationDateString: string | undefined) {
    if (!creationDateString) {
      return '';
    }
    const creationDate = new Date(creationDateString);
    const date = new Date();
    const x = (date.getTime() - creationDate.getTime()) / 1000;

    if (x < 24 * 3600) {
      return `${creationDate.getHours()}:${creationDate.getMinutes()}`;
    } else if (x < 7 * 24 * 3600) {
      return creationDate.toLocaleDateString('default', {weekday: 'short'});
    } else if (x < 365 * 24 * 3600) {
      const month = date.toLocaleString('default', {month: 'long'});
      const day = date.toLocaleString('default', {day: 'numeric'});
      return `${month} ${day}`;
    } else {
      const day = date.toLocaleString('default', {day: 'numeric'});

      return `${creationDate.getFullYear()}.${creationDate.getMonth()}.${day}`;
    }

  }

  private sortConvs(conversations: ConversationInfo[]) {
    return conversations.sort((s1, s2) => {
      if (s1.pin && s1.pin > 0) {
        return -1;
      }
      if (s2.pin && s2.pin > 0) {
        return 1;
      }
      if (s1.from_id === 'f4f54917-0257-4603-af2c-8d53e141a488') {
        return -1;
      }
      if (s2.from_id === 'f4f54917-0257-4603-af2c-8d53e141a488') {
        return 1;
      }
      if ((s1.last_message?.creation_date ?? '') === '') {
        return 1;
      }
      if ((s2.last_message?.creation_date ?? '') === '') {
        return -1;
      }
      if (new Date(s1.last_message?.creation_date ?? '').getTime() > new Date(s2.last_message?.creation_date ?? '').getTime()) {
        return -1;
      }

      return 1;
    });
  }

  getPhotoSrc(user: CollabUserInfo | undefined) {
    if (!user) {
      return '';
    }
    return `${endpoint()}media/publicusermedia/${user?.media_id}`;
  }

  getSenderUser(toId: string | undefined) {
    if (!toId) {
      return undefined;
    }
    return this.groupSenderUsers.find(s => s.id === toId);
  }

  onSearchInputKeyPress($event: Event) {
    this.applySearchFilter();
  }

  applySearchFilter() {
    this.showingConversations = [];
    const users = this.conversations.filter(s => s.user?.type === (UserType.user) || (s.pin ?? 0) > 0);
    const groups = this.conversations.filter(s => s.user?.type !== (UserType.user) || (s.pin ?? 0) > 0);
    this.usersUnreadCount = users.reduce((sum, current) => {
      let x = 0;
      if (!isNullOrUndefined(current.last_seen_counter) && !isNullOrUndefined(current.last_message_counter)) {
        x = current.last_message_counter - current.last_seen_counter;
        if (x < 0) {
          x = 0;
        }
      }
      return sum + x;

    }, 0);
    this.groupsUnreadCount = groups.reduce((sum, current) => {
      let x = 0;
      const a = current.user?.first_name;
      if (!isNullOrUndefined(current.user_group?.last_seen_counter) && !isNullOrUndefined(current.last_message_counter)) {
        x = current.last_message_counter - (current.user_group?.last_seen_counter ?? 0);
        if (x < 0) {
          x = 0;
        }
      }
      return sum + x;

    }, 0);
    this.chatManager.setTotalBadge(this.usersUnreadCount + this.groupsUnreadCount);


    if (this.isGroupChatOnly) {
      this.conversationsFiltered = groups;
    } else {
      this.conversationsFiltered = users;
    }
    const query = this.searchInputRef.nativeElement.value.toLowerCase() ?? '';
    if (query === '') {
      this.appendToShowing();
      // this.conversationsFiltered = this.conversations;
      return;
    }

    this.conversationsFiltered = this.conversationsFiltered.filter(s => {
      const name = `${s.user?.first_name} ${s.user?.last_name}`.toLowerCase();
      return name.indexOf(query) >= 0;
    });
    this.appendToShowing();
  }

  setGroupChatOnly(b: boolean) {
    if (b != this.isGroupChatOnly) {
      this.isLoadEnded = false;
      this.isGroupChatOnly = b;
      this.applySearchFilter();
      this.chatManager.isGroupChatOnly = b;
    }
  }

  isScrollCalculating = false;

  onScroll(): void {
    if (this.isScrollCalculating) {
      return;
    }
    this.isScrollCalculating = true;
    if (this.scrollWrapperDivRef && this.scrollDivRef) {
      const d1 = (this.scrollWrapperDivRef.nativeElement.scrollHeight - this.scrollWrapperDivRef.nativeElement.scrollTop);
      if (d1 - 500 <= this.scrollWrapperDivRef.nativeElement.clientHeight) {
        if (!this.isLoadEnded) {
          this.appendToShowing();
        }
      }
    }
    setTimeout(() => {
      this.isScrollCalculating = false;
    })

  }

  private appendToShowing() {
    const notShowing = this.conversationsFiltered.filter(s1 => !this.showingConversations.some(s2 => s1.id === s2.id));
    const thisPartConvs = notShowing.slice(0, 50);
    this.showingConversations.push(...thisPartConvs);
  }

  protected readonly faMagnifyingGlass = faMagnifyingGlass;
}
