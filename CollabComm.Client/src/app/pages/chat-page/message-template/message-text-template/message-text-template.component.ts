import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, ViewChild} from '@angular/core';
import {ConversationInfo, MessageInfo} from '../../../../models/ChatModels';
import {DomSanitizer} from '@angular/platform-browser';
import {replaceAll} from '../../../../core/util';
import {MessageType} from '../../../../models/enums';

@Component({
  selector: 'app-message-text-template',
  templateUrl: './message-text-template.component.html',
  styleUrls: ['./message-text-template.component.scss'],
  standalone: false
})
export class MessageTextTemplateComponent implements AfterViewInit {
  protected readonly MessageType = MessageType;
  constructor(private cdr: ChangeDetectorRef, private sanitized: DomSanitizer) {
  }

  @ViewChild('cursor') cursorRef: ElementRef<HTMLSpanElement> | undefined;
  @Input() conversation: ConversationInfo | undefined;
  @Input() isGroup = false;
  _message: MessageInfo | undefined;
  get message(): MessageInfo | undefined {
    return this._message;
  }

  @Input() set message(val: MessageInfo | undefined) {
    this._message = val;
    // if (!val) {
    //   this.fileData = undefined;
    // } else {
    //   this.fileData = JSON.parse(val.data ?? '');
    // }
    // this.cdr.detectChanges();
  }

  ngAfterViewInit() {
  }

  getProccessedText(text: string) {


    function urlify(text1: any) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text1.replace(urlRegex, (url: any) => {
        return '<a href="' + url + '"  target="_blank">' + url + '</a>';
      });
      // or alternatively
      // return text.replace(urlRegex, '<a href="$1">$1</a>')
    }

    const html = urlify(text);
    return replaceAll(html ?? '', '\n\r', '\n');
  }

  getStatusOffsetLeft() {
    if (!this.cursorRef) {
      return 0;
    }
    const left = this.cursorRef.nativeElement.offsetLeft;
    if (left > 274 - 52) {
      return 0;
    }
    return left;
  }


}
