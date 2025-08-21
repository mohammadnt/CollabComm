import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  SecurityContext,
  ViewChild
} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {DOCUMENT} from '@angular/common';
import {animationFrameScheduler, Subject, Subscription} from 'rxjs';
import {filter, map, take, timeInterval} from 'rxjs/operators';
import {EmojiUtils} from '../../../core/services/emoji-utils.service';
import {isNullOrEmpty} from '../../../core/util';

@Component({
  selector: 'app-custom-text-area',
  templateUrl: './custom-text-area.component.html',
  styleUrls: ['./custom-text-area.component.scss'],
  standalone: false
})
export class CustomTextAreaComponent implements OnInit, OnDestroy, AfterViewInit {
  private isMouseDown = false;
  // Clears the history while leaving
  @Output() onTextSelectedChanged = new EventEmitter<{ isSelected: boolean, isInBold: boolean }>();
  @ViewChild('buttons') buttonsRef?: ElementRef<HTMLDivElement>;
  @Output() valueChange = new EventEmitter<string>();
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
    this.setValue(val);
  }

  private get window(): Window | null {
    return this.document.defaultView;
  }

  /** Input's HTMLElement */
  public get element(): HTMLElement | undefined {
    return this.mydivRef?.nativeElement;
  }

  /** The Document's Selection object */
  private get selection(): Selection {
    return this.document.getSelection()!;
  }

  get divValue(): string {
    return this.mydivRef?.nativeElement?.innerHTML ?? '';
  }


  cacheDivStringValue() {
    this._value = this.getPureText(this.element?.firstChild ?? null).trim();
    this.valueChange.emit(this._value);
  }

  constructor(@Inject(DOCUMENT) private document: Document, private elref: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef, private sanitized: DomSanitizer,
              private utils: EmojiUtils, private zone: NgZone) {
    document.addEventListener('mouseup', (ev) => {
      if (this.isMouseDown) {
        this.onMyDivMouseUp(ev);
      }
      this.isMouseDown = false;
    });
  }


  /** Returns true whenever the last modifications can be undone */
  private get undoable(): boolean {
    return this.history.length > 0 && this.timeIndex + 1 < this.history.length;
  }

  /** Returns true whenever the last undone modifications can be redone */
  private get redoable(): boolean {
    return this.history.length > 0 && this.timeIndex > 0;
  }

  /** True whenever this input has focus */
  public get focused(): boolean {
    return this.document.activeElement === this.element;
  }

  private get mac(): boolean {
    return /Mac|^iP/.test(this.window?.navigator.platform ?? '');
  }

  @ViewChild('mydiv') mydivRef!: ElementRef<HTMLDivElement>;
  @Input() placeholder = '';
  _disabled: boolean | undefined;

  get disabled(): boolean | undefined {
    return this._disabled;
  }

  @Input() set disabled(val: boolean | undefined) {
    this._disabled = val;
  }

  unsibmittedValue: string | undefined;


  // Current selection
  private start = 0;
  private end = 0;
  private history!: { value: string, selection: [number, number] }[];
  private timeIndex!: number;
  /** The Window object */
  private store$ = new Subject<{ value: string, selection: [number, number] }>();
  private sub$!: Subscription;

  protected readonly isNullOrEmpty = isNullOrEmpty;


  imgMouseDown = (e: MouseEvent) => {
    this.onImgMouseDown(e.target, e.clientX);
  };
  imgTouchStart = (e: TouchEvent) => {
    this.onImgMouseDown(e.target, e.touches[0].clientX);
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    return false;
  };

  setValue(text: string) {

    this.mydivRef.nativeElement.innerHTML = '';
    this.insertUnprocessedText(text);
  }

  ngOnInit() {
    this.enableHistory();
  }

  ngOnDestroy() {
    this.clearHistory();
  }

  ngAfterViewInit() {

    this.store(true);
    if (this.unsibmittedValue) {
      this.mydivRef.nativeElement.innerHTML = '';
      this.insertUnprocessedText(this.unsibmittedValue);
    }
  }

  /** Clears the history buffer */
  private clearHistory(): this {
    // Unsubscribe the previous subscription, if any
    if (!!this.sub$) {
      this.sub$.unsubscribe();
    }
    // Initializes the history buffer
    this.timeIndex = 0;
    this.history = [];
    return this;
  }


  onMyDivMouseDown($event: MouseEvent) {
    this.isMouseDown = true;
  }

  onMyDivMouseUp(e: MouseEvent) {
    this.query();

    if (this.start === this.end && e.target instanceof HTMLImageElement) {
      this.onImgMouseDown(e.target, e.clientX);
    } else {
      // this.query();
    }
  }

  onMyDivTouchEnd(e: TouchEvent) {
    this.query();
    if (this.start === this.end && e.target instanceof HTMLImageElement) {
      this.onImgMouseDown(e.target, e.touches[0].clientX);
    } else {
      // this.query();
    }
  }

  onMyDivKeyUp(ev: KeyboardEvent) {

    // const caret = this.getCaretCharacterOffsetWithin(this.mydivRef.nativeElement);
    // this.start = caret;
    if (ev.repeat && this.mac) {
      return;
    }

    // Intercepts accelerators
    if (ev.metaKey && this.mac || ev.ctrlKey) {
      return;
    }
    this.query();
    this.store();
  }

  onMyDivKeyDown(ev: KeyboardEvent) {
    // Prevents keyboard repeating giving a chance to Mac's press&hold to work
    if (ev.repeat && this.mac) {
      ev.preventDefault();
      return false;
    }

    // Intercepts accelerators
    if (ev.metaKey && this.mac || ev.ctrlKey) {
      return this.keyAccellerators(ev);
      ev.preventDefault();
      return false;
    }
    return true;
  }

  onMyDivPaste(ev: ClipboardEvent) {
    const cp = (ev.clipboardData || (window as any).clipboardData);
    if (!cp) {
      return false;
    }
    // Pastes the data from the clipboard
    try {
      const text = cp.getData('text');
      this.insertUnprocessedText(text);
    } catch (e) { /*console.error(e);*/
    }
    // Prevents default
    return false;
  }

  insertUnprocessedText(text: string) {
    let text2 = '';
    let start = 0;
    this.utils.parseEmojiCodes(text, (match, index) => {
      if (index > start) {
        const content = text.substring(start, index);
        text2 += content;
      }
      text2 += this.convertEmojiToImg(match);
      start = index + match.length;
    });
    if (start < text.length) {
      const content = text.substring(start, text.length);
      text2 += content;
    }
    this.insertProcessedText(text2, true);
  }

  addEmoji(e: string) {
    this.insertProcessedText(this.convertEmojiToImg(e), false);
  }

  convertEmojiToImg(emoji: string) {

    return `<img class="emoji" draggable="false" src="${this.utils.imageFilePath(emoji)}" alt="${emoji}">`;
  }

  get isSafari() {

    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  onImgMouseDown(target: any, clientX: number) {
    const rt = (target as HTMLElement).getBoundingClientRect();
    // Checks whatever side of the image the mouse position falls into and emits the event accordingly
    if (rt) {
      const at = clientX < (rt.left + rt.right) / 2 ? 'left' : 'right';
      this.start = this.end = this.offset((target as Node), at === 'right' ? 1 : 0, null);
      // this.start = this.end = this.offsetForImage((target as Node), at === 'right' ? 1 : 0);
      const offset = this.offsetForSelect((target as Node), at === 'right' ? 1 : 0, null);
      this.selection.collapse(...this.range((target as Node).parentNode!.firstChild, offset));

    }
  }


  insertProcessedText(text: any, mustFocus: boolean) {
    const x = this.getSelection(0, this.element!.firstChild!);
    const el = this.mydivRef.nativeElement;
    x.found.reverse().forEach((s) => {
      s = this.mysort(s);
      const x1 = el.innerHTML.slice(0, s.s) + el.innerHTML.slice(s.e);
      el.innerHTML = x1;
      this.end = this.end - (s.e - s.s);
    });
    const val = el.innerHTML;

    if (true) {
      text = (this.sanitized.sanitize(SecurityContext.HTML, this.sanitized.bypassSecurityTrustHtml(text)) ?? '');
      const x = el.innerHTML.slice(0, this.start) + text + el.innerHTML.slice(this.start);
      el.innerHTML = x;
      this.start += text.length;
      this.end = this.start;
      this.store();
      setTimeout(() => {
        const allImg = el.querySelectorAll('img');
        allImg.forEach((img) => {
          img.removeEventListener('mousedown', this.imgMouseDown);
          img.addEventListener('mousedown', this.imgMouseDown);
          img.removeEventListener('touchstart', this.imgTouchStart);
          img.addEventListener('touchstart', this.imgTouchStart);
        });
        if (mustFocus) {
          this.apply(true);
        }
      }, 0);
    } else if (typeof this.selection !== 'undefined' && typeof (this.selection as any).createRange !== 'undefined') {
      alert('unimplemented');
      throw new Error('unimplemented');
    } else {
      el.innerHTML += this.sanitized.sanitize(SecurityContext.HTML, this.sanitized.bypassSecurityTrustHtml(text)) ?? '';

      this.start += text.length;
      this.store();
    }
  }


  /** Computes a Node/offset dom selection pair from an absolute offset */
  private range(firstChild: Node | null, offset: number): [Node, number] {
    if (!this.element) {
      return [this.elref.nativeElement, 0];
    }
    // Starts with the first child node of the input's element
    let node = firstChild ?? this.element.firstChild;
    // Seeks for the relevan node matching the index
    let count = 0;
    while (node) {
      // Gets the node text content, if any
      const text = this.nodeOuter(node);
      // When the offset fits within the node we are done
      if (offset <= text.length) {

        // Case #1: When the matching node is a text node...
        if (node.nodeType === Node.TEXT_NODE) {
          // Returns the text node kind of selection with the content based offset
          return [node, offset];
        }
        if (node instanceof HTMLDivElement) {
          // Returns the text node kind of selection with the content based offset
          return this.range(node.firstChild, offset - 5);
        }
        if (node instanceof HTMLSpanElement) {
          // Returns the text node kind of selection with the content based offset
          return this.range(node.firstChild, offset - 6);
        }
        // Case #2: We must be at the IMG, so, return the element offset instead
        return [node.parentNode!, (count === 0 && offset === 0) ? count : count + 1];
      }
      // Decreses the absolute offset
      offset -= text.length;
      // Counts the number of child nodes otherwise (including comments)
      count++;
      // Goes to the next sibling
      node = node.nextSibling;
    }
    // Case #3: No matches found, return a zero based offset
    return [this.element, 0];
  }

  /** Applies the current selection back to the dom */
  private apply(store: boolean) {

    try {
      // Gets the current document selection first
      const sel = this.selection;
      // Computes the dom node/offset selection pair for the start offset only
      const [node, offset] = this.range(null, this.start);
      // Applies the selection as a collapsed cursor
      sel.collapse(node, offset);
      // Check for the seleciton to be applied correctly...
      if (sel.anchorNode !== node || sel.anchorOffset !== offset) {
        // ...otherwise schedule a second attempt during the next animation frame update to cope with
        // browsers (Safari) requiring the dome to be actually rendered for the selection to work
        animationFrameScheduler.schedule(() => this.apply(store));
      } else {
      }
    } catch (e) { /*console.error(e);*/
    }

    // Returns this for chaining purposes
    return;
  }

  /** Queries the current selection */
  private query() {
    const sel = this.selection;
    try {
      // Gets the current document selection first
      // Computes the start offset from the anchor node
      this.start = this.offset(sel.anchorNode!, sel.anchorOffset, null);
      // Computes the end offset from the focus node
      if (!sel.isCollapsed) {
        const q = 1;
      }
      this.end = sel.isCollapsed ? this.start : this.offset(sel.focusNode!, sel.focusOffset, null);
    } catch (e) {
      this.start = this.end = 0; /*console.error(e);*/
      alert(e);
    }
    if (this.start !== this.end) {
      // alert(`query ${this.start} ${this.end}`);
    }
    // Sorts the edges and returns this for chaining purposes
    this.sort();
    const q = this.getSelection(0, this.element!.firstChild!);
    // this.removeEmptyNodes(q.emptyNodes);
    this.onTextSelectedChanged.emit({isSelected: this.start !== this.end, isInBold: q.isInBold});
  }

  /** Computes the absolute text offset from the Node/offset dom selection pair */
  private offset(node: Node, offset: number, firstChild: Node | null): number {
    if (!this.element) {
      return 0;
    }
    // Short-circuits for invalid nodes
    if (!node) {
      return this.divValue?.length || 0;
    }
    let flag = false;
    // Case #1: The given node is a text node, meaning the dom selection is expressed as the text-node and the relative offset whithin such text. We keep the pair unchanged and move forward.
    if (node === this.mydivRef.nativeElement) {
      // Cases #2: The given node isn't a text node (likely is the host container element), meaning the dom selection is expressed as the containing node while the offseet is the index of the selected element.

      // Ensures the given node has chilldren
      const count = node.childNodes.length;
      if (!count) {
        return 0;
      }
      if (offset === count) {
        flag = true;
      }
      // Gets the selected child node (saturating to the last child) and resets the offset for the furtner calculations
      node = node.childNodes.item(Math.min(offset, count - 1));
      offset = 0;
    }

    // Loops on the nodes composing the rendered output
    let child: Node = firstChild ?? this.element.firstChild!;
    let totalOffset = 0;
    while (child) {
      // Appends the text content depending on the node type

      // When we match the requested node, we are done. The offset is calculated as the accumulated text length.
      if (child === node || child === node.parentNode || child === node.parentNode?.parentNode) {
        if ((child instanceof HTMLImageElement)) {
          if (offset === 1 || flag) {
            return totalOffset + (child as HTMLImageElement).outerHTML.length;
          } else {
            return totalOffset;
          }
        } else if (child instanceof HTMLDivElement) {
          const t = this.offset(node, offset, child.firstChild);
          return totalOffset + t + 5;
        } else if (child instanceof HTMLSpanElement) {
          if (child.firstChild) {
            const t = this.offset(node, offset, child.firstChild);
            return totalOffset + t + (child.outerHTML.length - child.innerHTML.length - 7);
          } else {
            // empty span
            return totalOffset + (child.outerHTML.length - child.innerHTML.length);
          }
        } else {
          return totalOffset + offset;
        }
      }
      if (child instanceof HTMLDivElement) {
        const t = this.offset(node, 0, child.firstChild);
        totalOffset += t + 5 + 6;
      } else if (child instanceof HTMLSpanElement) {
        if (child.firstChild) {
          const t = this.offset(node, 0, child.firstChild);
          totalOffset += t + (child.outerHTML.length - child.innerHTML.length);
        } else {

          totalOffset += (child.outerHTML.length - child.innerHTML.length);
        }
      } else if (child instanceof HTMLBRElement) {
        if (child.parentNode === node) {

        } else {
          const t = this.nodeOuter(child).length;
          totalOffset += t;
        }
      } else {
        const t = this.nodeOuter(child).length;
        totalOffset += t;
      }

      // Skips to the next node
      if (!child.nextSibling) {
        return totalOffset;
      }
      child = child.nextSibling;
    }

    return this.divValue?.length || 0;
  }

  /** Computes the absolute text offset from the Node/offset dom selection pair */
  private getPureText(firstChild: Node | null) {
    // Short-circuits for invalid nodes
    if (!firstChild) {
      return '';
    }

    // Loops on the nodes composing the rendered output
    let child: Node = firstChild;
    let text = '';
    while (child) {

      if (child instanceof HTMLDivElement) {
        if (child.firstChild) {

          const t = this.getPureText(child.firstChild);
          text += ('\n' + t);
        } else {
        }
      } else if (child instanceof HTMLSpanElement) {
        if (child.firstChild) {

          const t = this.getPureText(child.firstChild);
          if (this.hasBoldAttr(child)) {
            text += `<b>${t}</b>`;
          } else {
            text += (t);
          }
        } else {
        }
      } else if (child instanceof HTMLBRElement) {
        text += '\n';

      } else if (child instanceof HTMLImageElement) {

        const t = this.nodeText(child);
        text += t;
      } else {
        const t = this.nodeOuter(child);
        text += t;
      }

      // Skips to the next node
      if (!child.nextSibling) {
        break;
      }
      child = child.nextSibling;
    }

    return text;
  }

  /** Computes the absolute text offset from the Node/offset dom selection pair */
  private offsetForSelect(node: Node, offset: number, firstChild: Node | null): number {
    if (!this.element) {
      return 0;
    }
    // Short-circuits for invalid nodes
    if (!node) {
      return this.divValue?.length || 0;
    }

    // Case #1: The given node is a text node, meaning the dom selection is expressed as the text-node and the relative offset whithin such text. We keep the pair unchanged and move forward.
    if (node === this.mydivRef.nativeElement) {
      // Cases #2: The given node isn't a text node (likely is the host container element), meaning the dom selection is expressed as the containing node while the offseet is the index of the selected element.

      // Ensures the given node has chilldren
      const count = node.childNodes.length;
      if (!count) {
        return 0;
      }
      // Gets the selected child node (saturating to the last child) and resets the offset for the furtner calculations
      node = node.childNodes.item(Math.min(offset, count - 1));
      offset = 0;
    }

    // Loops on the nodes composing the rendered output
    let child: Node = firstChild ?? this.element.firstChild!;
    let totalOffset = 0;
    while (child) {
      // Appends the text content depending on the node type

      // When we match the requested node, we are done. The offset is calculated as the accumulated text length.
      if (child === node || child === node.parentNode || child === node.parentNode?.parentNode) {
        if ((child instanceof HTMLImageElement)) {
          if (offset === 1) {
            return totalOffset + (child as HTMLImageElement).outerHTML.length;
          } else {
            return totalOffset;
          }
        } else if (child instanceof HTMLDivElement) {
          return this.offsetForSelect(node, offset, child.firstChild);
        } else if (child instanceof HTMLSpanElement) {
          if (child.firstChild) {
            return this.offsetForSelect(node, offset, child.firstChild);
          } else {
            return totalOffset + offset;
          }
        } else {
          return totalOffset + offset;
        }
      }
      if (child instanceof HTMLDivElement) {
        totalOffset += this.offsetForSelect(node, 0, child.firstChild) + 5;
      } else if (child instanceof HTMLSpanElement) {
        if (child.firstChild) {
          totalOffset += this.offsetForSelect(node, 0, child.firstChild) + 5;
        }
      } else {
        totalOffset += this.nodeOuter(child).length;
      }

      // Skips to the next node
      if (!child.nextSibling) {
        break;
      }
      child = child.nextSibling;
    }

    return this.divValue?.length || 0;
  }


  /** Returns the text associated with the given node */
  private nodeText(node: Node): string {

    switch (node.nodeType) {

      // The value of the tetxt node
      case Node.TEXT_NODE:
        return node.nodeValue!;
        break;

      // The alt of an image element
      case Node.ELEMENT_NODE:
        switch ((node as Element).tagName) {

          case 'IMG':
            return (node as HTMLImageElement).alt || '';
            break;
        }
    }
    return '';
  }

  /** Returns the text associated with the given node */
  private nodeOuter(node: Node): string {

    switch (node.nodeType) {

      // The value of the tetxt node
      case Node.TEXT_NODE:
        return node.textContent || '';
        break;

      // The alt of an image element
      case Node.ELEMENT_NODE:
        const t = (node as Element).tagName;
        switch (t) {

          case 'IMG':
            return (node as HTMLImageElement).outerHTML || '';
            break;
          case 'DIV':
            return (node as HTMLImageElement).outerHTML || '';
            break;
          case 'SPAN':
            return (node as HTMLSpanElement).outerHTML || '';
            break;
          case 'BR':
            return (node as HTMLImageElement).outerHTML || '';
            break;
        }
    }
    return '';
  }

  /** Sorts the selection edges */
  private sort(): this {

    if (this.start <= this.end) {
      return this;
    }

    const tmp = this.start;
    this.start = this.end;
    this.end = tmp;

    return this;
  }

  /** Undoes the latest changes. It requires enableHistory() to be called */
  private undo(): this {
    // Stops undoing when history is finished
    if (!this.undoable) {
      return this;
    }
    // Saves the present moment to be restored eventually
    if (this.timeIndex === 0) {

    }
    // Gets the latest snapshot from the history
    const snapshot = this.history[++this.timeIndex];
    // Reloads the snapshot's content restoring the selection too
    return this.update(snapshot.value, ...snapshot.selection);
  }

  /** Wait for the current queue of microtaks to be emptied. The async funtion will than be called after the rendering completed */
  private whenDone(async: () => void) {
    this.zone.onStable.pipe(take(1)).subscribe(() => async());
  }

  /** Updates the value of the text and selection  */
  private update(value: string, start: number, end: number): this {
    // Restores the selection
    this.start = start;
    this.end = end;
    // Restores the content
    this.mydivRef.nativeElement.innerHTML = value;
    // Applies the selection back when rendering is done
    if (this.focused) {
      this.whenDone(() => this.apply(false));
    }
    // Returns this for chaining purposes
    return this;
  }

  /** Redoes the last undone modifications. It requires enableHistory() to be called */
  private redo(): this {
    // Stops redoing when back to the present
    if (!this.redoable) {
      return this;
    }
    // Gets the previous snapshot from the history
    const snapshot = this.history[--this.timeIndex];
    // Removes the newest snapshot when back to the present
    if (this.timeIndex === 0) {
      this.history.shift();
    }
    // Reloads the snapshot's content restoring the selection too
    return this.update(snapshot.value, ...snapshot.selection);
  }

  /** Handles keayboard accellerators */
  private keyAccellerators(ev: KeyboardEvent) {

    switch (ev.key) {

      // Ctrl/Cmd Z -> Undo
      case 'z':
      case 'Z':
        // Reverts to Redo whenever shift is pressed on a Mac
        if (ev.shiftKey) {
          return this.redo(), false;
        }
        // Performs thr Undo
        return this.undo(), false;

      // Ctrl/Cmd Y -> Redo
      case 'y':
      case 'Y':
        // Performs the Redo unless its a Mac
        if (!this.mac) {
          return this.redo(), false;
        }
    }
    // Reverts to default
    return true;
  }

  private store(force?: boolean): this {
    this.cacheDivStringValue();
    if (!!force) {
      // Pushes a snapshot into the history buffer unconditionally
      this.history.unshift({value: this.divValue, selection: [this.start, this.end]});
      return this;
    }
    // Pushes the document for conditional history save
    this.store$.next({value: this.divValue, selection: [this.start, this.end]});
    return this;
  }

  /** Initilizes the history buffer */
  private enableHistory(debounce: number = 1000, limit: number = 128): this {
    // Clears the history buffer
    this.clearHistory();
    // Builts up the stream optimizing the amout of snapshot saved in the history
    this.sub$ = this.store$.pipe(
      // Append a time interval between storing emissions
      timeInterval(),
      // Filters requests coming too fast (within 'debounce time')
      filter(payload => this.history.length === 0 || payload.interval > debounce),
      // Gets a snapshot of the value with updated selection
      map(payload => payload.value),
      // Subscribes the history save handler
    ).subscribe(snapshot => {
      // Wipes the further future undoed snapshots since they are now
      if (this.timeIndex > 0) {
        // Save the last snapshot wiping the further future undoed once
        this.history.splice(0, this.timeIndex + 1, snapshot);
        // Resets the time index
        this.timeIndex = 0;
      } else {
        this.history.unshift(snapshot);
      }
      // Removes the oldest snapshot when exceeeding the history limit
      if (this.history.length > limit) {
        this.history.pop();
      }
    });

    return this;
  }

  focus() {
    this.mydivRef.nativeElement.focus();
  }

  onblur1($event: FocusEvent) {
    console.log('onblur');
    this.query();
  }

  onPlaceHolderClick() {
    this.mydivRef?.nativeElement?.focus();
  }

  blur() {
    this.mydivRef.nativeElement.blur();
  }

  onBoldBtn() {

    if (this.start === this.end) {
      return;
    }

    const q = this.getSelection(0, this.element!.firstChild!);
    let text = '';
    const el = this.mydivRef.nativeElement;
    q.found.reverse().forEach((s) => {
      s = this.mysort(s);
      text = el.innerHTML.slice(s.s, s.e) + text;
      const q1 = el.innerHTML.slice(0, s.s) + el.innerHTML.slice(s.e);
      el.innerHTML = q1;
      this.end = this.end - (s.e - s.s);
    });
    if (!q.isInBold) {
      text = `<span class="fw-bold">${text}</span>`;
    } else {
      const q2 = this.getSelection(0, this.element!.firstChild!);
      this.removeEmptyNodes(q2.emptyNodes);
      const q22 = this.getSelection(0, this.element!.firstChild!);

      if (q22.isInBold) {
        text = `</span>${text}<span class="fw-bold">`;
      } else {
        text = `${text}`;
      }

    }
    const x = el.innerHTML.slice(0, this.start) + text + el.innerHTML.slice(this.start);
    el.innerHTML = x;
    this.start += text.length;
    this.end = this.start;
    this.store();
    const q3 = this.getSelection(0, this.element!.firstChild!);
    this.removeEmptyNodes(q3.emptyNodes);

    this.onTextSelectedChanged.emit({isSelected: false, isInBold: q3.isInBold});
  }

  mysort(s: { s: number, e: number }) {
    if (s.s < s.e) {
      return s;
    } else {
      return {s: s.e, e: s.s};
    }
  }

  private getSelection(totalOffsetNow: number, firstChild: Node): {
    total: number,
    isInBold: boolean,
    found: { s: number, e: number }[],
    emptyNodes: { s: number, e: number }[]
  } {
    if (!this.element) {
      return {total: 0, isInBold: false, found: [], emptyNodes: []};
    }
    const found: { s: number, e: number }[] = [];
    const emptyNodes: { s: number, e: number }[] = [];
    // Loops on the nodes composing the rendered output
    let child: Node = firstChild;
    let totalOffset = 0;
    let isInBold = false;
    while (child) {
      if (child instanceof HTMLDivElement) {
        const t = this.getSelection(totalOffset + (child.outerHTML.length - child.innerHTML.length - 6), child.firstChild!);
        found.push(...t.found);
        isInBold = t.isInBold;
        totalOffset += t.total + 5 + 6;
      } else if (child instanceof HTMLSpanElement) {
        if (child.firstChild) {
          const t = this.getSelection(totalOffset + (child.outerHTML.length - child.innerHTML.length - 7), child.firstChild!);

          found.push(...t.found);
          emptyNodes.push(...t.emptyNodes);
          isInBold = t.isInBold;
          totalOffset += t.total + (child.outerHTML.length - child.innerHTML.length);
        } else {
          const t = this.nodeOuter(child).length;
          if (totalOffsetNow + totalOffset + t >= this.start && totalOffsetNow + totalOffset <= this.end) {
            if (this.hasBoldAttr(child)) {
              isInBold = true;
            }
          } else {
          }
          emptyNodes.push({s: totalOffsetNow + totalOffset, e: totalOffsetNow + totalOffset + child.outerHTML.length});
          totalOffset += (child.outerHTML.length - child.innerHTML.length);
        }
      } else if (child instanceof HTMLBRElement) {
        const t = this.nodeText(child).length;
        // if (totalOffsetNow + totalOffset + t >= this.start) {
        //   if (this.hasBoldAttr(child.parentElement)) {
        //     isInBold = true;
        //   }
        //
        //   found.push({s: Math.max(totalOffset + totalOffsetNow, this.start), e: Math.min(totalOffset + totalOffsetNow + t, this.end)});
        // } else {
        // }
        emptyNodes.push({s: totalOffset + totalOffsetNow, e: totalOffset + totalOffsetNow + t});
        totalOffset += t;
      } else {
        const t = this.nodeText(child).length;
        if (totalOffsetNow + totalOffset + t >= this.start && totalOffsetNow + totalOffset <= this.end) {
          if (this.hasBoldAttr(child.parentElement)) {
            isInBold = true;
          }

          found.push({
            s: Math.max(totalOffset + totalOffsetNow, this.start),
            e: Math.min(totalOffset + totalOffsetNow + t, this.end)
          });
        } else {
        }
        totalOffset += t;
      }

      // Skips to the next node
      if (!child.nextSibling) {
        return {total: totalOffset, isInBold: isInBold, found: found, emptyNodes: emptyNodes};
      }
      child = child.nextSibling;
    }

    return {total: this.divValue?.length || 0, isInBold: false, found: [], emptyNodes: []};
  }

  hasBoldAttr(child: HTMLElement | null) {
    if (child?.classList.contains('fw-bold') === true) {
      return true;
    }
    return false;
  }

  private removeEmptyNodes(emptyNodes: { s: number; e: number }[]) {
    const el = this.mydivRef.nativeElement;
    emptyNodes.reverse().forEach((s) => {
      s = this.mysort(s);
      const q1 = el.innerHTML.slice(0, s.s) + el.innerHTML.slice(s.e);
      el.innerHTML = q1;
      if (this.end > s.s) {
        this.end = Math.max(s.s ,this.end - (s.e - s.s));
      }
      if(this.start > s.s){
        this.start = Math.max(s.s ,this.start - (s.e - s.s));
      }
    });
  }

  onMyDivInput() {

    this.query();
    this.store();
  }
}
