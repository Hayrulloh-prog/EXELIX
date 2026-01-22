import fs from 'fs';
import path from 'path';

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('Usage: npm run migrate:create <migration-name>');
  process.exit(1);
}

const timestamp = Date.now();
const fileName = `${timestamp}_${migrationName}.sql`;
const filePath = path.join(__dirname, 'sql', fileName);

const content = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here

`;

fs.writeFileSync(filePath, content);
console.log(`✅ Created migration: ${fileName}`);
