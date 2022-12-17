export default class HttpException extends Error {
  public status: number;
  public message: string;
  public additionalParameters: string | null;

  constructor(status: number, message: string, additionalParameters: string | null = null) {
    super(message);
    this.status = status;
    this.message = message;
    this.additionalParameters = additionalParameters;
  }
}
