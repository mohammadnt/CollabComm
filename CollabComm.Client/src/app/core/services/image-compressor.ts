import {Injectable} from '@angular/core';
import {DOC_ORIENTATION, NgxImageCompressService} from 'ngx-image-compress';

@Injectable({
  providedIn: 'root'
})
export class ImageCompressor {
  localCompressedURl: any;
  // sizeOfOriginalImage = 0;
  sizeOFCompressedImage = 0;
  imgResultBeforeCompress = '';
  imgResultAfterCompress = '';

  constructor(
    private imageCompress: NgxImageCompressService) {
  }

  async compressFileBase64Async(base64: string, fileName: any, ratio: number, quality: number, maxWidth: number, maxHeight: number,
                                getDimensions: boolean) {
    const result = await this.imageCompress.compressFile(base64, DOC_ORIENTATION.Default, 50, 60, maxWidth, maxHeight)
    this.imgResultAfterCompress = result;
    this.localCompressedURl = result;
    this.sizeOFCompressedImage = this.imageCompress.byteCount(result);
    console.warn('Size in bytes after compression:', this.sizeOFCompressedImage);
// create file from byte
    const imageName = fileName;
// call method that creates a blob from dataUri
    if (getDimensions) {

      const dimensions = await this.getImageDimensions(result)
      const {width, height} = dimensions;
      const result1 = await this.dataURItoBlob(result);
      const imageFile = new File([result1], imageName, {type: 'image/jpeg'});

      return {imageFile, uri: result, width, height};


    } else {
      const result1 = await this.dataURItoBlob(result);
      const imageFile = new File([result1], imageName, {type: 'image/jpeg'});
      return {imageFile, uri: result, width: undefined, height: undefined};

    }
  }

  async compressFileAsync(image: File | Blob, fileName: any, ratio: number, quality: number, maxWidth: number, maxHeight: number,
               getDimensions: boolean) {
    return new Promise<{ imageFile: File, uri: string, width: number | undefined, height: number | undefined }>((resolved, rejected) => {
    const reader = new FileReader();
    reader.onload = async (event1: any) => {


      // this.sizeOfOriginalImage = this.imageCompress.byteCount(image);
      // console.warn('Size in bytes is now:', this.sizeOfOriginalImage);
      const q = await this.compressFileBase64Async(event1.target.result, fileName, ratio, quality, maxWidth, maxHeight, getDimensions);
      resolved(q)

    };
    reader.readAsDataURL(image);
    });
  }

  getImageDimensions(uri: string) {
    return new Promise<{ width: number, height: number }>((resolved, rejected) => {
      const i = new Image();
      i.onload = () => {
        resolved({width: i.width, height: i.height});
      };
      i.src = uri;
    });
  }

  async dataURItoBlob(dataURI: any) {

    const res = await fetch(dataURI);
    return res.blob();
  }
}
