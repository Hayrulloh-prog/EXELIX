-- Add avatar data and mime type columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_data TEXT,
ADD COLUMN IF NOT EXISTS avatar_mime VARCHAR(100);

-- Create index for avatar_mime if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_users_avatar_mime ON users(avatar_mime) WHERE avatar_mime IS NOT NULL;
