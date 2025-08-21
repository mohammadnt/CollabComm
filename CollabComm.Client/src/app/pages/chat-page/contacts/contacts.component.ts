import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonGroupResponse, ContactInfo} from '../../../models/ChatModels';
import {first} from 'rxjs/operators';
import {ImageViewerComponent} from '../../../module/image-viewer/image-viewer.component';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BaseComponent} from "../../../core/classes/base-component";
import {UserType} from '../../../models/enums';
import {CollabUserInfo} from '../../../models/UserModels';
import {BaseResult} from '../../../models/BaseResult';
import {endpoint} from '../../../core/cookie-utils';
import {faAdd, faXmark} from '@fortawesome/free-solid-svg-icons';
import {AddContactDialogComponent} from './add-contact-dialog/add-contact-dialog.component';
import {CreateGroupDialogComponent} from './create-group-dialog/create-group-dialog.component';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  standalone: false
})
export class ContactsComponent extends BaseComponent implements OnInit, OnDestroy {

  userId: string | null = null;
  contacts: ContactInfo[] | undefined;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog,) {
    super();
  }

  ngOnDestroy() {
  }

  override ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userid');
    this.refresh();
  }

  refresh() {
    this.baseRestService.contacts()
      .pipe(first())
      .subscribe((d: BaseResult<{ contacts: ContactInfo[] }>) => {
          this.contacts = d.data.contacts;
        },
        error => {
        });
  }

  getHeaderName(user: CollabUserInfo | undefined) {
    if (!user || !user.first_name || !user.last_name || user.first_name === '' || user.last_name === '') {
      return '';
    }

    return user.first_name[0] + '‌' + user.last_name[0];
  }

  getPhotoSrc(user: CollabUserInfo | undefined) {
    return `${endpoint()}media/publicusermedia/${user?.media_id}`;
  }

  protected readonly faXmark = faXmark;
  protected readonly faAdd = faAdd;

  onAddBtn() {
    const viewer = this.dialog.open(AddContactDialogComponent, {
      data: {},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
    viewer.afterClosed().subscribe(async (result: any) => {
      if (result) {
        this.refresh();
      }
    });
  }

  onCreateGroup() {
    const viewer = this.dialog.open(CreateGroupDialogComponent, {
      data: {},
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });
    viewer.afterClosed().subscribe(async (result: any) => {
      if (result) {
        this.router.navigate(['chat', result]);
      }
    });
  }
}
