import {Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {Dictionary} from '../../models/UtilModels';
import {StorageService} from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ChatManagerService {
  public isGroupChatOnly = true;
  public conversationScrollTopValue: number | undefined;
  public chatScrollTopValues: Dictionary<number | undefined> = {};
  public totalBadge = 0;
  private totalBadgeStatus = new Subject<number>();

  constructor(private storageService: StorageService) {
    this.totalBadge = storageService.getObjectFromLocalStorage('total_badge', 0);
  }

  setChatScrollTopValue(userId: string, v: number | undefined) {
    this.chatScrollTopValues[userId] = v;
  }

  getChatScrollTopValue(userId: string) {
    return this.chatScrollTopValues[userId];
  }

  setTotalBadge(k: number) {
    this.storageService.setObjectInLocalStorage('total_badge', k);
    this.totalBadge = k;
    this.totalBadgeStatus.next(k);
    if (('Notification' in window)) {
      Notification.requestPermission().then((result) => {
        (navigator as any).setAppBadge(k);
      });
    } else {
      // The API is not supported, don't use it.
    }
  }

  gettotalBadgeStatus(): Observable<number> {
    return this.totalBadgeStatus.asObservable();
  }
}
