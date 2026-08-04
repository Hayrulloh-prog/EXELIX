import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("⚠️ Supabase not configured. Avatar storage will use database fallback.");
}

const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const BUCKET_NAME = "avatars";

/**
 * Check if Supabase Storage is available
 */
export function isStorageAvailable(): boolean {
  return supabase !== null;
}

/**
 * Upload avatar from a Buffer (already processed by sharp).
 * Returns the public URL or null on failure.
 */
export async function uploadAvatarBuffer(
  buffer: Buffer,
  userId: string,
): Promise<string | null> {
  if (!supabase) return null;

  const key = `avatars/${userId}.jpg`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(key, buffer, {
      contentType: "image/jpeg",
      upsert: true, // overwrite if avatar already exists
    });

  if (error) {
    console.error("Supabase upload error:", error.message);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);

  return publicUrl || null;
}

/**
 * Upload avatar from a base64 data-URI string.
 * Strips the data:image prefix before uploading.
 */
export async function uploadAvatar(
  base64Data: string,
  userId?: string,
): Promise<string | null> {
  if (!supabase) return null;

  const buf = Buffer.from(
    base64Data.replace(/^data:image\/[a-z]+;base64,/, ""),
    "base64",
  );

  return uploadAvatarBuffer(buf, userId || uuidv4());
}

/**
 * Delete an avatar from Supabase Storage by user ID.
 */
export async function deleteAvatar(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const key = `avatars/${userId}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([key]);

  if (error) {
    console.error("Supabase delete error:", error.message);
    return false;
  }

  return true;
}

/**
 * Delete multiple avatars from Supabase Storage.
 */
export async function deleteAvatars(userIds: string[]): Promise<number> {
  if (!supabase || userIds.length === 0) return 0;

  const keys = userIds.map((id) => `avatars/${id}.jpg`);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(keys);

  if (error) {
    console.error("Supabase batch delete error:", error.message);
    return 0;
  }

  return userIds.length;
}
