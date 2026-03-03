import fs from 'fs';
import path from 'path';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

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
  // 다운 마이그레이션은 보통 테이블 삭제
  pgm.sql(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
  `);
};