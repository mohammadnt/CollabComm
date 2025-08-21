import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MessageInfo} from '../../../models/ChatModels';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-message-info-dialog',
  templateUrl: './message-info-dialog.component.html',
  styleUrls: ['./message-info-dialog.component.scss'],
  standalone: false
})
export class MessageInfoDialogComponent implements OnInit {
  message: MessageInfo | undefined;

  constructor(public dialogRef: MatDialogRef<MessageInfoDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
  }

  ngOnInit(): void {
    this.message = this.data.message;
  }

  onParentClick($event: MouseEvent) {
    this.dialogRef.close();
  }

  onCloseBtn(e: MouseEvent) {

    this.dialogRef.close();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  getMessageDate() {
    if (!this.message) {
      return '';
    }
    const date = new Date(this.message.creation_date);
    const year = date.getFullYear();
    let month = (date.getMonth() + 1).toString();
    let dt = date.getDate().toString();

    if ((date.getDate() + 1) < 10) {
      dt = '0' + dt;
    }
    if (date.getMonth() < 10) {
      month = '0' + month;
    }

    return `${year}/${month}/${dt}`;
  }

  getMessageTime() {
    if (!this.message) {
      return '';
    }
    const date = new Date(this.message.creation_date);
    let h = date.getHours().toString();
    let m = date.getMinutes().toString();
    let s = date.getSeconds().toString();

    if (date.getHours() < 10) {
      h = '0' + h;
    }
    if (date.getMinutes() < 10) {
      m = '0' + m;
    }
    if (date.getSeconds() < 10) {
      s = '0' + s;
    }

    return `${h}:${m}:${s}`;
  }

  protected readonly faXmark = faXmark;
}
