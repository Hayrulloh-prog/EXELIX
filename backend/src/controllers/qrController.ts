import { Response } from "express";
import { validateQRToken, createQRCode } from "../services/qrService";
import { createError } from "../utils/errors";

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
