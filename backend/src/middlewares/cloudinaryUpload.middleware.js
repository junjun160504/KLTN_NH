/**
 * @fileoverview Multer middleware with Cloudinary storage
 * @description Upload images directly to Cloudinary cloud storage
 */

import multer from 'multer';
import { menuItemsStorage } from '../config/cloudinary.js';

/**
 * File filter - only accept images
 */
const imageFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPG, PNG, WEBP, GIF)!'), false);
    }
};

/**
 * Multer upload with Cloudinary storage
 */
const uploadToCloudinary = multer({
    storage: menuItemsStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Middleware for single image upload
 * Field name: 'image'
 */
export const uploadMenuImage = uploadToCloudinary.single('image');

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
 * Process Cloudinary upload response
 * Transform req.file to standard format
 */
export function processCloudinaryUpload(req, res, next) {
    if (req.file) {
        // Cloudinary returns secure_url in req.file.path
        req.file.cloudinary_url = req.file.path; // Full HTTPS URL
        req.file.cloudinary_public_id = req.file.filename; // public_id for deletion

        console.log('✅ File uploaded to Cloudinary:', {
            url: req.file.cloudinary_url,
            public_id: req.file.cloudinary_public_id,
            format: req.file.format,
            size: req.file.bytes
        });
    }
    next();
}
