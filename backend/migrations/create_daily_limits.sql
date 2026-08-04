-- Create daily_limits table for tracking notification limits
CREATE TABLE IF NOT EXISTS daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notifications_sent INTEGER DEFAULT 0,
  notifications_received INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one record per user per day
  UNIQUE(user_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_limits_user_date ON daily_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_limits_date ON daily_limits(date);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_daily_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_limits_updated_at
    BEFORE UPDATE ON daily_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_limits_updated_at();
