import { Router } from "express";
import {
  getMe,
  updateMe,
  subscribePush,
  updateLanguage,
} from "../controllers/userController";
import { authenticate } from "../middleware/auth";
import { validateUpdateProfile } from "../utils/validation";
import { userRateLimit } from "../middleware/rateLimit";
import { Response } from "express";
import { query } from "../config/database";
import { AuthRequest } from "../middleware/auth";
import sharp from "sharp";
import { uploadAvatarBuffer, isStorageAvailable } from "../services/storageService";

const router = Router();

router.get("/me", userRateLimit, authenticate, getMe);
router.put("/me", userRateLimit, authenticate, validateUpdateProfile, updateMe);
router.post("/push-subscribe", userRateLimit, authenticate, subscribePush);
router.put("/language", userRateLimit, authenticate, updateLanguage);

// Check phone existence
router.post("/check-phone", userRateLimit, authenticate, async (req: AuthRequest, res: Response) => {
  const { phone, phoneCountry } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Phone number is required",
    });
  }

  try {
    const result = await query(
      `SELECT id FROM users WHERE phone = $1 AND phone_country = $2`,
      [phone, phoneCountry || 'KG']
    );

    res.json({
      success: true,
      exists: result.rows.length > 0,
      userId: result.rows.length > 0 ? result.rows[0].id : null,
    });
  } catch (error) {
    console.error("Error checking phone:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to check phone number",
    });
  }
});

// Check Telegram existence
router.post("/check-telegram", userRateLimit, authenticate, async (req: AuthRequest, res: Response) => {
  const { telegram } = req.body;

  if (!telegram) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Telegram username is required",
    });
  }

  try {
    const result = await query(
      `SELECT id, telegram_username FROM users WHERE LOWER(telegram_username) = LOWER($1) OR LOWER(telegram_username) = LOWER('@' || $1)`,
      [telegram.trim()]
    );

    res.json({
      success: true,
      exists: result.rows.length > 0,
      userId: result.rows.length > 0 ? result.rows[0].id : null,
    });
  } catch (error) {
    console.error("Error checking Telegram:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to check Telegram username",
    });
  }
});

// Get user avatar
router.get("/:id/avatar", async (req: any, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "User ID is required",
    });
  }

  try {
    const result = await query(
      "SELECT avatar_url FROM users WHERE id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User not found",
      });
    }

    const { avatar_url } = result.rows[0];

    // If no avatar, return a default SVG placeholder
    if (!avatar_url) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");

      const svgPlaceholder = `
        <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="200" fill="#f3f4f6"/>
          <circle cx="100" cy="80" r="30" fill="#9ca3af"/>
          <ellipse cx="100" cy="150" rx="40" ry="25" fill="#9ca3af"/>
        </svg>
      `;
      return res.send(svgPlaceholder);
    }

    // If avatar is a URL (Supabase Storage or Google), redirect
    if (avatar_url.startsWith("http")) {
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.redirect(302, avatar_url);
    }

    // Legacy fallback: base64 data URI in DB
    if (avatar_url.startsWith("data:")) {
      const matches = avatar_url.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const buffer = Buffer.from(matches[2], "base64");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.send(buffer);
      }
    }

    // If it's a relative path, redirect
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.redirect(302, avatar_url);
  } catch (error) {
    console.error("Avatar fetch error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to fetch avatar",
    });
  }
});

// Update user avatar
router.post("/:id/avatar", async (req: any, res: Response) => {
  const { id } = req.params;
  const { avatarData } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "User ID is required",
    });
  }

  if (!avatarData) {
    return res.status(400).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: "Avatar data is required",
    });
  }

  try {
    let avatarUrl: string | null = null;

    if (avatarData && avatarData.startsWith("data:image")) {
      try {
        const base64Data = avatarData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Optimize image with sharp
        const optimizedBuffer = await sharp(buffer)
          .resize(400, 400, { fit: "cover" })
          .jpeg({ quality: 80 })
          .toBuffer();

        // Try Supabase Storage first
        if (isStorageAvailable()) {
          avatarUrl = await uploadAvatarBuffer(optimizedBuffer, id);
        }

        // Fallback: store as base64 data URI
        if (!avatarUrl) {
          avatarUrl = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
        }
      } catch (error) {
        console.error("Avatar processing error:", error);
        return res.status(400).json({
          success: false,
          error: "INVALID_IMAGE",
          message: "Invalid image format",
        });
      }
    }

    // Update user avatar_url in database
    const result = await query(
      `UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
      [avatarUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User not found",
      });
    }

    res.json({
      success: true,
      avatarUrl: avatarUrl,
      message: "Avatar updated successfully",
    });
  } catch (error) {
    console.error("Avatar update error:", error);
    res.status(500).json({
      success: false,
      error: "INTERNAL_ERROR",
      message: "Failed to update avatar",
    });
  }
});

export default router;
