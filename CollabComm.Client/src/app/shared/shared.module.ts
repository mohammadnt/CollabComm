import {CUSTOM_ELEMENTS_SCHEMA, forwardRef, Injector, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ServiceWorkerModule} from '@angular/service-worker';
import {AlertDialogComponent} from './alert-dialog/alert-dialog.component';
import {TitleDialogComponent} from '../module/title-dialog/title-dialog.component';
import {LoadingDialogComponent} from '../module/loading-dialog/loading-dialog.component';
import {ImageViewerComponent} from '../module/image-viewer/image-viewer.component';
import {ImageCropperManagerComponent} from '../module/image-cropper-manager/image-cropper-manager.component';
import {ConfirmationDialogComponent} from '../module/confirmation-dialog/confirmation-dialog.component';
import {AudioComponentComponent} from '../module/audio-component/audio-component.component';
import {BaseComponent} from '../core/classes/base-component';
import {BasePage} from '../core/classes/base-page';
import {AddToHomeComponent} from '../module/add-to-home/add-to-home.component';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetRef} from '@angular/material/bottom-sheet';
import {environment} from '../../environments/environment';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DirectionPipe} from '../core/pipe/direction.pipe';
import {SecurePipe} from '../core/pipe/secure.pipe';
import {ImageCropperComponent} from 'ngx-image-cropper';
import {NgCircleProgressModule} from 'ng-circle-progress';
import {RoundProgressModule} from 'angular-svg-round-progressbar';
import {MatRippleModule} from '@angular/material/core';
import {PinchZoomModule} from '../../ngx-pinch-zoom/src/lib/pinch-zoom.module';
import {DirectionByRtlPipe} from '../core/pipe/direction-by-rtl.pipe';
import {OutsideClickDirective} from '../core/directive/outside-click-directive';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';
import {PickerModule} from '../../custom-emoji-picker/src/lib/picker/picker.module';
import {ToastrModule} from 'ngx-toastr';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@NgModule({
  imports: [
    MatProgressSpinnerModule,
    ToastrModule.forRoot(),
    ReactiveFormsModule,
    OutsideClickDirective,
    PickerModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    ImageCropperComponent,
    CommonModule,
    RoundProgressModule,
    FormsModule,
    PinchZoomModule,
    MatRippleModule,
    NgCircleProgressModule.forRoot({}),
    FontAwesomeModule,

    ServiceWorkerModule.register('./custom-worker.js', {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    DirectionPipe,
    SecurePipe,
    DirectionByRtlPipe,

  ],
  exports: [
    MatProgressSpinnerModule,
    OutsideClickDirective,
    FontAwesomeModule,
    ReactiveFormsModule,
    PickerModule,
    MatRippleModule,
    ImageCropperComponent,
    NgCircleProgressModule,
    RoundProgressModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    AddToHomeComponent,
    BaseComponent,
    BasePage,
    AudioComponentComponent,
    ConfirmationDialogComponent,
    ImageCropperManagerComponent,
    ImageViewerComponent,
    LoadingDialogComponent,
    TitleDialogComponent,
    AlertDialogComponent,
    FormsModule,
    PinchZoomModule,
  ],
  declarations: [

    AddToHomeComponent,
    BaseComponent,
    BasePage,
    AudioComponentComponent,
    ConfirmationDialogComponent,
    ImageCropperManagerComponent,
    ImageViewerComponent,
    LoadingDialogComponent,
    TitleDialogComponent,
    AlertDialogComponent,
  ],
  providers: [
    {provide: MatBottomSheet},
    {provide: MatBottomSheetRef, useValue: {}},
    {provide: MAT_BOTTOM_SHEET_DATA, useValue: {}},
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ],
})
export class SharedModule {


  constructor(injector: Injector) {
    BasePage.injector = injector;
  }
}
