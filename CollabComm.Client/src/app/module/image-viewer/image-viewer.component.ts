import {AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {LocationStrategy} from '@angular/common';

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss'],
  standalone: false
})
export class ImageViewerComponent implements OnInit, AfterViewInit {
  @ViewChild('mainImg') mainImgRef!: ElementRef<HTMLImageElement>;

  constructor(private dialogRef: MatDialogRef<ImageViewerComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ImageViewerData,
              private location: LocationStrategy) {
    history.pushState(null, '', window.location.href);
    this.location.onPopState(() => {
      this.dialogRef.close();
      history.pushState(null, '', window.location.href);
    });
  }

  isImageDownloaded = false;

  ngOnInit() {

  }


  onMainImageLoadedMetaData() {
    this.isImageDownloaded = true;

  }

  onDetailXMark() {
    this.dialogRef.close();

  }

  onParentClick($event: MouseEvent) {

  }

  ngAfterViewInit(): void {

  }
}

export interface ImageViewerData {
  thumbnailSrc: string | undefined;
  src: string;
}
