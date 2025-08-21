import {replaceAll} from "../util";

String.prototype.splitPriceByCommaAndToPersian = function (): string {
  return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",").toPersian();
};
String.prototype.toPersian = function (): string {
  return this.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
};
String.prototype.toEnglish = function (): string {
  let x = this.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
  x = x.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
  return x;
};
String.prototype.replaceAllExtension = function (replace: string, value: string): string {
  return replaceAll(this.toString(), replace, value);
};
String.prototype.splitPriceByComma = function (): string {
  return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
String.prototype.isNotEmpty = function (): boolean {
  return !this.isEmpty();
};
String.prototype.isEmpty = function (): boolean {
  return !this || this === '';
};
