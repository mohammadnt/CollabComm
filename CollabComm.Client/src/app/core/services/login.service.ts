import {Injectable, OnDestroy} from "@angular/core";
import {Observable, Subject, throwError} from "rxjs";
import {catchError, first} from "rxjs/operators";
import {StorageService} from "./storage.service";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {environment} from '../../../environments/environment';
import {deleteAllCookies, deleteCookie, endpoint, getCookie} from '../cookie-utils';
import {BaseResult} from '../../models/BaseResult';


@Injectable({
  providedIn: 'root'
})
export class LoginService implements OnDestroy {
  isLogin = false;
  isAdmin = false;

  private loginChanged = new Subject<any>();
  public logoutMaked = new Subject<any>();

  protected onDestroy = new Subject<void>();

  constructor(private http: HttpClient,
              private storageService: StorageService,) {
    this.checkIsLogin();
  }

  public onVerifyOk() {
    this.isLogin = true;
    if (getCookie(environment.adminCookieName)) {
      this.isAdmin = true;
    }

  }

  public notifyChanged() {
    this.loginChanged.next(true);
  }

  getLoginStatus(): Observable<boolean> {
    return this.loginChanged.asObservable();
  }


  checkIsLogin() {
    const token = getCookie('token');
    this.isLogin = !!token;
    if (token.length < 1) {
      const storageToken = this.storageService.getFromLocalStorage('token');
      this.isLogin = !!storageToken;
    }
    // console.log(!!token);
    if (getCookie(environment.adminCookieName)) {
      this.isAdmin = true;
    }
  }

  logoutCliently() {

    this.logoutMaked.next(true);
    this.storageService?.setInLocalStorage('first_name', '');
    this.storageService?.setInLocalStorage('last_name', '');
    this.storageService?.setInLocalStorage('user_id', '');
    this.storageService?.setInLocalStorage('token', '');
    if (this.isLogin) {
      this.logout()
        .pipe(first())
        .subscribe((d: boolean) => {
          },
          error => {
          });

    }


    deleteAllCookies();
    deleteCookie('token');
    deleteCookie(environment.adminCookieName);
    this.isLogin = false;
    this.isAdmin = false;
    window.location.href = '';
  }

  logout(): Observable<any> {
    return this.http.post<BaseResult<any>>(`${endpoint()}resource/logout`, null).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.handleError(err);
      })
    );
  }

  handleError(error: HttpErrorResponse): Observable<any> {
    if (error.status === 401) {
      console.log('got 401');
      this.logoutCliently();
    }
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
    } else if (error.status === 429) {
      return throwError(
        'Too many request. Please wait a few seconds');
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`);
    }
    return throwError(
      'Something bad happened; please try again later.');
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }
}
