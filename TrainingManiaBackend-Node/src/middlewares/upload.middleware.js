import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mediaRoot = path.resolve(__dirname, '../../media');

// Ensure base subdirectories exist
const subdirs = [
  'training_pdfs',
  'training_videos',
  'training_thumbnails',
  'verification_images',
  'nic_images',
  'temp',
];

for (const dir of subdirs) {
  const fullPath = path.join(mediaRoot, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'temp';
    if (file.fieldname === 'pdf_file') {
      folder = 'training_pdfs';
    } else if (file.fieldname === 'video_file') {
      folder = 'training_videos';
    } else if (file.fieldname === 'thumbnail') {
      folder = 'training_thumbnails';
    } else if (file.fieldname === 'verification_image') {
      folder = 'verification_images';
    } else if (file.fieldname === 'nic_image') {
      folder = 'nic_images';
    }

    const dest = path.join(mediaRoot, folder);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate clean unique filename preserving extension
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${basename}_${uniqueSuffix}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max for training PDF/videos
  },
});

export const trainingUploadFields = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max for PDFs/videos
  },
}).fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'video_file', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

export const submitTestUploadFields = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max for snapshots and NIC identity scans
  },
}).fields([
  { name: 'verification_image', maxCount: 1 },
  { name: 'nic_image', maxCount: 1 },
]);

export default {
  upload,
  trainingUploadFields,
  submitTestUploadFields,
  mediaRoot,
};
