/**
 * @fileoverview Image Compression Utility
 * @description Compress images before uploading to reduce upload time
 */

import imageCompression from 'browser-image-compression';

/**
 * Compression options for different use cases
 */
export const COMPRESSION_OPTIONS = {
    // Menu items - balance between quality and size
    menuItem: {
        maxSizeMB: 0.3,           // 300KB max (giảm từ 3-5MB → 300KB)
        maxWidthOrHeight: 1200,   // Max dimension 1200px
        useWebWorker: true,       // Use web worker (không block UI)
        fileType: 'image/webp',   // WebP format (30% nhỏ hơn JPEG)
        initialQuality: 0.85,     // Quality 85% (good balance)
    },

    // QR codes - high quality
    qrCode: {
        maxSizeMB: 0.1,           // 100KB max
        maxWidthOrHeight: 512,    // QR codes don't need large size
        useWebWorker: true,
        fileType: 'image/png',    // PNG for QR codes
        initialQuality: 0.95,
    },

    // Thumbnails - aggressive compression
    thumbnail: {
        maxSizeMB: 0.05,          // 50KB max
        maxWidthOrHeight: 200,
        useWebWorker: true,
        fileType: 'image/webp',
        initialQuality: 0.7,
    }
};

/**
 * Compress image file
 * @param {File} file - Original image file
 * @param {Object} options - Compression options (optional)
 * @returns {Promise<File>} Compressed image file
 */
export async function compressImage(file, options = COMPRESSION_OPTIONS.menuItem) {
    try {
        console.log('📸 Original file:', {
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type
        });

        // Check if file is already small enough
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB < options.maxSizeMB) {
            console.log('✅ File already optimized, skipping compression');
            return file;
        }

        // Compress
        const compressedFile = await imageCompression(file, options);

        console.log('✅ Compressed file:', {
            name: compressedFile.name,
            size: (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB',
            type: compressedFile.type,
            reduction: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
        });

        return compressedFile;
    } catch (error) {
        console.error('❌ Compression failed:', error);
        // Return original file if compression fails
        return file;
    }
}

/**
 * Get image dimensions from file
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>}
 */
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.width,
                height: img.height
            });
        };

        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            reject(error);
        };

        img.src = url;
    });
}

/**
 * Validate image file
 * @param {File} file - Image file
 * @param {Object} constraints - Validation constraints
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
export async function validateImage(file, constraints = {}) {
    const {
        maxSizeMB = 10,
        minWidth = 100,
        minHeight = 100,
        maxWidth = 5000,
        maxHeight = 5000,
        allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    } = constraints;

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `Chỉ chấp nhận file: ${allowedTypes.join(', ')}`
        };
    }

    // Check file size
    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > maxSizeMB) {
        return {
            valid: false,
            error: `Kích thước file tối đa ${maxSizeMB}MB (file của bạn: ${sizeMB.toFixed(2)}MB)`
        };
    }

    // Check dimensions
    try {
        const { width, height } = await getImageDimensions(file);

        if (width < minWidth || height < minHeight) {
            return {
                valid: false,
                error: `Kích thước ảnh tối thiểu ${minWidth}x${minHeight}px`
            };
        }

        if (width > maxWidth || height > maxHeight) {
            return {
                valid: false,
                error: `Kích thước ảnh tối đa ${maxWidth}x${maxHeight}px`
            };
        }

        return { valid: true, error: null };
    } catch (error) {
        return {
            valid: false,
            error: 'Không thể đọc thông tin ảnh'
        };
    }
}

/**
 * Create preview URL for image file
 * @param {File} file - Image file
 * @returns {string} Object URL
 */
export function createImagePreview(file) {
    return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 * @param {string} url - Object URL
 */
export function revokeImagePreview(url) {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}
