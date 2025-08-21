import {BaseRestService} from "../rest-services/base-rest.service";
import {Component, Injector} from "@angular/core";
import {SharedModule} from '../../shared/shared.module';

@Component({
  template: '',
  standalone: false
})
export class BasePage {
  static injector: Injector;
  baseRestService: BaseRestService;

  constructor() {
    this.baseRestService = BasePage.injector.get(BaseRestService);
  }

  ngOnInit(): void {

  }

  mustShowNavBar() {
    return true;
  }
}
