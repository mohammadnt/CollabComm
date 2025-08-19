import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {BaseComponent} from '../core/classes/base-component';
import {ActivatedRoute, Router} from '@angular/router';
import {isNullOrEmpty} from '../core/util';
import {SwPush} from '@angular/service-worker';
import {ImageCompressor} from '../core/services/image-compressor';
import {ToastrService} from 'ngx-toastr';
import {MatDialog} from '@angular/material/dialog';
import {AppManagerService} from '../core/services/app-manager.service';
import {CollabUserInfo, DataResponse} from '../models/UserModels';
import {MatMenuTrigger} from '@angular/material/menu';
import {Subject} from 'rxjs';
import {BasePage} from '../core/classes/base-page';
import {first, takeUntil} from 'rxjs/operators';
import {LoginService} from '../core/services/login.service';
import {StorageService} from '../core/services/storage.service';
import {TitleDialogComponent} from '../module/title-dialog/title-dialog.component';
import {AddToHomeComponent} from '../module/add-to-home/add-to-home.component';
import {BaseResult, ResultStatusCode} from '../models/BaseResult';
import {ConfirmationDialogComponent} from '../module/confirmation-dialog/confirmation-dialog.component';
import {ImageCropperManagerComponent} from '../module/image-cropper-manager/image-cropper-manager.component';
import {MediaType} from '../models/enums';
import {endpoint} from '../core/cookie-utils';
import * as uuid from 'uuid';


@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
  standalone: false
})
export class NavComponent extends BaseComponent implements OnInit, OnDestroy {

  protected readonly isNullOrEmpty = isNullOrEmpty;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private swPush: SwPush,
              private imageCompressor: ImageCompressor,
              private loginService: LoginService,
              private dialog: MatDialog,
              private toaster: ToastrService,
              private storageService: StorageService,
              public appManager: AppManagerService) {
    super();
  }

  showNav = true;
  customNavBarData: any = undefined;
  userData: DataResponse | undefined;

  @ViewChild('rightMenuTrigger') matMenuTrigger!: MatMenuTrigger;
  @ViewChild('porfilePhotoInput') porfilePhotoInputRef: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('profilePhotoSelector') profilePhotoSelectorRef: ElementRef<HTMLDivElement> | undefined;

  protected onDestroy = new Subject<void>();
  isSubscribedToNotifications = false;
  isSafari = false;
  isFirefox = false;

  deferredPrompt: any;

  ngOnDestroy(): void {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

  checkOnRefresh(currentBasePage?: BasePage) {
    if (currentBasePage?.mustShowNavBar?.()) {
      this.showNav = true;
    } else {
      this.showNav = false;
    }
  }

  override ngOnInit(): void {
    this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    this.isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    this.loginService.getLoginStatus().subscribe(s => {
      this.refreshLoginStatus();
    });
    this.appManager.baseCommonPageChangeEvent.pipe(takeUntil(this.onDestroy)).subscribe(s => {
      this.checkOnRefresh(this.appManager.currentBaseCommonPageChanged);
    });
    this.appManager.getMyDataRefreshRequestEmitter()
      .pipe(
        takeUntil(this.onDestroy)
      )
      .subscribe((b: boolean) => {
        this.refreshLoginStatus()
      });
    this.refreshLoginStatus();
    if (!this.isSafari && !this.isFirefox) {
      this.onAlarmIcon(true);
    }

  }

  refreshName() {
    this.appManager.firstName = this.storageService?.getObjectFromLocalStorage('first_name', '') ?? '';
    this.appManager.lastName = this.storageService?.getObjectFromLocalStorage('last_name', '') ?? 'Lastname';

    this.isSubscribedToNotifications = this.storageService?.getObjectFromLocalStorage('subscriptions', false) ?? false;
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      this.storageService?.setObjectInLocalStorage('subscriptions', false);
      this.isSubscribedToNotifications = false;
    }
  }

  refreshLoginStatus() {
    this.refreshName();
    this.getMyData();
  }

  getMyData() {
    if (!this.baseRestService.isLogin) {
      return;
    }
    const userAgent = window.navigator.userAgent;

    let deviceId: string | undefined;
    deviceId = this.storageService?.getFromLocalStorage('device_id') ?? '';
    if (!deviceId || deviceId === '') {
      deviceId = uuid.v4();
      this.storageService?.setInLocalStorage('device_id', deviceId);
    }
    this.baseRestService.getMyData(userAgent, deviceId)
      .pipe(first())
      .subscribe((d: BaseResult<{ is_cache_cleared: boolean, user: CollabUserInfo }>) => {
          if (d.code === ResultStatusCode.Logout) {
            this.logout();
          }
          this.storageService?.setInLocalStorage('first_name', d.data.user.first_name);
          this.storageService?.setInLocalStorage('last_name', d.data.user.last_name);
          this.storageService?.setInLocalStorage('user_id', d.data.user.id);
          this.refreshName();

          this.appManager.setMyData(d.data);
          this.userData = d.data;
          if (this.loginService.isLogin && d.data.is_cache_cleared) {
            location.reload();
          }
        },
        error => {
        });
  }

  logout() {
    this.loginService.logoutCliently();
  }

  getHeaderName() {
    if (!this.appManager.firstName || !this.appManager.lastName || this.appManager.firstName === '' || this.appManager.lastName === '') {
      return '';
    }

    return this.appManager.firstName[0] + '‌' + this.appManager.lastName[0];
  }

  get getIsSubscribedToNotifications() {
    return this.swPush.isEnabled && this.isSubscribedToNotifications;
  }

  onAlarmIcon(fromNgOnInit: boolean = false) {
    try {
      if (!this.baseRestService.isLogin) {
        return;
      }
      if (this.getIsSubscribedToNotifications) {
        if (!fromNgOnInit) {
          this.toaster.mySuccess('Notifications is already subscribed on this device.');
        }
        return;
      }
      if ('Notification' in window) {
        Notification.requestPermission((result) => {
          if (result === 'granted') {
            this.subscribe(fromNgOnInit);
          } else if (result === 'default') {
            this.subscribe(fromNgOnInit);
          } else {
            // if (!fromNgOnInit) {
            // this.showNotificationTitleDialog();
            // }
          }
        }).then((result) => {
          if (result === 'granted') {
          } else if (result === 'default') {
          } else {
            if (!fromNgOnInit) {
              this.showNotificationTitleDialog();
            }
          }
        }).catch((err) => {
          console.log(`Notification.requestPermission: ${err}`);
        });
      } else {
        if (((window as any).navigator as any).standalone) {
          const dialogRef = this.dialog.open(TitleDialogComponent, {
            disableClose: true,
            data: {title: 'Notifications is not supported on your device. You need to update your browser or your OS(especially on iOS).'},
            height: '100vh',
            width: '100vw',
            maxWidth: '100vw',
          });

        } else {
          if (this.isSafari) {
            this.dialog.open(AddToHomeComponent, {
              disableClose: true,
              data: {isForNotification: true},
              height: '100vh',
              width: '100vw',
              maxWidth: '100vw',
            });
          } else {
            // const dialogRef = this.dialog.open(EventRowListComponent, {
            //   disableClose: true,
            //   data: {title: 'Notifications is not supported on your device. You need to update your browser or your OS(especially on iOS).'}
            // });
          }
        }

      }
    } catch (e) {
      console.log(`onAlarmIcon error:`);
      console.log(e);
    }
  }

  showNotificationTitleDialog() {
    const dialogRef = this.dialog.open(TitleDialogComponent, {
      disableClose: true,
      data: {title: 'Notifications is denied on this device. You must change it manually from browser\'s setting.'},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
  }

  subscribe(fromNgOnInit: boolean) {
    this.baseRestService.getPublicKey().pipe(first())
      .subscribe((d: BaseResult<string>) => {
          this.subscribeFirstStep(d.data, fromNgOnInit);
        },
        error => {
        });
  }

  subscribeFirstStep(publicKey: string, fromNgOnInit: boolean) {
    try {
      this.swPush.requestSubscription({
        serverPublicKey: publicKey
      }).then((subscription: any) => {
        console.log('after requestSubscription');
        this.subscribeSecondStep(subscription);
      }).catch((error: any) => {
        console.error(error);
        if (!fromNgOnInit) {
          alert(error);
        }
      });
    } catch (err) {
      alert('Could not subscribe due to: ' + err);
      console.error('Could not subscribe due to:', err);
    }
  }

  subscribeSecondStep(subscription: any) {
    this.baseRestService.addPushSubscriptions(subscription).pipe(first())
      .subscribe((d: BaseResult<boolean>) => {
          console.log('add subscription: ' + d.data);
          if (d.data) {
            this.toaster.mySuccess('Notifications subscribed successfully.');
            this.storageService?.setObjectInLocalStorage('subscriptions', true);
            this.isSubscribedToNotifications = true;
          } else {
            this.toaster.myError('Unknown error in Add Push Subscriptions');
          }
        },
        error => {
        });
  }

  getFirstName() {
    if (!this.appManager.firstName) {
      return '';
    }
    if (this.appManager.firstName.length > 20) {
      return this.appManager.firstName.substring(0, 20);
    }
    return this.appManager.firstName;
  }

  OnProfilePic() {
    if (!this.baseRestService.isLogin) {
      this.router.navigate(['/auth/login']);
    }

  }

  onLogin() {
    if (!this.baseRestService.isLogin) {
      this.router.navigate(['/auth/login']);
    }

  }

  deleteProfilePhoto(e: Event) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      disableClose: false,
      data: {title: 'Are you sure?'},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {

        this.baseRestService.setProfilePhoto(null).subscribe((d2: BaseResult<boolean>) => {
          this.toaster.mySuccess('Successfully deleted.');
          this.refreshLoginStatus();
        }, error => {

        });
      }
    });

    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  setProfilePhoto(e: Event) {
    this.porfilePhotoInputRef?.nativeElement.click();
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  handlePicSelected(event: any) {
    let fileName: any;
    const file = event.target.files[0];

    fileName = file.name;
    const viewer = this.dialog.open(ImageCropperManagerComponent, {
      data: {
        imageFile: file, aspectRatio: 1

      },
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
    viewer.afterClosed().subscribe(async (result: any) => {
      if (result && viewer.componentInstance.croppedImage) {

        const {
          imageFile,
          uri,
          width,
          height
        } = await this.imageCompressor.compressFileAsync(viewer.componentInstance.croppedImage, fileName, 50, 60, 360, 360,
          false);
        this.baseRestService.addPublicUserMedia([imageFile], MediaType.image)
          .subscribe((d: BaseResult<string>) => {
            this.baseRestService.setProfilePhoto(d.data).subscribe((d2: BaseResult<boolean>) => {
              this.toaster.mySuccess('Successfully uploaded.');
              this.refreshLoginStatus();
            }, error => {

            });
          }, error => {

          });

      }
    });


  }


  getPhotoSrc() {
    return `${endpoint()}media/publicusermedia/${this.userData?.user?.media_id}`;
  }


  addToHomeScreen() {
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice
      .then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.deferredPrompt = null;
      });
  }

}
