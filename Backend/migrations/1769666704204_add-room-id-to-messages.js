import fs from 'fs';
import path from 'path';

export const up = (pgm) => {
  const sql = fs.readFileSync(path.join(__dirname, 'sql/1769666704204_add-room-id-to-messages.sql'), 'utf8');
  pgm.sql(sql);
};

export const down = (pgm) => {
  pgm.sql('ALTER TABLE messages DROP COLUMN room_id;');
};