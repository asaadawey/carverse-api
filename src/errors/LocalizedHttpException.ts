import { HTTPResponses } from '@src/interfaces/enums';
import { getMessage, MessageKey, SupportedLanguages } from '@src/locales/index';

export default class LocalizedHttpException extends Error {
  public status: number;
  public messageKey: MessageKey;
  public localizedMessage: string;
  public additionalParameters: any;
  public placeholders?: Record<string, string | number>;

  constructor(
    status: HTTPResponses,
    messageKey: MessageKey,
    language: SupportedLanguages = SupportedLanguages.EN,
    placeholders?: Record<string, string | number>,
    additionalParameters: any = null,
  ) {
    const localizedMessage = getMessage(messageKey, language, placeholders);
    super(localizedMessage);

    this.status = status;
    this.messageKey = messageKey;
    this.localizedMessage = localizedMessage;
    this.message = localizedMessage; // Override the default message
    this.placeholders = placeholders;
    this.additionalParameters = additionalParameters;
  }

  /**
   * Re-localize the error message for a different language
   */
  public localize(language: SupportedLanguages): string {
    this.localizedMessage = getMessage(this.messageKey, language, this.placeholders);
    this.message = this.localizedMessage;
    return this.localizedMessage;
  }
}
