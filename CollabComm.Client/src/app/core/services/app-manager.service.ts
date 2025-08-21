import {EventEmitter, Injectable} from '@angular/core';
import {Subject} from "rxjs";
import {DataResponse} from '../../models/UserModels';
import {BasePage} from '../classes/base-page';

@Injectable({
  providedIn: 'root'
})
export class AppManagerService {
  private userData: DataResponse | undefined;
  private myDataEventEmitter = new EventEmitter<DataResponse>();
  private myDataRefreshRequestEmitter = new EventEmitter<boolean>();
  public baseCommonPageChangeEvent = new Subject<BasePage | undefined>();
  public currentBaseCommonPageChanged: BasePage | undefined;
  public firstName = '';
  public lastName = '';


  constructor() {

  }


  setMyData(data: DataResponse) {
    this.userData = data;
    this.myDataEventEmitter.emit(data);
  }

  getMyData() {

    return this.userData;
  }

  getMyDataEventEmitter() {

    return this.myDataEventEmitter;
  }

  requestForMyDataRefresh() {
    this.myDataRefreshRequestEmitter.emit(true)
  }

  getMyDataRefreshRequestEmitter() {
    return this.myDataRefreshRequestEmitter;
  }

  setBasePage(page: BasePage | undefined) {
    this.currentBaseCommonPageChanged = page;
    this.baseCommonPageChangeEvent.next(page);

  }
}
