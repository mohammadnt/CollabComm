import {ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ConversationInfo, FileData, MessageInfo} from '../../../../models/ChatModels';
 import {BaseComponent} from "../../../../core/classes/base-component";

import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ImageViewerComponent} from '../../../../module/image-viewer/image-viewer.component';
import {endpoint} from '../../../../core/cookie-utils';

@Component({
  selector: 'app-message-image-file-template',
  templateUrl: './message-image-file-template.component.html',
  styleUrls: ['./message-image-file-template.component.scss'],
  standalone: false
})
export class MessageImageFileTemplateComponent extends BaseComponent implements OnInit {

  constructor(private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    super();
  }

  get message(): MessageInfo | undefined {
    return this._message;
  }

  @Input() set message(val: MessageInfo | undefined) {
    this._message = val;
    this.isImageDownloaded = false;
    if (!val) {
      this.fileData = undefined;
    } else {
      this.fileData = JSON.parse(val.data ?? '');
    }

    this.cdr.detectChanges();
  }

  isImageDownloaded = false;

  @Input() conversation: ConversationInfo | undefined;
  @Input() selfId: string | undefined;
  @ViewChild('hiddenA') hiddenARef: ElementRef | undefined;
  _message: MessageInfo | undefined;

  @Input() isGroup = false;

  fileData: FileData | undefined;
  isVoicePlaying = false;
  isImageOpen = false;
  mustUpdate = true;
  isLoaded = false;
  isDownloading = false;
  url = '';
  blob: any;
  fileUrl: any;
  downloadName: any;

  //
  // loadedmetadata($event: Event) {
  //   this.isLoaded = true;
  // }

  viewer: MatDialogRef<ImageViewerComponent> | undefined;

  override ngOnInit(): void {

  }


  getMediaSrc() {
    if (!this.message) {
      return '';
    }
    if (this.message.fakeData?.imageUri && this.message.fakeData.imageUri !== '') {
      return this.message.fakeData.imageUri;
    }
    if(!this.message.id){
      return '';
    }
    return `${endpoint()}Chat/ChatMedia/${this.message.id}?is_group=${this.isGroup}`;
  }

  getThumbnailMediaSrc() {
    if (!this.message || !this.message.media_id) {
      return '';
    }
    return `${endpoint()}Chat/ThumbnailChatMedia/${this.message.id}?is_group=${this.isGroup}`;
  }

  onRender($event: number) {

  }

  onClickImage() {
    if (!this.message) {
      return;
    }


    this.viewer = this.dialog.open(ImageViewerComponent, {
      data: {
        thumbnailSrc: this.getThumbnailMediaSrc(), src: this.getMediaSrc(),

      },
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
  }

  getImageAspectRatio() {
    if (!this.fileData || !this.fileData.height || !this.fileData.width) {
      return 'unset';
    }
    if (this.fileData.width <= this.fileData.height) {
      return 'unset';
    }
    return `${this.fileData.width}/${this.fileData.height}`;
  }

  onMainImageLoadedMetaData() {
    this.isImageDownloaded = true;
  }

  isWidthGreater() {

    if (!this.fileData || !this.fileData.height || !this.fileData.width) {
      return 0;
    }
    if (this.fileData.width > this.fileData.height) {
      return 1;
    }
    return 2;
  }

  getWidth(imageWrapper: HTMLDivElement) {
    if (!this.fileData || !this.fileData.height || !this.fileData.width) {
      return '274px';
    }
    if (this.fileData.width > this.fileData.height) {
      return 'unset';
    }
    return `${(imageWrapper.clientHeight * this.fileData.width) / this.fileData.height}px`;
  }
}
