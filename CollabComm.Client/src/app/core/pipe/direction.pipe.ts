import {Pipe, PipeTransform} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';

@Pipe({
  name: 'direction'
})
export class DirectionPipe implements PipeTransform {

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  transform(text: string | undefined): string {
    return getLangDir(text);
  }

}

export function getLangDir(text: string | undefined): string {
  if (!text || text === '') {
    return 'ltr';
  }
  const t2 = text.replace(/\p{Emoji}/gu, '');
  var ltrChars    = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF'+'\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF',
    rtlChars    = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC',
    rtlDirCheck = new RegExp('^[^'+ltrChars+']*['+rtlChars+']');

  // if (text.startsWith('🟡🟡🟡🟡🟡🟡🟡')) {
  //   console.log(t2)
  //   console.log(rtlDirCheck.test(t2))
  // }
  return rtlDirCheck.test(t2) ? 'rtl' : 'ltr';


  // return /^[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(t2) ? 'rtl' : 'ltr';




  // const rtlRegex = new RegExp('[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]+');
  // const textalign = (rtlRegex.test(text[0])) ? 'rtl' : 'ltr';
  // return textalign;
}
