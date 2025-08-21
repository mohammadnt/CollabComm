import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {SharedModule} from "../../shared/shared.module";
import {ChatPageComponent} from "./chat-page.component";
import {TwemojiTextModuleComponent} from "./twemoji-text-module/twemoji-text-module.component";
import {ProfileInfoComponent} from "./profile-info/profile-info.component";
import {MessageFileTemplateComponent} from "./message-template/message-file-template/message-file-template.component";
import {
  MessageVoiceTemplateComponent
} from "./message-template/message-voice-template/message-voice-template.component";
import {MessageTextTemplateComponent} from "./message-template/message-text-template/message-text-template.component";
import {MessageTailComponent} from "./message-template/message-tail/message-tail.component";
import {
  MessageSystemTemplateComponent
} from "./message-template/message-system-template/message-system-template.component";
import {
  MessageStatusWrapperComponent
} from "./message-template/message-status-wrapper/message-status-wrapper.component";
import {MessageOggTemplateComponent} from "./message-template/message-ogg-template/message-ogg-template.component";
import {
  MessageImageFileTemplateComponent
} from "./message-template/message-image-file-template/message-image-file-template.component";
import {MessageInfoDialogComponent} from "./message-info-dialog/message-info-dialog.component";
import {GroupMemberComponent} from "./group-member/group-member.component";
import {CustomTextAreaComponent} from "./custom-text-area/custom-text-area.component";
import {RichTextAreaComponent} from "./custom-text-area/rich-text-area/rich-text-area.component";
import {ConversationPageComponent} from "./conversation-page/conversation-page.component";
import {AuthGuard} from '../../core/auth-guard.service';
import {SecurePipe} from '../../core/pipe/secure.pipe';
import {DirectionPipe} from '../../core/pipe/direction.pipe';

const routes: Routes = [
  {
    path: '',
    component: ConversationPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'conversation',
    component: ConversationPageComponent,
    canActivate: [AuthGuard]
  },
  {path: 'chat-profile/:userid', component: ProfileInfoComponent, canActivate: [AuthGuard]},
  {path: 'group-members/:id', component: GroupMemberComponent, canActivate: [AuthGuard]},

  {path: 'chat/:userid', component: ChatPageComponent, canActivate: [AuthGuard]},

];

@NgModule({
  declarations: [
    TwemojiTextModuleComponent,
    ChatPageComponent,
    ProfileInfoComponent,
    MessageFileTemplateComponent,
    MessageImageFileTemplateComponent,
    MessageOggTemplateComponent,
    MessageStatusWrapperComponent,
    MessageSystemTemplateComponent,
    MessageTailComponent,
    MessageTextTemplateComponent,
    MessageVoiceTemplateComponent,
    MessageInfoDialogComponent,
    GroupMemberComponent,
    CustomTextAreaComponent,
    RichTextAreaComponent,
    ConversationPageComponent,
  ],
  exports: [
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    SecurePipe,
    DirectionPipe,
  ]
})
export class ChatPageModule {
}
