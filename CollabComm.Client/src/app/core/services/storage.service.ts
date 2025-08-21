import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class StorageService {
  setInLocalStorage(name: string, value: string) {
    localStorage.setItem(name, value);
  }

  removeFromLocalStorage(name: string) {
    localStorage.removeItem(name);
  }

  setObjectInLocalStorage(name: string, value: any) {
    this.setInLocalStorage(name, JSON.stringify(value));
  }

  getFromLocalStorage(name: string): string | null {
    return localStorage.getItem(name);
  }

  getObjectFromLocalStorage<T>(name: string, defaultValue: T): T {
    const cookie = localStorage.getItem(name);
    return cookie ? JSON.parse(cookie) : defaultValue;
  }

  getArrayFromLocalStorage(name: string): any[] {
    return JSON.parse(localStorage.getItem(name) ?? '[]');
  }
}
