import { query } from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function applyIndexes() {
  try {
    console.log('🚀 Applying performance indexes for 20,000+ users...');
    
    // Читаем SQL файл миграции
    const migrationPath = path.join(__dirname, '../migrations/004_add_performance_indexes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Reading migration file:', migrationPath);
    
    // Выполняем миграцию
    await query(migrationSQL);
    
    console.log('✅ Performance indexes applied successfully!');
    console.log('📊 Database is now optimized for 20,000+ users');
    
    // Проверяем индексы
    const indexCheck = await query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND tablename IN ('users', 'notifications', 'qr_codes', 'statistics')
      ORDER BY tablename, indexname
    `);
    
    console.log('📋 Created indexes:');
    indexCheck.rows.forEach(row => {
      console.log(`  - ${row.tablename}.${row.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ Error applying indexes:', error);
    process.exit(1);
  }
}

// Запуск миграции
applyIndexes()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
