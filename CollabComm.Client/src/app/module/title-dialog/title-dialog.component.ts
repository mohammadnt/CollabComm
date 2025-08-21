import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './title-dialog.component.html',
  styleUrls: ['./title-dialog.component.scss'],
  standalone: false
})

export class TitleDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<TitleDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: TitleDialogData) {
  }

  ngOnInit(): void {
  }

  onRender($event: number) {

  }

  onClose() {
    this.dialogRef.close();
  }
}

export interface TitleDialogData {
  title: string;
}
