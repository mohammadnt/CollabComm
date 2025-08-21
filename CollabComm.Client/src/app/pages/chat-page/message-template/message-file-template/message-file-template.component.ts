import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {ConversationInfo, FileData, MessageInfo} from '../../../../models/ChatModels';
import {BaseComponent} from "../../../../core/classes/base-component";
import {DomSanitizer} from '@angular/platform-browser';
import {HttpEvent, HttpEventType} from '@angular/common/http';
import {humanFileSize} from '../../../../core/helper/helper';
import {faXmark, faArrowDown, faFile} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-message-file-template',
  templateUrl: './message-file-template.component.html',
  styleUrls: ['./message-file-template.component.scss'],
  standalone: false
})
export class MessageFileTemplateComponent extends BaseComponent implements OnInit {
  @Input() isGroup = false;

  @Input() conversation: ConversationInfo | undefined;

  constructor(private sanitizer: DomSanitizer) {
    super();
  }

  @Output() onCancelUpload = new EventEmitter<MessageInfo>();
  @ViewChild('hiddenA') hiddenARef: ElementRef | undefined;
  // tslint:disable-next-line:variable-name
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
  isLoaded = false;
  isDownloading = false;
  url = '';
  blob: any;
  fileUrl: any;
  downloadName: any;
  downloadProgress: number | undefined;

  override ngOnInit(): void {

  }


  onOpenFile() {
    if (!this.message) {
      return;
    }
    if (this.isLoaded && this.blob) {


      this.downloadName = this.fileData?.org_file_name;

      const data = this.blob;
      const blob = new Blob([data], {type: 'application/octet-stream'});
      this.url = window.URL.createObjectURL(blob);
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.url);
      setTimeout(() => {

        this.openFile();
      }, 0);
      return;
    }

    this.isDownloading = true;
    this.baseRestService.downloadFileChat(this.message.id, this.isGroup)
      .subscribe((event: HttpEvent<any>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            // event.loaded = bytes transfered
            // event.total = "Content-Length", set by the server

            if (event.total) {
              const percentage = event.loaded / event.total;
              this.downloadProgress = percentage;
            } else {
              this.downloadProgress = -1;
            }

          }
          if (event.type === HttpEventType.Response) {

            this.isDownloading = false;
            this.blob = event.body;
            this.isLoaded = true;
          }


        },
        error => {
        });
  }

  openFile() {
    if (this.message) {
      const a = this.hiddenARef?.nativeElement;
      if (a) {
        a.click();

        window.URL.revokeObjectURL(this.url);
      }
    }
  }

  onRender($event: number) {

  }

  getFileSizeHumanReadable() {
    if (!this.fileData || !this.fileData.size) {
      return '';
    }
    return humanFileSize(this.fileData.size);
  }

  cancelUpload() {
    if (!this.message) {
      return;
    }
    this.onCancelUpload.next(this.message);
  }

  protected readonly faXmark = faXmark;
  protected readonly faArrowDown = faArrowDown;
  protected readonly faFile = faFile;
}
