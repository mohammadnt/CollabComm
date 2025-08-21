import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-loading-dialog',
  templateUrl: './loading-dialog.component.html',
  styleUrls: ['./loading-dialog.component.scss'],
  standalone: false
})

export class LoadingDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<LoadingDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: LoadingDialogData) {
  }

  ngOnInit(): void {
  }

  onRender($event: number) {

  }
}

export interface LoadingDialogData {
  title: string;
}
