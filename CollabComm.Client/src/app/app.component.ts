import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {BaseComponent} from "./core/classes/base-component";
import {BasePage} from "./core/classes/base-page";
import {MatRipple} from "@angular/material/core";
import {UpdateService} from './core/services/update.service';
import {AppManagerService} from './core/services/app-manager.service';
import {environment} from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent extends BaseComponent implements OnInit, OnDestroy {
  title = 'app';
  protected onDestroy = new Subject<void>();

  constructor(private sw: UpdateService,
              private cdr: ChangeDetectorRef,
              private appManager: AppManagerService) {
    super();

    // this.sw.checkForUpdates();
  }

  checkTargetForRipple(target: HTMLElement, k: number): boolean {
    if (target.onclick) {
      return true;
    }
    if (target.classList.contains('my-btn') || target.classList.contains('cursor-pointer') ||
      target.classList.contains('btn') || target.tagName === 'button') {
      return true;
    } else {
      if (k === 3) {
        return false;
      }
      if (target.parentElement) {
        return this.checkTargetForRipple(target.parentElement, k + 1);
      }
    }
    return false;
  }

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  override ngOnInit(): void {
  }

  isLogin(): boolean {
    return this.baseRestService.isLogin;
  }

  ondblclick($event: MouseEvent) {
    $event.preventDefault();
  }

  onRouterOutletActivate(e: any) {
    const page = e as BasePage | undefined;
    this.appManager.setBasePage(page);

  }
}
