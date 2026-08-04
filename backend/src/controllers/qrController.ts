import { Response } from "express";
import { validateQRToken, createQRCode, getUserByQRToken } from "../services/qrService";
import { createError } from "../utils/errors";
import { query } from "../config/database";
import jwt from "jsonwebtoken";

export const validateQR = async (req: any, res: Response) => {
  const { token } = req.body;

  if (!token) {
    throw createError(400, "VALIDATION_ERROR", "Token is required");
  }

  const validation = await validateQRToken(token);

  if (!validation.valid) {
    return res.json({
      valid: false,
      used: false,
      canRegister: false,
      error: "Invalid QR code",
    });
  }

  res.json({
    valid: true,
    used: validation.used,
    canRegister: !validation.used,
    userId: validation.userId,
  });
};

export const checkQRToken = async (req: any, res: Response) => {
  const { token } = req.params;
  const statusOnly = req.query.statusOnly === 'true';

  if (!token) {
    return res.status(400).json({ success: false, error: "VALIDATION_ERROR", message: "Token is required" });
  }

  try {
    const normalizedToken = token.startsWith('/') ? token.slice(1) : token;
    
    // 1. Check if token is a valid QR code in qr_codes table
    const validation = await validateQRToken(normalizedToken);
    
    if (!validation.valid) {
       return res.json({ success: false, valid: false, error: "INVALID_TOKEN", message: "Invalid QR code" });
    }
    
    // 2. If it's not used, return success and allow registration
    if (!validation.used) {
       return res.json({
         success: true,
         valid: true,
         used: false,
         canRegister: true,
         userExists: false
       });
    }

    // 3. If it is used, fetch the user data
    const result = await query(
      `SELECT * FROM users WHERE qr_token = $1`,
      [normalizedToken]
    );

    if (result.rows.length === 0) {
      return res.json({ success: false, error: "USER_NOT_FOUND", message: "User not found" });
    }

    const user = result.rows[0];

    // 1 year expiration (365 * 24 * 60 * 60 * 1000)
    const EXPIRATION_MS = 365 * 24 * 60 * 60 * 1000;
    const isExpired = (Date.now() - new Date(user.created_at).getTime()) > EXPIRATION_MS;
    const isBlocked = user.is_active === false;

    // Check if the requester is the owner
    let isOwner = false;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
       const jwtToken = req.headers.authorization.split(" ")[1];
       try {
           const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET || "your-secret-key-here") as any;
           if (decoded && decoded.userId === user.id) {
               isOwner = true;
           }
       } catch (e) {
           // ignore invalid token
       }
    }

    res.json({
      success: true,
      valid: true,
      used: true,
      canRegister: false,
      userExists: true,
      isOwner: isOwner,
      userData: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        status: user.status,
        language: user.language,
        avatarUrl: user.avatar_url || null,
        telegramUsername: user.telegram_username,
        telegram_username: user.telegram_username,
        isExpired: isExpired,
        isBlocked: isBlocked
      }
    });
  } catch (err: any) {
    console.error("checkQRToken error:", err);
    res.status(500).json({ success: false, error: "INTERNAL_ERROR", message: "Internal server error" });
  }
};

// Debug helper: create a QR token (only active when ALLOW_QR_DEBUG=true)
export const createQR = async (req: any, res: Response) => {
  if (process.env.ALLOW_QR_DEBUG !== "true") {
    return res
      .status(403)
      .json({ error: "FORBIDDEN", message: "Debug endpoint disabled" });
  }

  try {
    const token = await createQRCode();
    return res.json({ token });
  } catch (err) {
    console.error("createQR error", err);
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
};
