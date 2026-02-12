import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const shorthands = undefined;

export const up = (pgm) => {
  const currentDir = fileURLToPath(new URL('.', import.meta.url));
  const sqlPath = join(currentDir, '../db_migration/20260212102511690_my_first_diff.sql');
  
  const sql = readFileSync(sqlPath, 'utf-8');
  pgm.sql(sql);
};

export const down = (pgm) => {
  // 롤백 필요 시 작성
};