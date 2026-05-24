import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, '../../../uploads')),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});

const fileFilter = (_, file, cb) =>
  file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Images only'), false);

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('image');
