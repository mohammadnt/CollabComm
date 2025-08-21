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


@Component({
  selector: 'app-group-member',
  templateUrl: './group-member.component.html',
  styleUrls: ['./group-member.component.scss'],
  standalone: false
})
export class GroupMemberComponent extends BaseComponent implements OnInit, OnDestroy {
  userGroups: UserGroupInfo[] | undefined;

  id: string | null = null;
  onBackBtn = new EventEmitter<boolean>();
  private startTime!: number;

  constructor(private router: Router,
              private route: ActivatedRoute,
  ) {
    super();
  }

  ngOnDestroy() {
  }


  override ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id');
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

  protected readonly UserType = UserType;

  onClose() {
    this.router.navigate([`/chat/${this.id}`]);
  }

  protected readonly faXmark = faXmark;
}
