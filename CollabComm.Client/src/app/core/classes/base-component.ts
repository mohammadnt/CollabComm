import {BaseRestService} from "../rest-services/base-rest.service";
import {Component} from "@angular/core";
import {SharedModule} from '../../shared/shared.module';
import {BasePage} from './base-page';

@Component({
  template: '',
  standalone: false
})
export class BaseComponent {

  baseRestService: BaseRestService;

  constructor() {
    this.baseRestService = BasePage.injector.get(BaseRestService);
  }

  ngOnInit(): void {

  }
}
