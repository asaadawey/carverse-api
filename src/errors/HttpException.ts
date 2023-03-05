import { HTTPErrorMessages, HTTPErrorString, HTTPResponses } from 'interfaces/enums';

export default class HttpException extends Error {
  public status: number;
  public message: string;
  public additionalParameters: string | any;

  constructor(
    status: HTTPResponses,
    message: HTTPErrorString | HTTPErrorMessages,
    additionalParameters: string | any = null,
  ) {
    super(message);
    this.status = status;
    this.message = message;
    this.additionalParameters = additionalParameters;
  }
}
