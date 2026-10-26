import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const uploadDir = fileURLToPath(new URL('../uploads/', import.meta.url));
export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (_, file, callback) =>
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, callback) =>
    callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
});
