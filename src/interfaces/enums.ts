export enum OrderHistory {
  Pending = 'Pending',
  Rejected = 'Rejected',
  Accepted = 'Accepted',
  Cancelled = 'Cancelled',
  Timeout = 'Timeout',
  CustomerCancelled = 'Customer Cancelled',
  ProviderArrived = 'Provider arrived',
  ServiceFinished = 'Service finished',
}

export enum Constants {
  ServiceCharges = 'Service charges',
  VAT = 'VAT',
  OnlinePaymentCharges = 'Online payment charges',
}

export enum PaymentMethods {
  Credit = 'Credit',
  Cash = 'Cash',
}

export enum HTTPErrorString {
  BadRequest = 'Bad request',
  UnauthorisedAPI = 'Unauthorised',
  UnauthorisedToken = 'Unauthorised',
  SomethingWentWrong = 'Something went wrong',
}

export enum HTTPErrorMessages {
  InvalidUsernameOrPassowrd = 'Invalid username or password',
  NoSufficientPermissions = 'No sufficient permission',
  AccountInactive = 'Your account is still inactive/under processing',
}

export enum HTTPResponses {
  NotFound = 404,
  Success = 200,
  BusinessError = 422,
  ValidationError = 400,
  Unauthorised = 401,
  InternalServerError = 500,
}

export enum AllowedClients {
  MobileApp = 'mobile-app',
  CP = 'cp',
}
