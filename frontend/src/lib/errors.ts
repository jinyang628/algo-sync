export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export const INVALID_API_KEY_ERROR_NAME = 'InvalidApiKeyError';
export const MISSING_API_KEY_ERROR_NAME = 'MissingApiKeyError';

export class InvalidApiKeyError extends ApiKeyError {
  constructor(message: string) {
    super(message);
    this.name = INVALID_API_KEY_ERROR_NAME;
  }
}

export class MissingApiKeyError extends ApiKeyError {
  constructor(message: string) {
    super(message);
    this.name = MISSING_API_KEY_ERROR_NAME;
  }
}
