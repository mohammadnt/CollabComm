import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {StorageService} from '../../core/services/storage.service';

@Component({
  selector: 'app-add-to-home',
  templateUrl: './add-to-home.component.html',
  styleUrls: ['./add-to-home.component.scss'],
  standalone: false
})
export class AddToHomeComponent implements OnInit {

  constructor(private storageService: StorageService,
              public dialogRef: MatDialogRef<AddToHomeComponent>,
              @Inject(MAT_DIALOG_DATA) public data: AddToHomeDialogData) {
  }

  ngOnInit(): void {
  }

  onClose() {
    this.storageService.setInLocalStorage('show_add_to_home', new Date().toString());
    this.dialogRef.close();
  }
}

export interface AddToHomeDialogData {
  isForNotification: string;
}
