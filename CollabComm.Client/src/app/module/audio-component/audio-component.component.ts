import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-audio-component',
  templateUrl: './audio-component.component.html',
  styleUrls: ['./audio-component.component.scss'],
  standalone: false
})
export class AudioComponentComponent implements OnInit, OnChanges {

  @Input() mediaSrc: string | undefined;

  @Input() showBorder = false;
  @Input() borderRadius = 20;
  @Input() persianText = '';
  @Input() englishText = '';
  @Output() englishTextChange = new EventEmitter<string>();
  @Output() persianTextChange = new EventEmitter<string>();
  @Input() hasPersianText = false;
  @Input() hasEnglishText = false;
  @Output() hasEnglishTextChange = new EventEmitter<boolean>();
  @Output() hasPersianTextChange = new EventEmitter<boolean>();
  @ViewChild('audioElem') audioElemRef!: ElementRef<HTMLAudioElement>;
  isPlaying = false;
  isLoaded = false;
  @Input() loadSubtitles = false;
  @Input() vttEn : string | undefined;
  @Input() vttFa : string | undefined;

  constructor() {
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['mediaSrc']?.currentValue !== changes['mediaSrc']?.previousValue) {
      if (this.audioElemRef && this.audioElemRef?.nativeElement) {
        this.audioElemRef.nativeElement.pause();
        this.audioElemRef.nativeElement.currentTime = 0;
      }
      this.hasPersianText = false;
      this.hasEnglishText = false;
      this.hasPersianTextChange.emit(this.hasPersianText)
      this.hasEnglishTextChange.emit(this.hasEnglishText)
    }
  }

  ngOnInit(): void {
  }

  onVideoLoadedData() {

    this.isLoaded = true;
    if (this.audioElemRef.nativeElement.textTracks.length > 0) {
      this.audioElemRef.nativeElement.textTracks[0].mode = 'showing';
    }
    if (this.audioElemRef.nativeElement.textTracks.length > 1) {
      this.audioElemRef.nativeElement.textTracks[1].mode = 'showing';
    }

  }

  setSpeed(speed: number) {
    this.audioElemRef.nativeElement.playbackRate = speed;
  }

  onPlay() {
    this.isPlaying = true;
    this.audioElemRef.nativeElement.play();
  }

  onPause() {
    this.isPlaying = false;
    this.audioElemRef.nativeElement.pause();
  }

  onClick() {
    if (!this.isPlaying) {
      this.onPlay();
    } else {
      this.onPause();
    }
  }

  onEnded() {
    this.isPlaying = false;
  }

  // getVttFaSrc() {
  //   if (!this.mediaSrc) {
  //     return;
  //   }
  //   const fullPath = this.mediaSrc;
  //   const dirPath = fullPath.split('/').slice(0, -1).join('/');
  //   const filename = fullPath.replace(/^.*[\\\/]/, '');
  //   const pureFileName = filename.split('.').slice(0, -1).join('.');
  //   const fileExt = filename.split('.').pop();
  //   const url = `${dirPath}/${pureFileName}-vttfa.vtt`;
  //   return url;
  // }
  //
  // getVttEnSrc() {
  //   if (!this.mediaSrc) {
  //     return;
  //   }
  //   const fullPath = this.mediaSrc;
  //   const dirPath = fullPath.split('/').slice(0, -1).join('/');
  //   const filename = fullPath.replace(/^.*[\\\/]/, '');
  //   const pureFileName = filename.split('.').slice(0, -1).join('.');
  //   const fileExt = filename.split('.').pop();
  //   const url = `${dirPath}/${pureFileName}-vtten.vtt`;
  //   return url;
  // }

  onEnCueChange(e: Event | undefined) {
    if (!!e) {
      this.onFaCueChange(undefined);
    }
    if ((this.audioElemRef?.nativeElement.textTracks.length ?? 0) > 0 &&
      (this.audioElemRef?.nativeElement.textTracks[0].activeCues?.length ?? 0) > 0) {
      if (this.audioElemRef?.nativeElement.textTracks[0].activeCues) {
        this.englishText = (this.audioElemRef.nativeElement.textTracks[0].activeCues[0] as any).text;
        this.englishTextChange.emit(this.englishText)
        return;
      }
    }
    this.englishText = '';
    this.englishTextChange.emit(this.englishText)
  }

  onFaCueChange(e: Event | undefined) {
    if (!!e) {
      this.onEnCueChange(undefined);
    }
    if ((this.audioElemRef?.nativeElement.textTracks.length ?? 0) > 0 &&
      (this.audioElemRef?.nativeElement.textTracks[1].activeCues?.length ?? 0) > 0) {
      if (this.audioElemRef?.nativeElement.textTracks[1].activeCues) {
        this.persianText = (this.audioElemRef.nativeElement.textTracks[1].activeCues[0] as any).text;
        this.persianTextChange.emit(this.persianText)
        return;
      }
    }
    this.persianText = '';
    this.persianTextChange.emit(this.persianText)
  }

  onEnLoadedData() {
    console.log('onEnLoadedData')
    this.hasEnglishText = true;
    this.hasEnglishTextChange.emit(this.hasEnglishText)
  }

  onFaLoadedData() {
    console.log('onFaLoadedData')
    this.hasPersianText = true;
    this.hasPersianTextChange.emit(this.hasPersianText)
  }
}
