import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {CommonGroupResponse} from '../../../models/ChatModels';
import {first} from 'rxjs/operators';
import {ImageViewerComponent} from '../../../module/image-viewer/image-viewer.component';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {BaseComponent} from "../../../core/classes/base-component";
import {UserType} from '../../../models/enums';
import {CollabUserInfo} from '../../../models/UserModels';
import {BaseResult} from '../../../models/BaseResult';
import {endpoint} from '../../../core/cookie-utils';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile-info',
  templateUrl: './profile-info.component.html',
  styleUrls: ['./profile-info.component.scss'],
  standalone: false
})
export class ProfileInfoComponent extends BaseComponent implements OnInit, OnDestroy {

  protected readonly UserType = UserType;
  userId: string | null = null;
  targetUser: CollabUserInfo | undefined;
  commonGroups: CollabUserInfo[] = [];
  onBackBtn = new EventEmitter<boolean>();
  private startTime!: number;

  viewer: MatDialogRef<ImageViewerComponent> | undefined;
  constructor(private route: ActivatedRoute,
              private router: Router,
              private dialog: MatDialog,) {
    super();
  }

  ngOnDestroy() {
  }

  onBackBtnFunc() {
    this.router.navigate([`/chat/${this.userId}`]);

  }

  override ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userid');
    this.startTime = Date.now();
    window.onbeforeunload = () => this.ngOnDestroy();
    this.onBackBtn.subscribe((value) => {
      this.onBackBtnFunc();
    });
    this.baseRestService.commonGroups(this.userId)
      .pipe(first())
      .subscribe((d: BaseResult<CommonGroupResponse>) => {
          this.commonGroups = d.data.groups;
          this.targetUser = d.data.user;
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


  onItemClick(user: CollabUserInfo) {
    this.router.navigate([`/chat/${user.id}`]);
  }


  onProfileImage() {
    if (!this.targetUser?.media_id) {
      return;
    }
    const src = this.getPhotoSrc(this.targetUser);

    this.viewer = this.dialog.open(ImageViewerComponent, {
      data: {
        thumbnailSrc: undefined, src,

      },
      height: '100vh',
      width: '100vw',
      maxWidth: '100vw',
    });

  }

  onClose() {
    this.router.navigate([`/chat/${this.userId}`]);
  }

  protected readonly faXmark = faXmark;
}
