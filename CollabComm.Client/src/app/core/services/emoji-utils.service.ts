import {Injectable, InjectionToken, Inject, Optional} from '@angular/core';
import {EmojiNative, EmojiRegex} from '../helper/emoji-utils';

/** Emoji Rendering Mode */
export type EmojiMode = 'auto' | 'native' | 'web';

export interface EmojiConfig {

  emojiPath?: string; // assets/...
  emojiExt?: string; // .png, .svg, ...
  emojiMode?: EmojiMode; // 'auto'
}

export const EmojiConfigToken = new InjectionToken<EmojiConfig>('wizdm-emoji-config');

@Injectable({ providedIn: 'root' })
export class EmojiUtils {

  private readonly filePath?: string;
  private readonly fileExt?: string;

  constructor(@Inject(EmojiNative) readonly native: boolean,
              @Inject(EmojiRegex) readonly regex: RegExp,
              @Optional() @Inject(EmojiConfigToken) private config: EmojiConfig) {

    // Grabs the source path and the image extension from the configuration object
      this.filePath = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@14.0.0/img/apple/64/';
      this.fileExt = '.png';
  }

  private assessPath(path: string | undefined): string {
    return path ? (path.endsWith('/') ? path : (path + '/')) : '';
  }

  private assessExt(ext: string | undefined): string {
    return ext ? (ext.startsWith('.') ? ext : ('.' + ext)) : '';
  }

  /** Returns the most suitable emoji mode based on the request */
  public emojiMode(mode?: EmojiMode): Exclude<EmojiMode, 'auto'> {

    switch (mode || (this.config?.emojiMode) || 'auto') {

      case 'native':
        return 'native';

      case 'web':
        return 'web';
    }

    return this.native ? 'native' : 'web';
  }

  /** Computes the full path to load the image corersponding to the given emoji */
  public imageFilePath(emoji: string): string {

    if (!emoji) {
      return '';
    }

    const pts: (string | undefined)[] = [];

    for (const cp of emoji) {
      pts.push(cp.codePointAt(0)?.toString(16));
    }

    return this.filePath + pts.join('-') + this.fileExt;
  }

  public isEmoji(source: string): boolean {
    return this.regex.test(source);
  }

  public matchEmojiCodes(source: string): RegExpExecArray | null {
    this.regex.lastIndex = 0;
    return this.regex.exec(source);
  }

  /** Parses the source text searching for emoji unicode sequences */
  public parseEmojiCodes(source: string, callbackfn: (match: string, index: number) => void) {

    if (typeof callbackfn !== 'function') {
      throw new Error('Callback must be a funciton');
    }

    // Resets the starting position
    this.regex.lastIndex = 0;

    // Loop on RegExp matches
    let match;
    while (true) {
      match = this.regex.exec(source);
      if (!match) {
        break;
      }
      callbackfn(match[0], match.index);
    }
  }
}
