

export class HhRefreshTokenNotExpired extends Error {
  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, HhRefreshTokenNotExpired.prototype);
  }
}