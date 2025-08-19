export class BaseResult<T> {
  code: ResultStatusCode = ResultStatusCode.OK;
  errors: string[] | undefined;
  data: T;

  constructor(code: ResultStatusCode, data: T) {
    this.code = code;
    this.data = data;
  }
}

export enum ResultStatusCode {
  OK = 1,
  Error = 2,
  GatewaayError = 3,
  IncorrectUsername = 4,
  WrongId = 11,
  Forbidden = 12,
  WrongPassword = 13,

  Logout = 70,
  NotFound = 13,
  EmptyFile = 14,
  Redirect = 18,
  Wait = 15,
  WrongTempId = 19,
  UserNotFound = 21,
  UnderMaintenance = 23,
  ShowError = 26,
  DuplicateKeyField = 27,
  WrongOperation = 30,
  Expired = 31,
  ContactSupport = 33,
  FieldsNotMatch = 34,
  WrongArgument = 35,
  UnhandledException = 500,
}
