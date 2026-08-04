-- Convert avatar_data from TEXT to BYTEA for better binary data handling
ALTER TABLE users
ALTER COLUMN avatar_data TYPE BYTEA USING CONVERT(avatar_data, 'UTF8'::name, 'LATIN1'::name)::bytea;
