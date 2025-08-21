import {AfterViewInit, Component, ElementRef, Input, ViewChild} from '@angular/core';
import * as twemoji from 'twemoji';

@Component({
  selector: 'app-twemoji-text-module',
  templateUrl: './twemoji-text-module.component.html',
  styleUrls: ['./twemoji-text-module.component.scss'],
  standalone: false
})
export class TwemojiTextModuleComponent implements AfterViewInit {
  _value: string | undefined;
  @Input() isOneLine = false;

  @Input() set value(val: string | undefined) {
    if (val === this._value) {
      return;
    }
    this._value = val;
    this.setText();
  }

  get value(): string | undefined {
    return this._value;
  }

  @ViewChild('textSpan') textSpanRef: ElementRef<HTMLSpanElement> | undefined;

  ngAfterViewInit(): void {
    this.setText();
  }

  setText() {
    if (this.textSpanRef?.nativeElement) {
      this.textSpanRef.nativeElement.innerHTML = this._value ?? '';
      twemoji.default.parse(this.textSpanRef.nativeElement, {
        callback: (icon: string, options: any, variant: string) => {
          return ''.concat(
            'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/', // by default Twitter Inc. CDN

            icon,         // the found emoji as code point
            options.ext   // by default ".png"
          );
        }
      });
    }
  }
}
