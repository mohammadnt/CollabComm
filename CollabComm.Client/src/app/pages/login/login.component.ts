import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {BasePage} from '../../core/classes/base-page';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {LoginService} from '../../core/services/login.service';
import {ToastrService} from 'ngx-toastr';
import {first} from 'rxjs/operators';
import {BaseResult, ResultStatusCode} from '../../models/BaseResult';
import {getCookie, isNotOnDotnet, setCookie} from '../../core/cookie-utils';
import {CollabUserInfo} from '../../models/UserModels';
import {StorageService} from '../../core/services/storage.service';
import {Md5} from 'ts-md5';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent extends BasePage implements OnInit, AfterViewInit, OnDestroy {

  loginForm!: UntypedFormGroup;
  registerForm!: UntypedFormGroup;
  isRegister = false;
  submitClick = false;
  submitted = false;
  returnUrl = '';
  resendTimeString = '';
  resendTimer = 0;
  countTimerUUID = '';
  ac: AbortController | undefined;
  registerError: string | undefined = undefined;
  loginError: string | undefined = undefined;

  constructor(private router: Router,
              private storageService: StorageService,
              private formBuilder: UntypedFormBuilder,
              private route: ActivatedRoute,
              private loginService: LoginService,
              private toaster: ToastrService) {
    super();
  }

  override mustShowNavBar(): boolean {
    return false;
  }


  ngOnDestroy() {
  }


  ngAfterViewInit() {
    if ((window.navigator as any).standalone) {
      // fullscreen mode

    } else {
      const ua = window.navigator.userAgent;
      const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
      const webkit = !!ua.match(/WebKit/i);
      const iOSSafari = iOS && webkit && !ua.match(/CriOS/i);
      if (iOSSafari) {
        // this.openModal();
      }
    }
  }

  override ngOnInit(): void {

    super.ngOnInit();

    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required]
    });
    try {

      const {id} = this.route.snapshot.params;
      if (id) {
        this.returnUrl = decodeURI(id);
      }
      if (this.loginService.isLogin) {
        this.router.navigate([this.returnUrl], {replaceUrl: true});
      }

    } catch (err) {
      alert('Could not subscribe due to: ' + err);
    }
  }

  get loginFormData() {
    return this.loginForm.controls;
  }

  get registerFormData() {
    return this.registerForm.controls;
  }

  onSwitchToLogin() {
    this.loginError = undefined;
    this.isRegister = false;
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.loginError = undefined;
    this.registerError = undefined;
    this.submitClick = false;
    this.submitted = false;
  }

  onSwitchToRegister() {
    this.registerError = undefined;
    this.isRegister = true;
    this.registerForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required]
    });
    this.loginError = undefined;
    this.registerError = undefined;
    this.submitClick = false;
    this.submitted = false;
  }

  onLogin() {
    this.loginError = '';
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    this.submitClick = true;
    const username = this.loginFormData['username']?.value.trim() as string;
    const password = Md5.hashStr(this.loginFormData['password']?.value.trim() as string);
    const userAgent = window.navigator.userAgent;
    let deviceId: string | undefined;
    this.baseRestService.login(username, password, userAgent, deviceId)
      .pipe(first())
      .subscribe((d: BaseResult<{ token: string, user: CollabUserInfo }>) => {
          if (d.code === ResultStatusCode.WrongArgument) {
            this.loginError = 'Username or password is invalid.';
            this.submitClick = false;
            return;
          }
          if (isNotOnDotnet()) {
            setCookie('token', d.data.token);
          }
          const token = getCookie('token')
          if (token.length === 0) {
            this.storageService?.setInLocalStorage('token', d.data.token)
          }

          this.loginService.checkIsLogin();
          this.storageService?.setInLocalStorage('first_name', d.data.user.first_name);
          this.storageService?.setInLocalStorage('last_name', d.data.user.last_name);
          this.storageService?.setInLocalStorage('user_id', d.data.user.id);

          this.loginService.notifyChanged();
          this.router.navigateByUrl(this.returnUrl);
        },
        error => {
          this.loginError = error;
          this.submitClick = false;
        });
  }

  onRegister() {
    this.registerError = '';
    this.submitted = true;
    if (this.registerForm.invalid) {
      return;
    }
    this.submitClick = true;
    const username = this.registerFormData['username']?.value.trim() as string;
    const password = Md5.hashStr(this.registerFormData['password']?.value.trim() as string);
    const first_name = this.registerFormData['first_name']?.value.trim() as string;
    const last_name = this.registerFormData['last_name']?.value.trim() as string;

    const userAgent = window.navigator.userAgent;
    let deviceId: string | undefined;
    this.baseRestService.register(username, password, first_name, last_name, userAgent, deviceId)
      .pipe(first())
      .subscribe((d: BaseResult<{ token: string, user: CollabUserInfo }>) => {

          if (d.code === ResultStatusCode.WrongArgument) {
            this.registerError = 'Username already exists.';
            this.submitClick = false;
            return;
          }
          if (isNotOnDotnet()) {
            setCookie('token', d.data.token);
          }
          const token = getCookie('token')
          if (token.length === 0) {
            this.storageService?.setInLocalStorage('token', d.data.token)
          }

          this.loginService.checkIsLogin();
          this.storageService?.setInLocalStorage('first_name', d.data.user.first_name);
          this.storageService?.setInLocalStorage('last_name', d.data.user.last_name);
          this.storageService?.setInLocalStorage('user_id', d.data.user.id);

          this.loginService.notifyChanged();
          this.router.navigateByUrl(this.returnUrl);
        },
        error => {
          this.registerError = error;
          this.submitClick = false;
        });
  }

  countTimer(currentUUID: string) {
    if (currentUUID !== this.countTimerUUID) {
      return;
    }
    this.resendTimer--;
    const sec = Math.floor(this.resendTimer % 60);
    const min = Math.floor(this.resendTimer / 60);
    this.resendTimeString = `${min}:${sec.twoDigit()}`;
    if (this.resendTimer === 0) {
      this.countTimerUUID = '';
      return;
    }
    setTimeout(() => {
      this.countTimer(currentUUID);
    }, 1000);
  }

}
