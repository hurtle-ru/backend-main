export class HttpError extends Error {
  public status: number;

  public details: object | undefined;

  constructor(status: number, message: string, details?: object,) {
    super(message,);
    this.status = status;
    this.details = details;
  }
}

export interface HttpErrorBody {
  error: string;
  details?: object;
}