export type CreateHhAccessTokenResponse = {
  "authorizationCode": string,
}

export type PutMeHhAccessTokenRequest = {
  authorizationCode: string,
}
