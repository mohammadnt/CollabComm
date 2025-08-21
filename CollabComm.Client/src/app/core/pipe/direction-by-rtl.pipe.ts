import {Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({
  name: 'directionByRtl'
})
export class DirectionByRtlPipe implements PipeTransform {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  transform(text: string | undefined): string {
    return getLangDirByRtl(text);
  }

}

export function getLangDirByRtl(text: string | undefined): string {
  if (!text || text === '') {
    return 'ltr';
  }
  const t2 = text.replace(/\p{Emoji}/gu, '');
  const ltrDirCheck = /^[\s\w\d\x21-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]*$/;
  return !ltrDirCheck.test(t2) ? 'rtl' : 'ltr';

}
