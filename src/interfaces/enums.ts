export enum OrderHistory {
  Pending = 'Pending',
  Rejected = 'Rejected',
  Accepted = 'Accepted',
  Cancelled = 'Cancelled',
  Timeout = 'Timeout',
  CustomerCancelled = 'Customer Cancelled',
}

export enum PaymentMethods {
  Credit = 'Credit',
  Cash = 'Cash',
}

export enum HTTPErrorString {
  BadRequest = 'Bad request',
  UnauthorisedAPI = 'Unauthorised',
  UnauthorisedToken = 'Unauthorised',
}

export enum HTTPResponses {
  NotFound = 404,
  Success = 200,
  BusinessError = 422,
  ValidationError = 400,
  Unauthorised = 401,
}
