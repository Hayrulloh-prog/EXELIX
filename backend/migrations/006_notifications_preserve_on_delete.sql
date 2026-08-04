-- Migration: Make notifications.user_id nullable so that
-- deleting a user does NOT delete their notifications.
-- This preserves total_requests count in statistics.

-- 1. Drop the existing foreign key constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- 2. Allow NULL values in user_id
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- 3. Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
