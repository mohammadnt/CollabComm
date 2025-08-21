import {Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {BaseComponent} from "../../../../core/classes/base-component";
import {AudioRecordingServiceOgg} from '../../../../core/services/audio-recording.service';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {ConversationInfo, FileData, MessageInfo} from '../../../../models/ChatModels';
import {HttpEventType} from '@angular/common/http';
import WaveSurfer from 'wavesurfer.js';
import {faArrowDown, faSpinner, faPlay, faPause} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-message-ogg-template',
  templateUrl: './message-ogg-template.component.html',
  styleUrls: ['./message-ogg-template.component.scss'],
  standalone: false
})
export class MessageOggTemplateComponent extends BaseComponent implements OnInit {

  @Input() conversation: ConversationInfo | undefined;

  constructor(private audioRecordingServiceOgg: AudioRecordingServiceOgg,
              private sanitizer: DomSanitizer) {
    super();
  }

  @Input() isGroup = false;
  @ViewChild('audio') audioRef: ElementRef<HTMLAudioElement> | undefined;
  @ViewChild('waveSurfer') waveSurferRef: ElementRef<HTMLDivElement> | undefined;
  @ViewChild('inputRange') inputRangeRef: ElementRef<HTMLInputElement> | undefined;
  currentTimeString = '';
  audioDuration = '';
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
  isDownloading = false;
  oggSoundUrl: SafeUrl | undefined;

  override ngOnInit(): void {
  }

  getMediaSrc() {
    if (this.oggSoundUrl) {
      return this.oggSoundUrl;
    }
    return '';
  }

  onDownload() {
    if (!this.message) {
      return;
    }
    if (this.isDownloading) {
      return;
    }
    this.isDownloading = true;
    this.baseRestService.downloadFileChat(this.message.id, this.isGroup)
      .subscribe((event) => {
          if (event.type === HttpEventType.DownloadProgress) {
            // event.loaded = bytes transfered
            // event.total = "Content-Length", set by the server

            // if (event.total) {
            //   const percentage = event.loaded / event.total;
            //   this.downloadProgress = percentage;
            // } else {
            //   this.downloadProgress = -1;
            // }

          }
          if (event.type === HttpEventType.Response) {
            const arrayBuffer = event.body;
            const uint8View = new Uint8Array(arrayBuffer);
            console.log(uint8View);
            this.audioRecordingServiceOgg.decodeOgg(uint8View, (blob2) => {
              // const x = new File([blob2], `${uuid.v4()}.${title.split('.').pop()}`);
              this.oggSoundUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob2));
              setTimeout(() => {

                this.initializeWaveSurfer();
              }, 0)
            });
          }
        },
        error => {
        });
  }

  waveSurfer: WaveSurfer | undefined;

  private initializeWaveSurfer() {
    if (!this.oggSoundUrl) {
      return;
    }
    if (this.waveSurfer) {
      this.waveSurfer.destroy();
    }
    let waveColor: string;
    let progressColor: string;
    if (this.message?.is_sender) {
      waveColor = '#bbdfba'
      progressColor = '#4fae4e'
    } else {

      waveColor = '#c1ddf9'
      progressColor = '#3390ec'
    }
    this.waveSurfer = WaveSurfer.create({
      container: this.waveSurferRef!.nativeElement,
      waveColor: waveColor,
      height: 16,
      progressColor: progressColor,
      media: this.audioRef!.nativeElement,
      // Set a bar width
      barWidth: 2,
      // Optionally, specify the spacing between bars
      barGap: 1,
      // And the bar radius
      barRadius: 2,
    });
  }

  onPlayBtn() {
    if (!this.isLoaded) {
      if (!this.isDownloading) {
        this.onDownload();
      }
      return;
    }
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
      this.currentTimeString = this.calculateTime((this.audioRef?.nativeElement.currentTime ?? 0));

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

  onSliderMouseUp($event: MouseEvent) {
    this.mustUpdate = true;
  }

  onSliderMouseDown($event: MouseEvent) {
    this.mustUpdate = false;
  }

  protected readonly faArrowDown = faArrowDown;
  protected readonly faSpinner = faSpinner;
  protected readonly faPlay = faPlay;
  protected readonly faPause = faPause;
}
