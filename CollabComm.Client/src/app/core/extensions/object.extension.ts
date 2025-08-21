import {FormGroup} from "@angular/forms";
import {ToastrService} from "ngx-toastr";

Object.prototype.existsInValues = function (...values: any[]): boolean {
  for (const item of values) {
    if (item === this) {
      return true;
    }
  }
  return false;
};

FormGroup.prototype.getErrorForControl = function (controlName: string, errorName: string): any {
  const x1 = this.controls[controlName];
  if (x1) {
    const x2 = x1.errors;
    if (x2) {
      return x2[errorName];
    }
  }
  return undefined;
};

ToastrService.prototype.mySuccess = function (msg: string) {
  this.success(msg, undefined, {toastClass: 'rtl-toast-class'});
}

ToastrService.prototype.myError = function (msg: string) {
  this.error(msg, undefined, {toastClass: 'rtl-toast-class'});
}


Array.prototype.firstOrDefault = function<T>(this: T[], predicate: (value: T, index: number, array: T[]) => unknown) : T | undefined{
  const filtered = this.filter(predicate);
  if (filtered.length > 0) {
    return filtered[0];
  }
  return undefined;
}

Array.prototype.single = function<T>(this: T[], predicate: (value: T, index: number, array: T[]) => unknown) : T{
  const filtered = this.filter(predicate);
  if (filtered.length > 0) {
    return filtered[0];
  }
  throw new Error('The predicate query didnt provided an item.');
}
