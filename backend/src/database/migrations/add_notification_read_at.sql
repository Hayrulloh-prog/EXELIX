-- Add read_at column to notifications table if it doesn't exist
DO $$
BEGIN
    -- Check if column exists and add it if not
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name = 'read_at'
    ) THEN
        ALTER TABLE notifications 
        ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
