import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {getCookie, isNotOnDotnet,} from './cookie-utils';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {StorageService} from './services/storage.service';

@Injectable({providedIn: 'root'})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private storageService: StorageService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      withCredentials: true
    });
    const cookie = getCookie('token');
    if (isNotOnDotnet() && cookie.length > 0) {
      request = request.clone({
        headers: request.headers.set('Authorization', `${window.location.hostname} ${cookie}`),
      });
    }
    if (cookie.length < 1) {
      const storageToken = this.storageService.getFromLocalStorage('token');
      if (storageToken) {
        request = request.clone({
          headers: request.headers.set('Authorization', `${window.location.hostname} ${storageToken}`),
        });
      }
    }
    if (!isNotOnDotnet()) {
      request = request.clone({
        headers: request.headers.set('Cross-Origin-Embedder-Policy', `require-corp`),
      });
      request = request.clone({
        headers: request.headers.set('Cross-Origin-Opener-Policy', `same-site`),
      });
    }
    return next.handle(request);
  }
}
