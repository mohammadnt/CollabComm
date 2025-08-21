import {SwUpdate} from "@angular/service-worker";
import {StorageService} from "./storage.service";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class UpdateService {

  constructor(public updates: SwUpdate, private storageService: StorageService) {
    // console.log(`updates.isEnabled: ${updates.isEnabled}`)
    if (updates.isEnabled) {
      // interval(6 * 60 * 60).subscribe(() => {
      //   // console.log('before updates.checkForUpdate()')
      //   updates.checkForUpdate()
      //     .then(() => {
      //       // console.log('checking for updates')
      //     })
      // });
      updates.checkForUpdate()
        .then(() => {
          // console.log('checking for updates')
        })
    }
  }

  public checkForUpdates(): void {
    this.updates.activateUpdate().then(e => {
      this.promptUser()
    })
  }

  private promptUser(): void {

    this.updates.activateUpdate().then(() => {
      const selfId = this.storageService?.getObjectFromLocalStorage('user_id', '') as string;
      // console.log('updating to new version');
      // if (selfId.toLowerCase() == "408d7de1-0a66-4146-9e9d-6198ff799c39".toLowerCase()) {
      //   alert(`Updating1! YOHO!:`)
      // }
      document.location.reload()
    });
  }
}
