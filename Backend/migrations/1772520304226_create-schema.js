import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  const schemaPath = path.join(__dirname, 'db_migration', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  pgm.sql(sql);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  // 다운 마이그레이션: 기존 public 스키마 전체 삭제 후 재생성
  pgm.sql(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `);
};