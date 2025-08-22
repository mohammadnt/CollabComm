import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {first} from 'rxjs/operators';
import {UserGroupInfo} from '../../../models/ChatModels';
import {BaseComponent} from "../../../core/classes/base-component";
import {BaseResult} from '../../../models/BaseResult';
import {CollabUserInfo} from '../../../models/UserModels';
import {endpoint} from '../../../core/cookie-utils';
import {UserType} from '../../../models/enums';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import {MatDialog} from '@angular/material/dialog';
import {AddMembersDialogComponent} from './add-members-dialog/add-members-dialog.component';


@Component({
  selector: 'app-group-member',
  templateUrl: './group-member.component.html',
  styleUrls: ['./group-member.component.scss'],
  standalone: false
})
export class GroupMemberComponent extends BaseComponent implements OnInit, OnDestroy {
  protected readonly faXmark = faXmark;
  protected readonly UserType = UserType;

  userGroups: UserGroupInfo[] | undefined;

  id: string | null = null;
  private startTime!: number;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private dialog: MatDialog,
  ) {
    super();
  }

  ngOnDestroy() {
  }


  override ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
    this.refresh();

  }
  refresh(){
    this.baseRestService.groupMembers(this.id)
      .pipe(first())
      .subscribe((d: BaseResult<UserGroupInfo[]>) => {
          this.userGroups = d.data;
        },
        error => {
        });
  }

  onItemClick(user: CollabUserInfo) {
    this.router.navigate([`/chat/${user.id}`]);
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

  onAddMembers() {
    const viewer = this.dialog.open(AddMembersDialogComponent, {
      data: {groupId: this.id},
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
}
