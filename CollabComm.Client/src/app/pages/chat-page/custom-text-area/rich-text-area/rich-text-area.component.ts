import {Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {CustomTextAreaComponent} from '../custom-text-area.component';

@Component({
  selector: 'app-rich-text-area',
  templateUrl: './rich-text-area.component.html',
  styleUrls: ['./rich-text-area.component.scss'],
  standalone: false
})
export class RichTextAreaComponent implements OnInit {
  isTextSelected = false;
  isInBold = false;
  @Input() minHeight = 35;
  _value = '';
  get value(): string {
    return this._value;
  }

  @Input() set value(val: string) {
    if (val === this._value) {
      return;
    }
    this._value = val;
    this.valueChange.emit(val);
  }

  get isSafari() {

    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  @ViewChild('customMessageTextArea') customMessageTextAreaRef: CustomTextAreaComponent | undefined;
  @ViewChild('messageTextArea') messageTextAreaRef: ElementRef<HTMLTextAreaElement> | undefined;
  @Output() onFocusIn = new EventEmitter<true>();

  @Input() disabled: boolean | undefined;
  @Input() placeholder: string | undefined;
  @Output() valueChange = new EventEmitter<string>();

  textModel = '';

  constructor() {

  }

  ngOnInit(): void {


  }

  focus() {
    this.messageTextAreaRef?.nativeElement.focus();
    this.customMessageTextAreaRef?.focus();
  }

  blur() {
    this.messageTextAreaRef?.nativeElement?.blur();
    this.customMessageTextAreaRef?.blur();
  }

  setText(val: string) {
    if (this.customMessageTextAreaRef) {
      this.customMessageTextAreaRef.setValue(val);
    } else if (this.messageTextAreaRef) {
      this.textModel = val;
    }
    this.value = val;
  }

  getText(): string {
    // if (this.customMessageTextAreaRef) {
    //   return this.customMessageTextAreaRef._value;
    // } else if (this.messageTextAreaRef) {
    //   return this.textModel;
    // }
    // return '';
    return this.value;
  }

  addEmoji(e: string) {
    if (this.customMessageTextAreaRef) {
      this.customMessageTextAreaRef?.addEmoji(e);
    } else if (this.messageTextAreaRef) {
      const text = e;
      const el = this.messageTextAreaRef.nativeElement;
      const val = el.value;
      let endIndex;
      let startIndex;
      let range;
      if (typeof el.selectionStart !== 'undefined' && typeof el.selectionEnd !== 'undefined') {
        endIndex = el.selectionEnd;
        startIndex = el.selectionEnd;
        const t = this.getText();
        const t2 = t.slice(0, el.selectionStart) + text + t.slice(endIndex);
        el.value = t2;
        this.setText(t2);
        el.selectionStart = el.selectionEnd = startIndex + text.length;
      } else if (typeof (document as any).selection !== 'undefined' && typeof (document as any).selection.createRange !== 'undefined') {
        el.focus();
        range = (document as any).selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
      }
    }
  }

  onTextAreaFocusIn() {
    this.onFocusIn.emit(true);
  }

  onTextSelectedChanged(e: { isSelected: boolean, isInBold: boolean }) {
    this.isTextSelected = e.isSelected;
    this.isInBold = e.isInBold;
  }

  onBoldBtn() {
    if (this.customMessageTextAreaRef) {
      this.customMessageTextAreaRef.onBoldBtn();
    } else {
    }
  }

  fakemousedown() {

  }

  faketouchstart() {

  }
}
