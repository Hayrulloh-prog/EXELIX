import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding 20 users...');
  try {
    for (let i = 1; i <= 20; i++) {
      const qr_token = uuidv4().replace(/-/g, '') + i;
      const first_name = `TestUser${i}`;
      const last_name = `TestLastName${i}`;
      const phone = `+9965550000${i.toString().padStart(2, '0')}`;
      
      await query(
        `INSERT INTO users (qr_token, first_name, last_name, phone, phone_country, status, language, is_active)
         VALUES ($1, $2, $3, $4, 'KG', 'closed', 'ru', true)`,
        [qr_token, first_name, last_name, phone]
      );
      console.log(`Inserted user ${i}`);
    }
    console.log('Successfully seeded 20 users!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    process.exit(0);
  }
}

seed();
