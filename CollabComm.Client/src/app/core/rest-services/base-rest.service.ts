import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import * as uuid from 'uuid';
import {LoginService} from '../services/login.service';
import {BaseResult} from '../../models/BaseResult';
import {endpoint} from '../cookie-utils';

@Injectable({
  providedIn: 'root'
})
export class BaseRestService {

  get isLogin() {
    return this.loginService.isLogin;
  }

  get isAdmin() {
    return this.loginService.isAdmin;
  }

  constructor(private http: HttpClient,
              private loginService: LoginService) {

  }

  addContact(username: string, title: string): Observable<any> {
    const model = {title: username,second_title: title};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/AddContact`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.loginService.handleError(err);
      })
    );
  }
  contacts(): Observable<any> {
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/Contacts`, null).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.loginService.handleError(err);
      })
    );
  }

  getMyData(userAgent: string, deviceId: string | undefined): Observable<any> {
    const model = {user_agent: userAgent, device_id: deviceId, is_from_web: true};
    return this.http.post<BaseResult<any>>(`${endpoint()}user/MyData`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  login(username: string, password: string, userAgent: string, deviceId: string | undefined): Observable<any> {
    const model = {
      username,
      password,
      user_agent: userAgent,
      device_id: deviceId,
      client_type: 1
    };
    return this.http.post<BaseResult<any>>(`${endpoint()}Auth/Login`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.loginService.handleError(err);
      })
    );
  }

  register(username: string, password: string, first_name: string, last_name: string, userAgent: string, deviceId: string | undefined): Observable<any> {
    const model = {
      username,
      password,
      first_name,
      last_name,
      user_agent: userAgent,
      device_id: deviceId,
      client_type: 1
    };
    return this.http.post<BaseResult<any>>(`${endpoint()}Auth/Register`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.loginService.handleError(err);
      })
    );
  }

  addPublicUserMedia(files: File[], type: number): Observable<any> {
    const formData: FormData = new FormData();
    if (files?.length > 0) {
      for (const file of files) {
        formData.append('files', file, `${uuid.v4()}.${file.name.split('.').pop()}`);
      }
    }
    const model = {type};
    formData.append('model', JSON.stringify(model));
    return this.http.post<BaseResult<any>>(`${endpoint()}media/AddPublicUserMedia`, formData).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.loginService.handleError(err);
      })
    );
  }

  addPushSubscriptions(subscription: any): Observable<any> {
    return this.http.post<BaseResult<any>>(`${endpoint()}PushSubscriptions/Add`, subscription).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  getPublicKey(): Observable<any> {
    return this.http.post<BaseResult<any>>(`${endpoint()}PushSubscriptions/PublicKey`, null).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  addChatMedia(file: File, userId: string | null, type: number, fileName: string): Observable<any> {
    const headers = new HttpHeaders({
      'ngsw-bypass': 'true'
    });
    const formData: FormData = new FormData();
    formData.append('file', file, fileName);
    const model = {type, user_id: userId};
    formData.append('model', JSON.stringify(model));
    return this.http.post(`${endpoint()}Chat/AddChatMedia`, formData, {
      headers,
      reportProgress: true,
      observe: 'events',
    }).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  addThumbnailChatMedia(file: File, userId: string | null, type: number, fileName: string): Observable<any> {
    const headers = new HttpHeaders({
      'ngsw-bypass': 'true'
    });
    const formData: FormData = new FormData();
    formData.append('file', file, fileName);
    const model = {type, user_id: userId};
    formData.append('model', JSON.stringify(model));
    return this.http.post(`${endpoint()}Chat/AddThumbnailChatMedia`, formData, {
      headers,
      reportProgress: true,
      observe: 'events',
    }).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  deleteMessage(id: string | undefined, title: string): Observable<any> {
    const model = {id, title};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/DeleteMessage`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  setProfilePhoto(id: string | null): Observable<any> {
    const model = {id};
    return this.http.post<BaseResult<any>>(`${endpoint()}User/SetProfilePhoto`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  groupMembers(id: string | null): Observable<any> {
    const model = {id};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/GroupMembers`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  commonGroups(id: string | null): Observable<any> {
    const model = {id};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/CommonGroups`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  downloadFileChat(mediaId: string | undefined, isGroup: boolean): Observable<any> {
    const headers = new HttpHeaders({
      'ngsw-bypass': 'true'
    });
    return this.http.get(`${endpoint()}Chat/ChatMedia/${mediaId}?is_group=${isGroup}`, {
      headers,
      reportProgress: true,
      observe: 'events',
      responseType: 'arraybuffer'
    });
  }

  GetConversations() {
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/Conversations`, null).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  ConversationWithUser(userId: string | null) {
    const model = {id: userId};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/ConversationWithUser`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  GetUsers(userIds: (string | undefined)[]) {
    const model = {user_ids: userIds};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/Users`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  MessagesByIds(ids: string[]) {
    const model = {ids};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/MessagesByIds`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  MessagesByCounter(userId: string | null, counter: number | undefined, isPrevious: boolean) {
    const model = {user_id: userId, counter, is_previous: isPrevious};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/MessagesByCounter`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  MessagesByReplyId(userId: string | null, replyId: string | undefined) {
    const model = {user_id: userId, reply_id: replyId};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/MessagesByReplyId`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  Seen(userId: string | null, counter: number | undefined, id: string | undefined) {
    const model = {user_id: userId, counter, id};
    return this.http.post<BaseResult<any>>(`${endpoint()}Chat/Seen`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  handleError(error: HttpErrorResponse): Observable<any> {
    return this.loginService.handleError(error);
  }
}
