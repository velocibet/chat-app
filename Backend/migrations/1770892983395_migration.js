import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const shorthands = undefined;

export const up = (pgm) => {
  const sqlPath = join(__dirname, '../db_migration/20260212102511690_my_first_diff.sql');
  const sql = readFileSync(sqlPath, 'utf-8');
  pgm.sql(sql);
};

export const down = (pgm) => {
  // 롤백 SQL 있으면 똑같이 처리 가능
};
