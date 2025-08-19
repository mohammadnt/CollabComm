import {Component, Inject, OnInit} from '@angular/core';
import {ImageCroppedEvent} from 'ngx-image-cropper';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import { faXmark, faCheck } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-image-cropper-manager',
  templateUrl: './image-cropper-manager.component.html',
  styleUrls: ['./image-cropper-manager.component.scss'],
  standalone: false
})
export class ImageCropperManagerComponent implements OnInit {
  aspectRatio: number;
  croppedImage: Blob | undefined;
  imageFile: File | undefined;

  constructor(private dialogRef: MatDialogRef<ImageCropperManagerComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ImageCropperManagerData,) {
    this.imageFile = data.imageFile;
    this.aspectRatio = data.aspectRatio;
  }

  ngOnInit(): void {
  }


  imageCropped(event: ImageCroppedEvent) {
    if (!event.blob) {
      return;
    }

    this.croppedImage = event.blob;

  }

  onSubmitBtn() {
    this.dialogRef.close(true);
  }


  onParentClick($event: MouseEvent) {

  }

  onClose() {
    this.dialogRef.close(false);
  }

  onDone() {
    this.dialogRef.close(true);
  }

  protected readonly faCheck = faCheck;
  protected readonly faXmark = faXmark;
}

export interface ImageCropperManagerData {
  imageFile: File;
  aspectRatio: number;
}
