import {Pipe, PipeTransform} from '@angular/core';
import {replaceAll} from '../util';


@Pipe({
  name: 'fixEnter'
})
export class FixEnterPipe implements PipeTransform {
  constructor() {
  }

  transform(value: string) {
    return replaceAll(replaceAll(value, '\n\r', '<br>'), '\n', '<br>');
  }
}
