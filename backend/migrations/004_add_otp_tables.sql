-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_otp_user_id ON otp_codes(user_id);
CREATE INDEX idx_otp_expires_at ON otp_codes(expires_at);

-- Create verification tokens table for post-OTP verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  token VARCHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_verification_token_user ON verification_tokens(user_id);
CREATE INDEX idx_verification_token_expires ON verification_tokens(expires_at);
