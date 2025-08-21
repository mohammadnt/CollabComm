import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Md5} from 'ts-md5';
import {first} from 'rxjs/operators';
import {BaseResult, ResultStatusCode} from '../../../../models/BaseResult';
import {CollabUserInfo} from '../../../../models/UserModels';
import {getCookie, isNotOnDotnet, setCookie} from '../../../../core/cookie-utils';
import {BaseComponent} from '../../../../core/classes/base-component';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-add-contact-dialog',
  templateUrl: './add-contact-dialog.component.html',
  styleUrls: ['./add-contact-dialog.component.scss'],
  standalone: false
})
export class AddContactDialogComponent extends BaseComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<AddContactDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              private formBuilder: UntypedFormBuilder,
              private toaster: ToastrService) {
    super();
  }
  addForm!: UntypedFormGroup;
  submitClick = false;
  submitted = false;
  error = '';


  override ngOnInit(): void {
    this.addForm = this.formBuilder.group({
      username: ['', Validators.required],
      title: ['', Validators.required]
    });
  }

  get addFormData() {
    return this.addForm.controls;
  }

  onParentClick() {

    this.dialogRef.close();
  }

  onConfirmClick(e: MouseEvent) {
    this.onAdd();
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

  onAdd() {
    this.error = '';
    this.submitted = true;
    if (this.addForm.invalid) {
      return;
    }
    this.submitClick = true;
    const username = this.addFormData['username']?.value.trim() as string;
    const title = this.addFormData['title']?.value.trim() as string;
    this.baseRestService.addContact(username, title)
      .pipe(first())
      .subscribe((d: BaseResult<boolean>) => {
          if (d.code === ResultStatusCode.WrongArgument) {
            this.error = 'Username does not exist.';
            this.submitClick = false;
            return;
          }
          if (d.code === ResultStatusCode.DuplicateKeyField) {
            this.error = 'Contact already exists.';
            this.submitClick = false;
            return;
          }
          this.toaster.success('Contact succesfully added.');
          this.dialogRef.close(true);

        },
        error => {
          this.error = error;
          this.submitClick = false;
        });
  }
}
