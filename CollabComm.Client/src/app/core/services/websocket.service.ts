import {Injectable, OnDestroy} from '@angular/core';
import {Observable, Observer, Subject} from 'rxjs';
import {environment} from '../../../environments/environment';
import {getCookie, isNotOnDotnet} from '../cookie-utils';
import {WebsocketModel} from '../../models/SocketModels';
import {StorageService} from './storage.service';
import {LoginService} from './login.service';
import {MethodCode} from '../../models/enums';

const CHAT_URL = `${isNotOnDotnet() ? environment.websocketDebugUrl : environment.websocketUrl}`;


@Injectable({
  providedIn: 'root'
})
export class WebsocketService implements OnDestroy {
  public messages: Subject<WebsocketModel> = new Subject<WebsocketModel>();
  ws: WebSocket | undefined;

  private webSocketStateStatus = new Subject<any>();

  constructor(private storageService: StorageService,private loginService: LoginService) {
    loginService.logoutMaked.subscribe(() => {
      this.close();
    })
    let authQueryParam = '';
    const cookie = getCookie('token');
    if(cookie.length < 1) {
      const storageToken = this.storageService.getFromLocalStorage('token');
      if (!!storageToken) {
        authQueryParam = `?Authorization=${window.location.hostname} ${storageToken}`;
      } else if (isNotOnDotnet()) {
        authQueryParam = `?Authorization=${window.location.hostname} ${cookie}`;
      }
    }
    this.connect(CHAT_URL + authQueryParam);

  }

  getWebSocketState(): Observable<boolean> {
    return this.webSocketStateStatus.asObservable();
  }

  ngOnDestroy(): void {
    this.ws?.close();
  }

  public connect(url: string) {
    // if (!this.subject) {
    this.create(url);


  }

  heartbeat(ws: WebSocket) {
    if (!ws) {
      return;
    }
    if (ws.readyState !== 1) {
      return;
    }
    const message = {method: MethodCode.ping, data: 'some ping', identifier: ''};
    this.sendMessage(JSON.stringify(message));
    setTimeout(() => {
      this.heartbeat(ws);
    }, 20000);
  }

  public sendMessage(data: string) {
    if (this.ws) {
      this.ws.send(data);
    }
  }

  private create(url: string) {
    try {
      const ws = new WebSocket(url);
      setTimeout(() => {
        this.heartbeat(ws);
      }, 20000);
      const observable = new Observable((obs: Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
      });
      ws.onclose = (s) => {
        this.webSocketStateStatus.next(false);
        setTimeout(() => {
          this.connect(CHAT_URL);
        }, 5000);
      };
      ws.onopen = (s) => {
        this.webSocketStateStatus.next(true);
      };
      ws.onerror = (s) => {
        console.log(s);
      };
      ws.onmessage = (s) => {

        const data = JSON.parse(s.data);
        this.messages.next(data);
      };
      this.ws = ws;
    } catch (e) {
    }
  }

  close() {
    this.ws?.close();
  }

  getCurrentState() {
    return this.ws?.OPEN === 1;
  }
}
