import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

const createToken = (
  payload: Record<string, unknown>,
  secret: Secret,
  expireTime: string | number // Allow both string and number formats
): string => {
  const options: SignOptions = { expiresIn: expireTime as SignOptions["expiresIn"] }; 

  return jwt.sign(payload, secret, options);
};

const verifyToken = (token: string, secret: Secret): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = {
  createToken,
  verifyToken,
};
