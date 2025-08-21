import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  standalone: false
})
export class ConfirmationDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any) {
    this.confirmMessage = data.title;
  }

  public confirmMessage = '';


  ngOnInit(): void {
  }

  onParentClick($event: MouseEvent) {

    this.dialogRef.close();
  }

  onConfirmClick(e: MouseEvent) {
    this.dialogRef.close(true);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  onCancelClick(e: MouseEvent) {
    this.dialogRef.close(false);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
}
