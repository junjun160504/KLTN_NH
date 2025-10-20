/**
 * @fileoverview Multer middleware configuration for file uploads
 * @description Xử lý upload files, đặc biệt cho Excel files
 */

import multer from 'multer';
import path from 'path';

/**
 * Memory storage - Store files in memory as Buffer
 * Tốt cho files nhỏ như Excel
 */
const storage = multer.memoryStorage();

/**
 * File filter - Chỉ accept Excel files
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];

    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed!'), false);
    }
};

/**
 * Upload configuration
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

/**
 * Middleware for single Excel file upload
 */
export const uploadExcel = upload.single('file');

/**
 * Error handler middleware for multer
 */
export function handleUploadError(err, req, res, next) {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 400,
                message: 'File too large. Maximum size is 5MB'
            });
        }
        return res.status(400).json({
            status: 400,
            message: err.message
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

export default upload;
