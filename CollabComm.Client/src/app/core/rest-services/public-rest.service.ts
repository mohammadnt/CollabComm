import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {BaseRestService} from "./base-rest.service";
import {BaseResult} from '../../models/BaseResult';
import {endpoint} from '../cookie-utils';

@Injectable({
  providedIn: 'root'
})
export class PublicRestService {


  constructor(private http: HttpClient,
              private baseRestService: BaseRestService) {

  }

  getEwanoExport(startDate: Date | undefined, endDate: Date | undefined,): Observable<any> {
    const model = {
      start_date: startDate,
      end_date: endDate
    };
    return this.http.post<BaseResult<any>>(`${endpoint()}public/EwanoExport`, model).pipe(
      catchError((err: any, caught: Observable<any>) => {
        return this.baseRestService.handleError(err);
      })
    );
  }
}
