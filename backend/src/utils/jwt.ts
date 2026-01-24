import * as jwt from "jsonwebtoken";

const JWT_SECRET = (process.env.JWT_SECRET || "secret") as jwt.Secret;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const ADMIN_JWT_SECRET = (process.env.ADMIN_JWT_SECRET ||
  "admin-secret") as jwt.Secret;

export interface JWTPayload {
  userId: string;
  type?: "user" | "admin";
}

export const generateToken = (payload: JWTPayload): string => {
  return (jwt.sign as any)(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

export const generateAdminToken = (payload: JWTPayload): string => {
  return (jwt.sign as any)(payload, ADMIN_JWT_SECRET, {
    expiresIn: "24h",
  });
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const verifyAdminToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as JWTPayload;
    if (!decoded || !decoded.userId) {
      throw new Error("Invalid admin token");
    }
    return decoded;
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Admin token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid admin token");
    }
    throw new Error("Invalid admin token");
  }
};
