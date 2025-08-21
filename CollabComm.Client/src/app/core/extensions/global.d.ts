declare global {
  interface Number {
    twoDigit(): string;

    oneDigit(): string;

    noFractionDigit(): string;

    toIntString(): string;

    toPersian(): string;

    splitPriceByCommaAndToPersian(): string;

    toTwoDigitIntString(): string;

    twoDigitAfterPoint(): string;

    oneDigitAfterPoint(): string;
  }

  interface String {
    toPersian(): string;

    toEnglish(): string;

    replaceAllExtension(replace: string, value: string): string;

    splitPriceByComma(): string;

    splitPriceByCommaAndToPersian(): string;

    isNotEmpty(): boolean;

    isEmpty(): boolean;
  }

  interface Object {
    existsInValues(...values: any[]): boolean
  }

  interface Array<T> {
    firstOrDefault(predicate: (value: T, index: number, array: T[]) => unknown): T | undefined
    single(predicate: (value: T, index: number, array: T[]) => unknown): T
  }

}
declare module '@angular/forms' {
  interface FormGroup {
    getErrorForControl(controlName: string, errorName: string): any
  }
}

declare module 'ngx-toastr' {
  interface ToastrService {
    mySuccess(msg: string): any

    myError(msg: string): any
  }
}

export {};
