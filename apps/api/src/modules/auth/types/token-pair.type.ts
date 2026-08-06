export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}
