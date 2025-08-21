import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {WebsocketService} from '../../core/services/websocket.service';
import {first, takeUntil} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ConversationInfo,
  DeleteMessageModel,
  FileData,
  FullConversationInfo,
  MessageInfo,
  SeenModel,
  SyncInfo,
  UserGroupInfo
} from '../../models/ChatModels';
import {SendMessageWebsocketModel, WebsocketModel} from '../../models/SocketModels';
import * as uuid from 'uuid';
import {MatMenuTrigger} from '@angular/material/menu';
import {HttpEventType} from '@angular/common/http';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MessageInfoDialogComponent} from './message-info-dialog/message-info-dialog.component';
import {ChatManagerService} from '../../core/services/chat-manager.service';
import {LoadingDialogComponent} from '../../module/loading-dialog/loading-dialog.component';
import {AppDbService} from '../../core/services/app-db.service';
import {Subject} from 'rxjs';
import {ConfirmationDialogComponent} from '../../module/confirmation-dialog/confirmation-dialog.component';
import {ImageViewerComponent} from '../../module/image-viewer/image-viewer.component';
import {DOCUMENT} from '@angular/common';
import {ToastrService} from 'ngx-toastr';
import {RichTextAreaComponent} from './custom-text-area/rich-text-area/rich-text-area.component';
import {ImageCropperManagerComponent} from '../../module/image-cropper-manager/image-cropper-manager.component';
import {Mp3AudioRecordingServiceOgg} from "../../core/services/mp3-audio-recording.service";
import {getMessageSummary} from "../../core/helper/chat-helper";
import {BasePage} from "../../core/classes/base-page";
import {Overlay, OverlayRef} from "@angular/cdk/overlay";
import {CdkPortal} from "@angular/cdk/portal";
import {ImageCompressor} from '../../core/services/image-compressor';
import {MediaType, MessageType, MethodCode, SyncMethod, UserType} from '../../models/enums';
import {CollabUserInfo} from '../../models/UserModels';
import {StorageService} from '../../core/services/storage.service';
import {BaseResult, ResultStatusCode} from '../../models/BaseResult';
import {endpoint} from '../../core/cookie-utils';
import {faPaperPlane, faPaperclip, faChevronLeft, faReply, faXmark} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-chat-page',
  templateUrl: './chat-page.component.html',
  styleUrls: ['./chat-page.component.scss'],
  standalone: false
})
export class ChatPageComponent extends BasePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(CdkPortal) portal!: CdkPortal;

  messageTextString = '';

  clearedFakeMessageIds: string[] = [];

  constructor(@Inject(DOCUMENT) public document: Document,
              private router: Router,
              private websocketService: WebsocketService,
              private route: ActivatedRoute,
              private toaster: ToastrService,
              private dialog: MatDialog,
              private storageService: StorageService,
              private chatManager: ChatManagerService,
              private imageCompressor: ImageCompressor,
              private appDb: AppDbService,
              private cdr: ChangeDetectorRef,
              private overlay: Overlay,
              private audioRecordingService: Mp3AudioRecordingServiceOgg) {
    super();

    this.forwardMessage = this.router.getCurrentNavigation()?.extras?.state?.['forward_message'];
    this.targetConversation = this.router.getCurrentNavigation()?.extras?.state?.['conversation'];
    this.isWebsocketClosed = !this.websocketService.getCurrentState();
    websocketService.getWebSocketState()
      .pipe(takeUntil(this.onDestroy))
      .subscribe((isOpen) => {
        this.isWebsocketClosed = !isOpen;
        if (!isOpen) {
          this.messages.forEach(s => {
            if (s.fakeData) {
              s.fakeData.isFailed = true;
            }
          });
        }
      });
    websocketService.messages
      .pipe(
        takeUntil(this.onDestroy)
      ).subscribe((msg: WebsocketModel) => {
      if (msg.method === MethodCode.send_message_resposne) {
        const t = JSON.parse(msg.data) as MessageInfo;
        const forThisChat = t.is_group ? t.from_id === this.userId : t.to_id === this.userId;

        if (forThisChat) {
          const validMessages = this.messages.filter(s => s.conversation_counter > 0);

          if (validMessages.length === 0 || validMessages[0].conversation_counter === t.conversation_counter - 1) {
            this.processAndAddMessages([t], msg.identifier, true, undefined);
          } else {
            this.removeFakeMessage(msg.identifier);
          }
        }
      }
      if (msg.method === MethodCode.send_message) {
        const t = JSON.parse(msg.data) as MessageInfo;
        const forThisChat = t.is_group ? t.from_id === this.userId : t.to_id === this.userId;
        if (forThisChat) {
          if (this.messages[0].conversation_counter === t.conversation_counter - 1) {
            this.processAndAddMessages([t], undefined, true, undefined);
            this.seen(t);
          }
        }
      }
      if (msg.method === MethodCode.sync) {
        const sync = JSON.parse(msg.data) as SyncInfo;
        const orgFrom = sync.from_id;
        const orgTo = sync.to_id;
        if (sync.to_id === this.selfId) {
          const q = sync.from_id;
          sync.from_id = sync.to_id;
          sync.to_id = q;
        }
        this.handleSync(sync, orgFrom, orgTo);
        // if (this.targetUser?.type === UserType.user ? sync.from_id === this.userId : sync.to_id === this.userId) {
        // }
      }
    });
  }

  protected onDestroy = new Subject<void>();

  showEmojiDesktop = false;
  showEmojiMobile = false;
  isWebsocketClosed = false;

  @ViewChild('messagesWrapper') messagesWrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChild('recordDiv') recordDivRef!: ElementRef<HTMLDivElement>;
  @ViewChild('attachFileInput') attachFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('attachImageFileInput') attachImageFileInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('emojiPicker') emojiPickerRef: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('richTextArea') richTextAreaRef: RichTextAreaComponent | undefined;
  isRecording = false;
  isInLoadingMessages = false;
  isFromTopLoadEnded = false;
  isFromBottomLoadEnded = false;
  usergroup: UserGroupInfo | undefined;

  recordingTime = -1;
  recordingTimeString = '';
  activeRecording: string | undefined;
  matMenuType: number | undefined;

  forwardMessage: MessageInfo | undefined;


  private startTime!: number;
  userId: string | null = null;
  messages: MessageInfo[] = [];
  additionalUsers: CollabUserInfo[] = [];
  additionalMessages: MessageInfo[] = [];
  // sendMessageText = '';
  selfId: string | undefined;
  public UserType = UserType;
  targetUser: CollabUserInfo | undefined;
  targetConversation: ConversationInfo | undefined;

  menuTopLeftPosition = {x: '0', y: '0'};
  @ViewChild(MatMenuTrigger, {static: true}) matMenuTrigger!: MatMenuTrigger;

  additionalMessageInfo: MessageInfo | undefined;
  isReply = false;
  firstName = '';
  lastName = '';
  MessageType = MessageType;

  timer: any;
  touchedMessageIndex: number | undefined;
  isTimeStatisfiedForLongPress = false;

  protected readonly getMessageSummary = getMessageSummary;
  isImageOpen = false;
  viewer: MatDialogRef<ImageViewerComponent> | undefined;

  override mustShowNavBar() {
    return false;
  }

  resetMessages() {
    this.clearedFakeMessageIds = [];
    this.messages = [];
  }

  removeFakeMessage(signalId: string) {
    this.clearedFakeMessageIds.push(signalId);
    const index = this.messages.findIndex(s => s.id === signalId);
    if (index > -1) {
      this.messages.splice(index, 1);
    }

  }

  ngAfterViewInit(): void {

  }

  ngOnDestroy() {

    this.onDestroy.next();
    this.onDestroy.complete();
    if (this.userId) {
      this.chatManager.setChatScrollTopValue(this.userId, this.messagesWrapperRef.nativeElement.scrollTop);
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(e: any) {
    console.log(e);
    console.log('Back button pressed');
    if (this.isImageOpen) {
      this.isImageOpen = false;
      this.viewer?.close();

      e.preventDefault();
      e.stopPropagation();
    }
  }

  override ngOnInit() {
    // this.visualViewportHeight = window.innerHeight;
    // visualViewport?.addEventListener('resize', (event: any) => {
    //   this.visualViewportHeight = event.target.height;
    //   this.cdr.detectChanges();
    // });
    this.startTime = Date.now();
    window.onbeforeunload = () => this.ngOnDestroy();

    this.firstName = this.storageService?.getFromLocalStorage('first_name') ?? '';
    this.lastName = this.storageService?.getFromLocalStorage('last_name') ?? '';
    this.selfId = this.storageService?.getFromLocalStorage('user_id') ?? undefined;


    this.loadData();

  }

  loadData() {

    this.additionalMessages = [];
    this.additionalMessageInfo = undefined;
    this.additionalUsers = [];
    this.resetMessages();

    this.userId = this.route.snapshot.paramMap.get('userid');
    const onSuccess = (conversation: ConversationInfo) => {
      this.usergroup = conversation.user_group;
      this.targetUser = conversation.user;
      this.targetConversation = conversation;
      if (this.targetUser) {
        this.additionalUsers.push(this.targetUser);
      }
      this.loadMessages(undefined, true, () => {
        this.isFromBottomLoadEnded = true;
      });
    };
    if (this.targetConversation) {
      onSuccess(this.targetConversation);
    } else {
      this.baseRestService.ConversationWithUser(this.userId).pipe(first())
        .subscribe((d1: BaseResult<FullConversationInfo>) => {
            if (d1.data.conversation) {
              d1.data.conversation.user = d1.data.user;
              d1.data.conversation.user_group = d1.data.user_group;
              onSuccess((d1.data.conversation));
            } else {
              this.targetUser = d1.data.user;
            }
          },
          error => {
          });
    }
    this.baseRestService.GetUsers([this.userId ?? undefined]).pipe(first())
      .subscribe((d2: BaseResult<CollabUserInfo[]>) => {
        this.appDb.putUsers(d2.data);
        if (this.targetConversation) {
          this.targetConversation.user = d2.data[0];
        }
        this.targetUser = d2.data[0];
      });

  }

  isGroup() {
    return this.targetUser?.type === UserType.group;
  }

  loadMessages(counter: number | undefined, isPrevious: boolean, onFinish: (() => void) | undefined) {

    this.isInLoadingMessages = true;
    this.baseRestService.MessagesByCounter(this.userId, counter, isPrevious).pipe(first())
      .subscribe((d2: BaseResult<MessageInfo[]>) => {
          const msgs = d2.data.sort((s1, s2) =>
            s2.conversation_counter - s1.conversation_counter);
          if (d2.data.length === 0) {
            if (isPrevious) {
              this.isFromTopLoadEnded = true;
            } else {
              this.isFromBottomLoadEnded = true;
            }
            this.isInLoadingMessages = false;
            this.seen(undefined);
            return;
          }
          const lastmsg = msgs[0];
          this.seen(lastmsg);
          this.processAndAddMessages(msgs, undefined, !isPrevious, () => {
            setTimeout(() => {
              this.isInLoadingMessages = false;
              if (onFinish) {
                onFinish();
              }
            }, 50);

          });
        },
        error => {
          this.isInLoadingMessages = false;
        });
  }

  handleSync(sync: SyncInfo, orgFrom: string, orgTo: string) {
    if (sync.method === SyncMethod.seen) {
      if (this.userId !== sync.to_id) {
        return;
      }
      const seen = JSON.parse(sync.value) as SeenModel;
      if (this.targetConversation) {
        this.targetConversation.last_read_counter = seen.seen_counter;
        window.history.replaceState({}, '', window.location.href);
      }
      // this.messages.forEach(s => {
      //   if (s.conversation_counter) {
      //     if (s.conversation_counter <= seen.seen_counter) {
      //       s.is_read = true;
      //     }
      //   }
      // });
    }
    if (sync.method === SyncMethod.delete) {
      const deleteMessage = JSON.parse(sync.value) as DeleteMessageModel;
      if (this.userId !== sync.to_id) {
        return;
      }
      const item = this.messages.find(s => s.id === deleteMessage.message_id);
      if (item) {
        const index = this.messages.indexOf(item, 0);
        if (index > -1) {
          this.messages?.splice(index, 1);
        }
      }
    }
  }

  onChooseFileClick(event: MouseEvent) {
    event.preventDefault();
    this.matMenuType = 2;
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';
    this.matMenuTrigger.menuData = {undefined};
    this.matMenuTrigger.openMenu();
  }

  onRightClick(event: MouseEvent, item: MessageInfo) {
    if (item.type === MessageType.system_message) {
      return;
    }
    event.preventDefault();
    this.matMenuType = 1;
    this.menuTopLeftPosition.x = event.clientX + 'px';
    this.menuTopLeftPosition.y = event.clientY + 'px';
    this.matMenuTrigger.menuData = {item};
    this.matMenuTrigger.openMenu();
  }

  seen(msg: MessageInfo | undefined) {

    if (msg && msg.conversation_counter) {
      if (this.isGroup() ? (this.usergroup?.last_seen_counter ?? 0) < msg.conversation_counter :
        (this.targetConversation?.last_seen_counter ?? 0) < msg.conversation_counter) {

        this.baseRestService.Seen(this.userId, msg.conversation_counter, msg.id).pipe(first())
          .subscribe((d2: BaseResult<MessageInfo[]>) => {
              if (this.isGroup()) {
                if (this.usergroup) {
                  this.usergroup.last_seen_counter = msg.conversation_counter;
                }
              } else {
                if (this.targetConversation) {
                  this.targetConversation.last_seen_counter = msg.conversation_counter;
                }
              }
            },
            error => {
            });
      }
    } else {
      const convLastSeenCounter = this.isGroup() ? this.targetConversation?.last_message_counter : this.targetConversation?.last_message_counter;
      this.baseRestService.Seen(this.userId, convLastSeenCounter ?? 0, undefined).pipe(first())
        .subscribe((d2: BaseResult<MessageInfo[]>) => {
            if (this.isGroup()) {
              if (this.usergroup) {
                if (this.usergroup && convLastSeenCounter) {
                  this.usergroup.last_seen_counter = convLastSeenCounter;
                }
              }
            } else {
              if (this.targetConversation && convLastSeenCounter) {
                this.targetConversation.last_seen_counter = convLastSeenCounter;
              }
            }
          },
          error => {
          });
    }

  }

  processAndAddMessages(newMsgs: MessageInfo[], signalId: string | undefined, addToFirst: boolean, onAdded: (() => void) | undefined) {
    this.additionalMessages.push(...newMsgs);
    const senderUsers1: string[] = [];
    this.appDb.tryToUpdateMessages(newMsgs).then(s => {
    });
    newMsgs.forEach(s => {
      const user = this.additionalUsers.find(u => s.to_id === u.id);
      if (!user) {
        senderUsers1.push(s.to_id);
      }
      if (s.forward_user_id) {
        const fuser = this.additionalUsers.find(u => s.forward_user_id === u.id);
        if (!fuser) {
          senderUsers1.push(s.forward_user_id);
        }
      }
    });
    const onSuccess = (users: CollabUserInfo[]) => {
      this.processAndAddMessages2(newMsgs, users, signalId, addToFirst, onAdded);
    };
    this.appDb.getUsers(senderUsers1)
      .then((haveUsers) => {
        const availableUserrs = haveUsers.filter(s => !!s).map(s => s as CollabUserInfo);
        const notHaveUserIds = senderUsers1.filter(s => haveUsers.find(s2 => s2?.id === s) === undefined);
        if (notHaveUserIds.length === 0) {
          onSuccess(availableUserrs);
        } else {
          this.baseRestService.GetUsers(senderUsers1).pipe(first())
            .subscribe((d2: BaseResult<CollabUserInfo[]>) => {
              this.appDb.putUsers(d2.data);
              onSuccess(d2.data.concat(availableUserrs));
            });
        }
      });

  }


  processAndAddMessages2(newMsgs: MessageInfo[], senderUsers: CollabUserInfo[], signalId: string | undefined, addToFirst: boolean, onAdded: (() => void) | undefined) {

    this.additionalUsers.push(...senderUsers);
    newMsgs.forEach(s => s.user = senderUsers.find(s2 => s2.id === s.to_id));
    const replyIds: string[] = [];
    newMsgs.forEach(s => {
      if (s.reply_id) {
        const msg = this.additionalMessages.find(s2 => s2.id === s.reply_id);
        if (!msg) {
          replyIds.push(s.reply_id);
        }
      }
      s.is_sender = s.is_group ? s.to_id === this.selfId : s.is_sender;
    });
    if (signalId) {
      this.removeFakeMessage(signalId);
    }
    if (addToFirst) {
      this.messages = newMsgs.concat(this.messages);
    } else {
      this.messages = this.messages.concat(newMsgs);
    }

    const onSuccess = (msgs: MessageInfo[]) => {
      this.processAndAddMessages3(msgs, onAdded);
    };
    this.appDb.getMessages(replyIds)
      .then((haveMsgs) => {
        const availableMsgs = haveMsgs.filter(s => !!s).map(s => s as MessageInfo);
        const notHaveMsgIds = replyIds.filter(s => haveMsgs.find(s2 => s2?.id === s) === undefined);
        if (notHaveMsgIds.length === 0) {
          onSuccess(availableMsgs);
        } else {
          this.baseRestService.MessagesByIds(replyIds).pipe(first())
            .subscribe((d1: BaseResult<MessageInfo[]>) => {
                this.appDb.putMessages(d1.data);
                onSuccess(d1.data.concat(availableMsgs));
              },
              error => {
              });
        }
      });

  }

  processAndAddMessages3(newAdditionalMsgs: MessageInfo[], onAdded: (() => void) | undefined) {

    this.additionalMessages.push(...newAdditionalMsgs);
    const thisMsgs = newAdditionalMsgs;
    const senderUsers: string[] = [];
    newAdditionalMsgs.forEach(s => {
      const user = this.additionalUsers.find(u => s.to_id === u.id);
      if (!user) {
        senderUsers.push(s.to_id);
      }
    });
    const onSuccess = (users: CollabUserInfo[]) => {
      this.additionalUsers.push(...users);
      if (this.userId) {
        const x = this.chatManager.getChatScrollTopValue(this.userId);
        if (x) {
          this.messagesWrapperRef.nativeElement.scrollTop = x;
          this.chatManager.setChatScrollTopValue(this.userId, undefined);
          if (onAdded) {
            onAdded();
          }
        } else {
          if (onAdded) {
            onAdded();
          }
        }
      }
    };
    this.appDb.getUsers(senderUsers)
      .then((haveUsers) => {
        const availableUserrs = haveUsers.filter(s => !!s).map(s => s as CollabUserInfo);
        const notHaveUserIds = senderUsers.filter(s => haveUsers.find(s2 => s2?.id === s) === undefined);
        if (notHaveUserIds.length === 0) {
          onSuccess(availableUserrs);
        } else {
          this.baseRestService.GetUsers(senderUsers).pipe(first())
            .subscribe((d3: BaseResult<CollabUserInfo[]>) => {
              this.appDb.putUsers(d3.data);
              onSuccess(d3.data.concat(availableUserrs));
            });

        }
      });

  }

  sendTextMsg() {
    if (this.isWebsocketClosed) {
      return;
    }
    // if (!environment.production) {
    //   if (this.getSendMessageText().startsWith('for:')) {
    //     for (let i = 0; i < 50; i++) {
    //       this.sendMsg(MessageType.text, i.toString(), undefined, undefined, undefined, uuid.v4());
    //     }
    //     return;
    //   }
    // }
    const identifier = uuid.v4();
    if (this.forwardMessage) {
      this.sendForwardMsg(this.forwardMessage, identifier);
      this.forwardMessage = undefined;
      return;
    }
    if (this.getSendMessageText().trim() === '') {
      alert('empty message');
      return;
    }

    const replyMessage = this.additionalMessageInfo;
    if (!this.isFromBottomLoadEnded) {
      this.resetMessages();
      this.loadMessages(undefined, true, () => {
        if (this.clearedFakeMessageIds.some(s => s === identifier)) {
          return;
        }
        this.createFakeMessage(MessageType.text, this.getSendMessageText().trim(), undefined, undefined, replyMessage, identifier);
        this.isFromBottomLoadEnded = true;
      });
    } else {
      this.createFakeMessage(MessageType.text, this.getSendMessageText().trim(), undefined, undefined, replyMessage, identifier);
    }
    this.sendMsg(MessageType.text, this.getSendMessageText().trim(), undefined, undefined, replyMessage, identifier);
    this.setSendMessageText('');
    this.richTextAreaRef?.focus();

  }

  sendMsg(type: MessageType, text: string | undefined, fileId: string | undefined, data: string | undefined,
          replyMessage: MessageInfo | undefined, id: string) {
    if (!this.userId) {
      alert('something is wrong');
      return;
    }
    const x: SendMessageWebsocketModel = {
      type,
      to_id: this.userId,
      text,

      file_id: fileId,
      reply_id: replyMessage?.id,
      forward_message_id: undefined,
      forward_conversation_id: undefined,
      client_id: undefined,
      data,
      is_link: undefined,
      advanced_forward: undefined,
    };

    const message: WebsocketModel = {
      method: MethodCode.send_message,
      data: JSON.stringify(x),
      identifier: id,
    };

    this.websocketService.sendMessage(JSON.stringify(message));

  }

  sendForwardMsg(msg: MessageInfo, id: string) {
    if (!this.userId) {
      alert('something is wrong');
      return;
    }
    const x: SendMessageWebsocketModel = {
      type: undefined,
      to_id: this.userId,
      text: undefined,

      file_id: undefined,
      reply_id: undefined,
      forward_message_id: msg.id,
      forward_conversation_id: undefined,
      client_id: undefined,
      data: undefined,
      is_link: undefined,
      advanced_forward: undefined,
    };

    const message: WebsocketModel = {
      method: MethodCode.send_message,
      data: JSON.stringify(x),
      identifier: id,
    };

    this.websocketService.sendMessage(JSON.stringify(message));

  }

  createFakeMessage(type: MessageType, text: string | undefined, fileId: string | undefined, data: string | undefined,
                    replyMessage: MessageInfo | undefined, id: string) {
    const newMsg: MessageInfo = {
      id,
      from_id: this.selfId ?? '',
      to_id: this.userId ?? '',
      conversation_counter: -1,
      creation_date: new Date().toString(),
      data,
      deleted: false,
      forward_id: undefined,
      forward_user_id: undefined,
      is_delivered: false,
      media_id: fileId,
      media_path: undefined,
      text: text ?? '',
      type,
      original_from_id: undefined,
      original_to_id: undefined,
      read_date: undefined,
      reply_id: replyMessage?.id,
      user_counter: undefined,
      is_group: this.targetUser?.type === UserType.group,
      is_sender: true,
      is_local: true,
      user: undefined,
      fakeData: {uploadRatio: 0, isFailed: false, imageUri: undefined, subscriber: undefined}
    };
    this.messages = [newMsg].concat(this.messages);
    this.isReply = false;
    this.additionalMessageInfo = undefined;
    setTimeout(() => {
      this.messagesWrapperRef.nativeElement.scroll({
        top: this.messagesWrapperRef.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    }, 0);
    return newMsg;
  }


  onDelete(item: MessageInfo) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: false,
      data: {title: 'Are you sure?'},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.baseRestService.deleteMessage(this.targetUser?.id, item.id)
          .subscribe((d: BaseResult<boolean>) => {
            // if (d.data) {
            //   this.doOnDelete(item.id);
            // }
          }, error => {
            alert('error , retry');
          });
      }
    });

  }

  onInfo(item: MessageInfo) {
    const dialogRef = this.dialog.open(MessageInfoDialogComponent, {
      data: {title: 'title', message: item},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
  }

  onReply(item: MessageInfo) {
    this.additionalMessageInfo = item;
    this.isReply = true;
  }

  onCopy(item: MessageInfo) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = item.text;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  getReplyMenuName(additionalMessageInfo: MessageInfo | undefined) {
    if (this.targetUser?.type === UserType.user) {
      if (this.additionalMessageInfo?.is_sender) {
        return `${this.firstName} ${this.lastName}`;
      } else {
        return `${this.targetUser?.first_name} ${this.targetUser?.last_name}`;
      }
    } else {
      const user = this.additionalUsers.find(s => s.id === additionalMessageInfo?.to_id);
      return `${user?.first_name} ${user?.last_name}`;
    }
  }


  onCloseReply() {
    this.isReply = false;
    this.additionalMessageInfo = undefined;
  }

  onCloseForward() {
    this.forwardMessage = undefined;
    this.cdr.detectChanges();
  }

  getMessage(replyId: string): MessageInfo | undefined {
    return this.additionalMessages.find(s => s.id === replyId);
  }

  getUser(userId: string | undefined): CollabUserInfo | undefined {
    if (!userId) {
      return undefined;
    }
    return this.additionalUsers.find(s => s.id === userId);
  }

  getUserOfReplied(msg: MessageInfo): CollabUserInfo | undefined {
    const repliedMsg = this.additionalMessages.find(s => s.id === msg.reply_id);
    return this.additionalUsers.find(s => s.id === repliedMsg?.to_id);
  }

  getUserOfForwardedMessage(msg: MessageInfo): CollabUserInfo | undefined {
    return this.additionalUsers.find(s => s.id === msg.forward_user_id);
  }


  startRecording() {
    if (this.isRecording) {
      return;
    }
    const dialogRef = this.dialog.open(LoadingDialogComponent, {
      disableClose: true,
      data: {title: 'Initializing Recorder'}
    });

    this.audioRecordingService.startRecording(() => {

      this.isRecording = true;
      dialogRef.close();
      this.recordingTime = 0;
      this.recordingTimeString = `${Math.floor(this.recordingTime / 60).toTwoDigitIntString()}:${Math.floor(this.recordingTime % 60).toTwoDigitIntString()}`;

      this.activeRecording = uuid.v4();
      setTimeout(() => {
        this.calculateTime(this.activeRecording ?? '');
      }, 1000);
    }, () => {
      dialogRef.close();
      this.toaster.myError('Could not start recorder');
    });

  }

  calculateTime(guid: string) {
    if (!this.isRecording || guid !== this.activeRecording) {
      return;
    }
    this.recordingTime = (this.recordingTime) + 1;
    this.recordingTimeString = `${Math.floor(this.recordingTime / 60).toTwoDigitIntString()}:${Math.floor(this.recordingTime % 60).toTwoDigitIntString()}`;

    setTimeout(() => {
      this.calculateTime(guid);
    }, 1000);
  }

  // stopRecording(callback: ((output: any) => void) | null) {
  //   this.audioRecordingService.abortRecording();
  // }


  onVoiceTouchend() {
    console.log(this.isWebsocketClosed);
    if (this.isWebsocketClosed) {
      return;
    }
    if (!this.isRecording) {
      return;
    }
    const recordingTimeStringTemp = this.recordingTimeString;
    this.recordingTimeString = '';
    this.isRecording = false;


    // const audioRecordingService = new Mp3AudioRecordingServiceOgg();
    this.audioRecordingService!.stopRecording((blob) => {
      const fileName = `${uuid.v4()}.mp3`;
      const file = new File([blob], fileName);
      const replyMessage = this.additionalMessageInfo;
      const identifier = uuid.v4();
      const data = {file_name: fileName, org_file_name: file.name, duration: recordingTimeStringTemp} as FileData;
      const fakeMsg = this.createFakeMessage(MessageType.voice, undefined, undefined, JSON.stringify(data), replyMessage, identifier);

      this.makeUpload(file, MediaType.audio, fileName, fakeMsg, (mediaId) => {
        if (mediaId) {
          this.sendMsg(MessageType.voice, undefined, mediaId, JSON.stringify(data), replyMessage, identifier);
        }
      });
      this.cdr.detectChanges();
    }, (reason: number) => {
      if (reason == 1) {
        this.toaster.myError('Recorded voice must be longer than 1 second');
      } else {
        this.toaster.myError('Unable to save recorded sound');
      }
    });
  }

  makeUpload(file: File, type: number, fileName: string, fakeMsg: MessageInfo, callback: (id: string | undefined) => void) {
    const onSuccess = (d: BaseResult<string | undefined>) => {
      callback(d.data);
    };
    return this.baseRestService.addChatMedia(file, this.userId, type, fileName)
      .subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // console.log('HttpEventType.UploadProgress');
          // console.log(event.loaded, event.total);
          // event.loaded = bytes transfered
          // event.total = "Content-Length", set by the server

          const uploadRatio = event.loaded / event.total;
          fakeMsg.fakeData.uploadRatio = uploadRatio;
        }

        // finished
        if (event.type === HttpEventType.Response) {

          if (event.body.code === ResultStatusCode.EmptyFile) {
            this.toaster.myError('Error: EmptyFile');
            return;
          }
          onSuccess(event.body);
        }
      }, error => {
        alert('error :' + error.toString());
      });
  }

  makeUploadThumbnail(file: File, type: number, fileName: string, fakeMsg: MessageInfo, callback: (id: string | undefined) => void) {
    const onSuccess = (d: BaseResult<string | undefined>) => {
      callback(d.data);
    };
    this.baseRestService.addThumbnailChatMedia(file, this.userId, type, fileName)
      .subscribe((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          // console.log('HttpEventType.UploadProgress');
          // console.log(event.loaded, event.total);
          // event.loaded = bytes transfered
          // event.total = "Content-Length", set by the server

          // const uploadRatio = event.loaded / event.total;
          // fakeMsg.fakeData.uploadRatio = uploadRatio;
        }

        // finished
        if (event.type === HttpEventType.Response) {

          if (event.body.code === ResultStatusCode.EmptyFile) {
            this.toaster.myError('Error: EmptyFile');
            return;
          }
          onSuccess(event.body);
        }
      }, error => {
        alert('error :' + error.toString());
      });
  }

  onScroll(e: Event): void {

    if (this.isInLoadingMessages) {
      return;
    }
    if (-this.messagesWrapperRef.nativeElement.scrollTop + (this.messagesWrapperRef.nativeElement.offsetHeight / 2) >
      (this.messagesWrapperRef.nativeElement.scrollHeight - this.messagesWrapperRef.nativeElement.offsetHeight)) {
      if (this.messages.length > 0) {
        if (this.isFromTopLoadEnded) {
          return;
        }
        const counter = this.messages[this.messages.length - 1].conversation_counter;
        if (counter) {
          this.loadMessages(counter, true, undefined);
        }
      }
    }
    if (-this.messagesWrapperRef.nativeElement.scrollTop < (this.messagesWrapperRef.nativeElement.offsetHeight / 2)) {
      if (this.messages.length > 0) {
        if (this.isFromBottomLoadEnded) {
          return;
        }
        const counter = this.messages[0].conversation_counter;
        if (counter) {
          this.loadMessages(counter, false, undefined);
        }
      }
    }
  }

  handleAttachFileInput(e: Event) {
    const files = (e.target as any).files;
    for (let i = 0; i < files.length; i++) {
      this.sendFile(files.item(i));
    }
  }

  sendFile(file: File) {


    const fileName = `${uuid.v4()}.${file.name.split('.').pop()}`;
    const replyMessage = this.additionalMessageInfo;
    const identifier = uuid.v4();
    const data = {file_name: fileName, org_file_name: file.name, size: file.size} as FileData;
    const fakeMsg = this.createFakeMessage(MessageType.file, undefined, undefined, JSON.stringify(data), replyMessage, identifier);

    const subscriber = this.makeUpload(file, MediaType.file, fileName, fakeMsg, (mediaId) => {
      if (mediaId) {
        this.sendMsg(MessageType.file, undefined, mediaId, JSON.stringify(data), replyMessage, identifier);

      }
    });
    fakeMsg.fakeData.subscriber = subscriber;
  }

  handleImageAttachFileInput(e: Event) {

    const file = (e.target as any).files.item(0);
    const fileName = `${uuid.v4()}.${file.name.split('.').pop()}`;

    const viewer = this.dialog.open(ImageCropperManagerComponent, {
      data: {
        imageFile: file, aspectRatio: -1

      },
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
    viewer.afterClosed().subscribe((result: any) => {
      if (result && viewer.componentInstance.croppedImage) {
        const croppedImage = viewer.componentInstance.croppedImage;
        this.imageCompressor.compressFileAsync(croppedImage, fileName, 50, 60, 1280, 1280, true).then((
          {
            imageFile,
            uri,
            width,
            height
          }) => {
          const replyMessage = this.additionalMessageInfo;
          const identifier = uuid.v4();
          const data = {
            file_name: fileName,
            org_file_name: file.name,
            width,
            height,
            size: imageFile.size
          } as FileData;
          // const data = {file_name: fileName, org_file_name: file.name} as FileData;
          const fakeMsg = this.createFakeMessage(MessageType.image, undefined, undefined, JSON.stringify(data), replyMessage, identifier);
          fakeMsg.fakeData.imageUri = uri;
          this.makeUpload(imageFile, MediaType.image, fileName, fakeMsg,
            (mediaId) => {
              this.imageCompressor.compressFileAsync(croppedImage, fileName, 50, 60, 100, 100, true).then((
                {
                  imageFile: thumbImageFile,
                  uri: thumbUri,
                  width: thumbWidth,
                  height: thumbHeight
                }) => {
                this.makeUploadThumbnail(thumbImageFile, MediaType.image, fileName, fakeMsg,
                  (thumbMediaId) => {
                    if (mediaId) {
                      this.sendMsg(MessageType.image, undefined, mediaId, JSON.stringify(data), replyMessage, identifier);
                    }
                  });
              });

            });
        });

      }
    });
  }

  getTargetUserNameSummary() {
    let firstName = '';
    let lastName = '';
    if (this.targetUser) {
      if (this.targetUser.first_name && this.targetUser.first_name !== '') {
        firstName = this.targetUser.first_name;
      }
      if (this.targetUser.last_name && this.targetUser.last_name !== '') {
        lastName = this.targetUser.last_name;
      }
    }

    return (firstName.length > 0 ? firstName[0] : '') + '' + (lastName.length > 0 ? lastName[0] : '');
  }

  getTargetFirstName() {
    let firstName = '';
    let lastName = '';
    if (this.targetUser) {
      if (this.targetUser.first_name && this.targetUser.first_name !== '') {
        firstName = this.targetUser.first_name;
      }
      if (this.targetUser.last_name && this.targetUser.last_name !== '') {
        lastName = this.targetUser.last_name;
      }
    }

    return firstName + ' ' + lastName;
  }

  onBack() {
    this.router.navigate(['/conversation']);
  }

  goToProfile() {
    if (this.targetUser?.type === UserType.user) {
      this.onProfileInUser();
      return;
    }
    if (this.targetUser?.type !== UserType.group) {
      return;
    }
    this.router.navigate([`/group-members/${this.targetUser?.id}`]);
  }

  onProfileInUser() {
    this.router.navigate([`/chat-profile/${this.targetUser?.id}`]);


  }

  onInputClick(e: any) {
    e.target.value = null;
  }


  OnProfilePic(message: MessageInfo) {
    this.router.navigate([`/chat/${message.to_id}`]).then(() => {

      this.usergroup = undefined;
      this.targetUser = undefined;
      this.targetConversation = undefined;
      this.forwardMessage = undefined;
      this.loadData();
    });
  }

  getHeaderName(user: CollabUserInfo | undefined) {
    if (!user || (!user.first_name && !user.last_name)) {
      return '';
    }
    let c1 = '';
    let c2 = '';
    if (user.first_name && user.first_name.length > 0) {
      c1 = user.first_name[0];
    }
    if (user.last_name && user.last_name.length > 0) {
      c2 = user.last_name[0];
    }

    return c1 + '‌' + c2;
  }

  getPhotoSrc(user: CollabUserInfo | undefined) {
    return `${endpoint()}media/publicusermedia/${user?.media_id}`;
  }

  // private doOnDelete(id: string) {
  //
  // }


  onMessageTouchStart(event: Event, message: MessageInfo, k: number) {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.isTimeStatisfiedForLongPress = false;
    this.touchedMessageIndex = k;
    this.timer = setTimeout(() => {
      this.isTimeStatisfiedForLongPress = true;
    }, 1000);
  }

  onMessageTouchEnd(event: Event, message: MessageInfo, k: number) {

    clearTimeout(this.timer);
    this.timer = undefined;
    if (this.touchedMessageIndex !== k) {
      return;
    }
    if (this.isTimeStatisfiedForLongPress) {
      // this.menuTopLeftPosition.x = event.touches[0].clientX + 'px';
      // this.menuTopLeftPosition.y = event.touches[0].clientY + 'px';
      this.matMenuTrigger.menuData = {message};
      this.matMenuTrigger.openMenu();
    }
    this.isTimeStatisfiedForLongPress = false;
  }

  onRecBtn(e: Event) {
    if (this.isRecording) {
      this.onVoiceTouchend();
    } else {
      this.startRecording();
    }
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  onClearRecBtn(e: Event) {

    this.audioRecordingService.stopRecording((s1) => {

      this.isRecording = false;
      this.recordingTimeString = '';

      this.cdr.detectChanges();
    }, (reason: number) => {
      if (reason == 1) {
        this.toaster.myError('Recorded voice must be longer than 1 second');
      } else {
        this.toaster.myError('Unable to save recorded sound');
      }

    });
    e.preventDefault();
    e.stopPropagation();
    return false;
  }


  onForward(item: MessageInfo) {

    this.router.navigate(['/conversation'], {state: {forward_message: item}});
  }

  chatWithUser(forwardId: string) {
    this.router.navigate([`/chat/${forwardId}`]).then(() => {

      this.usergroup = undefined;
      this.targetUser = undefined;
      this.targetConversation = undefined;
      this.forwardMessage = undefined;
      this.loadData();
    });
  }

  isImageWidthGreater(message: MessageInfo) {
    if (!message.data) {
      return;
    }
    const fileData: FileData = JSON.parse(message.data);
    if (!fileData || !fileData.height || !fileData.width) {
      if (message.type === MessageType.image) {
        return 2;
      }
      return 0;
    }
    if (fileData.width > fileData.height) {
      return 1;
    }
    return 2;
  }

  onSendFileClick() {

    if (this.isWebsocketClosed) {
      this.toaster.myError('Please check your network');
      return;
    }
    this.attachFileInputRef.nativeElement.click();
  }

  onSendImageClick() {

    if (this.isWebsocketClosed) {
      this.toaster.myError('Please check your network');
      return;
    }
    this.attachImageFileInputRef.nativeElement.click();
  }

  onReplyClick(message: MessageInfo) {
    this.isInLoadingMessages = true;
    this.isFromTopLoadEnded = false;
    this.isFromBottomLoadEnded = false;

    const onSuccess = () => {
      const foundDiv = document.querySelector(`[data-messageid="${message.reply_id}"]`)!;
      this.messagesWrapperRef.nativeElement.scroll({
        top: (foundDiv as HTMLDivElement).offsetTop - (window.innerHeight / 2),
        behavior: 'smooth'
      });
      const messageWrapper = foundDiv.getElementsByClassName('message-wrapper')[0];
      const tail = foundDiv.getElementsByTagName('app-message-tail')[0];
      messageWrapper.classList.add('blink');
      tail.classList.add('blink');
      setTimeout(() => {
        if (messageWrapper) {
          messageWrapper.classList.remove('blink');
        }
        if (tail) {
          tail.classList.remove('blink');
        }
      }, 3000);
      const q = this;
      let scrollTimeout: any;
      const callback = () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(function () {
          q.isInLoadingMessages = false;
          scrollTimeout = undefined;
          q.messagesWrapperRef.nativeElement.removeEventListener('scroll', callback);
        }, 100);
      };
      this.messagesWrapperRef.nativeElement.addEventListener('scroll', callback);
    };
    const exists = this.messages.some(s => s.id === message.reply_id);
    if (exists) {
      onSuccess();
    } else {
      this.resetMessages();
      this.baseRestService.MessagesByReplyId(this.userId, message.reply_id).pipe(first())
        .subscribe((d2: BaseResult<MessageInfo[]>) => {
            const msgs = d2.data.sort((s1, s2) =>
              s2.conversation_counter - s1.conversation_counter);
            if (d2.data.length === 0) {
              this.isFromTopLoadEnded = true;
              this.isFromBottomLoadEnded = true;
              this.isInLoadingMessages = false;
              return;
            }
            this.processAndAddMessages(msgs, undefined, false, () => {
              setTimeout(() => {
                onSuccess();
              }, 0);
            });

          },
          error => {
            this.isInLoadingMessages = false;
          });
    }
  }

  getSendMessageText() {
    // return this.richTextAreaRef?.getText() ?? '';
    return this.messageTextString;
  }

  setSendMessageText(val: string) {
    // if (this.richTextAreaRef) {
    //   this.richTextAreaRef.setText(val);
    // }
    this.messageTextString = val;
  }

  addEmoji(e: any) {
    this.richTextAreaRef?.addEmoji(e.emoji.native);
  }


  isWidthGreaterThan500() {
    return window.innerWidth > 500;
  }

  onEmojiBtn(emojiBtn: HTMLButtonElement) {

    this.richTextAreaRef?.blur();
    this.cdr.detectChanges();
    setTimeout(() => {
      if (window.innerWidth < 500) {
        this.showEmojiDesktop = false;
        this.showEmojiMobile = !this.showEmojiMobile;
      } else {
        this.showEmojiMobile = false;
        this.showEmojiDesktop = !this.showEmojiDesktop;
      }
      this.cdr.detectChanges();
    }, 100);
  }

  cancelUpload(e: MessageInfo) {
    if (e.fakeData.subscriber) {
      e.fakeData.subscriber.unsubscribe();
      const index = this.messages.indexOf(e, 0);
      if (index > -1) {
        this.messages?.splice(index, 1);
      }
    }
  }

  onTextAreaFocusIn() {
    this.showEmojiDesktop = false;
    this.showEmojiMobile = false;

  }


  // onAloneEnterInShiftNewLine() {
  //   this.sendTextMsg();
  // }
  //
  overlayRef: OverlayRef | undefined;

  onDragOver(ev: DragEvent) {
    if (!this.overlayRef) {
      this.overlayRef = this.overlay.create({panelClass: 'drag-drop-overlay-wrapper'});
      this.overlayRef.attach(this.portal);
    }
    ev.preventDefault();
  }

  onDrop(ev: DragEvent) {
    this.overlayRef!.detach()
    this.overlayRef = undefined;
    ev.preventDefault();

    let itemList: any = ev.dataTransfer?.items;
    if (!itemList) {
      itemList = ev.dataTransfer?.files;
    }

    if (itemList) {
      for (const item of itemList) {
        let file = item;
        if (item.kind === 'file') {
          file = item.getAsFile();
        }
        this.sendFile(file);
      }
    }
  }

  getFulleName(user: CollabUserInfo | undefined) {
    if (!user) {
      return '';
    }
    return `${user.first_name} ${user.last_name}`
  }

  protected readonly faPaperPlane = faPaperPlane;
  protected readonly faPaperclip = faPaperclip;
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly faReply = faReply;
  protected readonly faXmark = faXmark;
}
