import app from './app';
import { pool } from './config/database';

const PORT = process.env.PORT || 3001;

// Test database connection
pool
  .query('SELECT NOW()')
  .then(() => {
    console.log('✅ Database connected');
  })
  .catch((err) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
