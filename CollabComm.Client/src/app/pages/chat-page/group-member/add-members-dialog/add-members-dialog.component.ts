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
  selector: 'app-add-members-dialog',
  templateUrl: './add-members-dialog.component.html',
  styleUrls: ['./add-members-dialog.component.scss'],
  standalone: false
})
export class AddMembersDialogComponent extends BaseComponent implements OnInit {
  groupId : string;
  constructor(public dialogRef: MatDialogRef<AddMembersDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private toaster: ToastrService) {
    super();
    this.groupId = data.groupId;
  }

  contacts: SelectableContactInfo[] | undefined;
  isLoading = false;


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
    this.isLoading = true;
    var userIds = this.contacts?.filter(s => s.is_selected).map(s => s.target_id);
    this.baseRestService.addMembers(this.groupId, userIds ?? [])
      .pipe(first())
      .subscribe((d: BaseResult<boolean>) => {
          if(!d.data){
            this.toaster.error('Something bad happened');
            this.dialogRef.close(false);
          }else{
            this.toaster.success('Users added successfully.');
            this.dialogRef.close(true);
          }

        },
        error => {
          this.isLoading = false;
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
