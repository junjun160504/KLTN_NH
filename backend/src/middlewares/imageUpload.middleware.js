/**
 * @fileoverview Multer middleware configuration for image uploads
 * @description Xử lý upload ảnh món ăn lên server
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads/menu-items');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created upload directory:', uploadDir);
}

/**
 * Disk storage configuration
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: menu-timestamp-randomstring.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `menu-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

/**
 * File filter - only images
 */
const imageFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('File không hợp lệ. Chỉ chấp nhận ảnh định dạng JPG, PNG, WEBP, GIF!'), false);
  }
};

/**
 * Upload configuration
 */
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * Middleware for single image upload
 */
export const uploadMenuImage = uploadImage.single('image');

/**
 * Error handler middleware for multer
 */
export function handleImageUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 400,
        message: 'File quá lớn. Kích thước tối đa là 5MB'
      });
    }
    return res.status(400).json({
      status: 400,
      message: `Lỗi upload: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      status: 400,
      message: err.message
    });
  }

  next();
}

/**
 * Helper function to delete old image file
 */
export function deleteOldImage(imagePath) {
  if (!imagePath) return;

  try {
    // Convert relative path to absolute path
    const fullPath = path.join(__dirname, '../../public', imagePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log('🗑️ Deleted old image:', imagePath);
    }
  } catch (err) {
    console.error('Error deleting old image:', err);
  }
}

export default uploadImage;
