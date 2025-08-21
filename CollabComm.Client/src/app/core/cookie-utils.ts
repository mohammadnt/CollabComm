import {environment} from '../../environments/environment';

export function endpoint() {
  return isNotOnDotnet() ? `${environment.debugSiteUrl}${environment.endpoint}` : environment.endpoint;
}

export function fullEndPoint() {
  return `${environment.fullSiteUrl}${environment.endpoint}`;
}

export function setCookie(name: string, val: string) {
  const date = new Date();
  const value = val;

  // Set it expire in 60 days
  date.setTime(date.getTime() + (3 * 12 * 30 * 24 * 60 * 60 * 1000));

  // Set it
  document.cookie = name + '=' + value + '; expires=' + date.toUTCString() + '; path=/';
}

export function isNotOnDotnet() {
  return window.location.port === '4200';
}

export function getCookie(name: string): string {
  const value = '; ' + document.cookie;
  const parts = value.split('; ' + name + '=');

  if (parts.length === 2) {
    return <string> (parts.pop()?.split(';')?.shift());
  }
  return '';
}

export function deleteCookie(name: string) {
  const date = new Date();

  // Set it expire in -1 days
  date.setTime(date.getTime() + (-1 * 24 * 60 * 60 * 1000));

  // Set it
  document.cookie = name + '=; expires=' + date.toUTCString() + '; path=/';
}

export function deleteAllCookies() {
  const cookies = document.cookie.split('; ');
  for (let c = 0; c < cookies.length; c++) {
    const d = window.location.hostname.split('.');
    while (d.length > 0) {
      const cookieBase = encodeURIComponent(cookies[c].split(';')[0].split('=')[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
      const p = location.pathname.split('/');
      document.cookie = cookieBase + '/';
      while (p.length > 0) {
        document.cookie = cookieBase + p.join('/');
        p.pop();
      }
      d.shift();
    }
  }
}
