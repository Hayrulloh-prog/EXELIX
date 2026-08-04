import { query } from '../config/database';

export const getQRCodes = async (limit: number = 10) => {
  const result = await query(
    `SELECT id, token, is_used, created_at FROM qr_codes ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  
  console.log(`📋 Found ${result.rows.length} QR codes:`);
  result.rows.forEach((row, index) => {
    console.log(`${index + 1}. Token: ${row.token}, Used: ${row.is_used}, Created: ${row.created_at}`);
  });
  
  return result.rows;
};

// Для тестирования - создадим один QR код
export const createTestQR = async () => {
  const token = require('uuid').v4().replace(/-/g, '') + Date.now().toString(36);
  const id = require('uuid').v4();
  
  await query(
    `INSERT INTO qr_codes (id, token, is_used, generated_at) VALUES ($1, $2, $3, NOW())`,
    [id, token, false]
  );
  
  console.log(`✅ Created test QR token: ${token}`);
  return token;
};
