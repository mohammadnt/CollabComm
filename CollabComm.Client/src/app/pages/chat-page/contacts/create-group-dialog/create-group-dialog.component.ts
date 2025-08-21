import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {first} from 'rxjs/operators';
import {BaseResult, ResultStatusCode} from '../../../../models/BaseResult';
import {CollabUserInfo} from '../../../../models/UserModels';
import {endpoint, getCookie, isNotOnDotnet, setCookie} from '../../../../core/cookie-utils';
import {BaseComponent} from '../../../../core/classes/base-component';
import {ToastrService} from 'ngx-toastr';
import {ContactInfo, SelectableContactInfo} from '../../../../models/ChatModels';
import {faCircle, faCircleCheck} from '@fortawesome/free-regular-svg-icons';


@Component({
  selector: 'app-create-group-dialog',
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.scss'],
  standalone: false
})
export class CreateGroupDialogComponent extends BaseComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<CreateGroupDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private toaster: ToastrService) {
    super();
  }

  contacts: SelectableContactInfo[] | undefined;
  usernameModel = '';
  titleModel = '';
  isLoading = false;
  error = '';


  override ngOnInit(): void {
    this.baseRestService.contacts()
      .pipe(first())
      .subscribe((d: BaseResult<{ contacts: SelectableContactInfo[] }>) => {
          this.contacts = d.data.contacts;
        },
        error => {
        });
  }

  onParentClick() {

    this.dialogRef.close();
  }

  onConfirmClick(e: MouseEvent) {
    this.onConfirm();
    e.preventDefault();
    e.stopPropagation();

    return false;
  }

  onCancelClick(e: MouseEvent) {
    this.dialogRef.close(false);
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  onConfirm() {
    this.usernameModel = this.usernameModel.trim()
    this.titleModel = this.titleModel.trim()
    this.error = '';
    if (!this.usernameModel) {
      this.error = 'Username cannot be empty';
      return;
    }
    if (!this.titleModel) {
      this.error = 'Title cannot be empty';
      return;
    }
    this.isLoading = true;
    var userIds = this.contacts?.filter(s => s.is_selected).map(s => s.target_id);
    this.baseRestService.createGroup(this.usernameModel,this.titleModel, userIds ?? [])
      .pipe(first())
      .subscribe((d: BaseResult<{ user: CollabUserInfo }>) => {
          this.isLoading = false;
          if (d.code === ResultStatusCode.DuplicateKeyField) {
            this.error = 'Username already exists.';
            return;
          }
          this.toaster.success('Contact succesfully added.');
          this.dialogRef.close(d.data.user.id);

        },
        error => {
          this.isLoading = false;
          this.error = error;
        });
  }

  getPhotoSrc(user: CollabUserInfo | undefined) {
    return `${endpoint()}media/publicusermedia/${user?.media_id}`;
  }

  getHeaderName(user: CollabUserInfo | undefined) {
    if (!user || !user.first_name || !user.last_name || user.first_name === '' || user.last_name === '') {
      return '';
    }

    return user.first_name[0] + '‌' + user.last_name[0];
  }

  protected readonly faCircleCheck = faCircleCheck;
  protected readonly faCircle = faCircle;
}
