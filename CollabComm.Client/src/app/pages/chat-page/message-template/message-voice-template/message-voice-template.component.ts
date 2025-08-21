import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ConversationInfo, FileData, MessageInfo} from '../../../../models/ChatModels';
import {endpoint} from '../../../../core/cookie-utils';
import {faSpinner, faPlay, faPause} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-message-voice-template',
  templateUrl: './message-voice-template.component.html',
  styleUrls: ['./message-voice-template.component.scss'],
  standalone: false
})
export class MessageVoiceTemplateComponent implements OnInit {

  constructor() {
  }

  @Input() conversation: ConversationInfo | undefined;
  @Input() isGroup = false;
  @ViewChild('audio') audioRef: ElementRef<HTMLAudioElement> | undefined;
  @ViewChild('inputRange') inputRangeRef: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('audioTimeCounter') audioTimeCounterRef: ElementRef<HTMLDivElement> | undefined;
  _message: MessageInfo | undefined;
  get message(): MessageInfo | undefined {
    return this._message;
  }

  @Input() set message(val: MessageInfo | undefined) {
    this._message = val;
    if (!val) {
      this.fileData = undefined;
    } else {
      this.fileData = JSON.parse(val.data ?? '');
    }
  }

  fileData: FileData | undefined;
  isVoicePlaying = false;

  mustUpdate = true;
  isLoaded = false;
  audioDuration = '';

  ngOnInit(): void {
  }

  getMediaSrc() {
    if (!this.message || !this.message.id) {
      return;
    }
    return `${endpoint()}Chat/ChatMedia/${this.message.id}?is_group=${this.isGroup}`;
  }

  onPlayBtn() {
    if (this.isVoicePlaying) {
      this.audioRef?.nativeElement.pause();
      this.isVoicePlaying = false;
    } else {
      this.audioRef?.nativeElement.play();
      this.whilePlaying();
      this.isVoicePlaying = true;
    }
  }

  touchstart($event: TouchEvent) {
    this.mustUpdate = false;
  }

  touchcancel($event: TouchEvent) {
    this.mustUpdate = true;

  }

  touchend($event: TouchEvent) {
    this.mustUpdate = true;

  }

  whilePlaying() {
    if (this.mustUpdate) {
      if (this.inputRangeRef) {
        this.inputRangeRef.nativeElement.value = (this.audioRef?.nativeElement.currentTime ?? 0).toString();
      }
      if (this.audioTimeCounterRef) {
        this.audioTimeCounterRef.nativeElement.innerText = this.calculateTime((this.audioRef?.nativeElement.currentTime ?? 0));
      }
    }
    setTimeout(() => {
      if (this.isVoicePlaying) {
        this.whilePlaying();
      }
    }, 0.01);
  }

  calculateTime(secs: number): string {

    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${returnedSeconds}`;
  }

  onSliderChange($event: Event) {
    if (this.audioRef) {
      this.audioRef.nativeElement.currentTime = Number(this.inputRangeRef?.nativeElement.value);
    }

  }

  loadedmetadata($event: Event) {
    this.audioDuration = this.calculateTime(this.audioRef?.nativeElement.duration ?? 0).toString();
    this.isLoaded = true;
  }

  onRender($event: number) {

  }

  protected readonly faSpinner = faSpinner;
  protected readonly faPlay = faPlay;
  protected readonly faPause = faPause;
}
