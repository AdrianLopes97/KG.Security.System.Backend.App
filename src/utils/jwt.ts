import { sign, verify } from "jsonwebtoken";
import { env } from "~/env";

export interface TokenPayload {
  sub: string;
  iat: number;
  exp: number;
}

export function createAccessToken(userId: string) {
  return sign({}, env.JWT_ACCESS_TOKEN_SECRET, {
    subject: userId,
    expiresIn: "1h",
  });
}

export function createRefreshToken(userId: string) {
  return sign({}, env.JWT_REFRESH_TOKEN_SECRET, {
    subject: userId,
    expiresIn: "7d",
  });
}

export function getTokenPayload(token: string, isRefresh?: boolean) {
  return verify(
    token,
    isRefresh ? env.JWT_REFRESH_TOKEN_SECRET : env.JWT_ACCESS_TOKEN_SECRET,
  ) as TokenPayload;
}
