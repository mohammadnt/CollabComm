import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import {JwtHelperService} from '@auth0/angular-jwt';
import {Observable} from 'rxjs';
import {StorageService} from './services/storage.service';
import {LoginService} from './services/login.service';
import {getCookie} from './cookie-utils';
import {environment} from '../../environments/environment';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {

  constructor(private jwtHelper: JwtHelperService,
              protected router: Router,
              private storageService: StorageService,
              private loginService: LoginService) {
  }

  check(url: string) {
    const token = getCookie('token');
    if (url.toLowerCase().includes('admin')) {
      const isAdmin = getCookie(environment.adminCookieName);
      if (!isAdmin) {
        this.router.navigate(['']);
        return false;
      }
    }

    if (token && !this.jwtHelper.isTokenExpired(token)) {
      return true;
    }
    if (token.length < 1) {
      const storageToken = this.storageService.getFromLocalStorage('token');
      if (storageToken && !this.jwtHelper.isTokenExpired(storageToken)) {
        return true;
      }
    }
    this.router.navigate(['/auth/login', url]);
    return false;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.check(state.url)
  }
}
