import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase not configured. Storage service will be disabled.");
}

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function uploadAvatar(
  base64Data: string,
  filename?: string,
): Promise<string | null> {
  if (!supabase) return null;

  const buf = Buffer.from(
    base64Data.replace(/^data:image\/[a-z]+;base64,/, ""),
    "base64",
  );
  const key = `avatars/${filename || uuidv4()}.jpg`;

  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(key, buf, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (error) {
    console.error("Supabase upload error", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(key);
  return publicUrl || null;
}
