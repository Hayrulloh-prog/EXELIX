import { query } from './config/database';

async function checkCountries() {
  const res = await query(`SELECT id, phone, phone_country, is_active FROM users WHERE (is_active = FALSE OR is_active IS NULL OR created_at < NOW() - INTERVAL '1 year')`);
  console.log('Inactive users countries:', res.rows);
  process.exit(0);
}

checkCountries();