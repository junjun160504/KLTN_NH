/**
 * @fileoverview Cloudinary configuration and utilities
 * @description Configure Cloudinary for image and QR code storage
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Cloudinary Storage for Menu Items
 */
export const menuItemsStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'restaurant/menu-items',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        // ❌ REMOVED eager transformation - will transform on-demand (lazy)
        // This reduces upload time by 30-40%
        // Transformation will happen when image is requested with URL parameters
        // Example: /w_800,h_800,c_limit,q_auto,f_auto/image.jpg
        public_id: (req, file) => {
            // Generate unique public_id
            const timestamp = Date.now();
            const random = Math.round(Math.random() * 1E9);
            return `menu-${timestamp}-${random}`;
        }
    }
});

/**
 * Cloudinary Storage for QR Codes
 */
export const qrCodesStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'restaurant/qr-codes',
        allowed_formats: ['png'],
        // Keep transformation for QR codes (small files, need quality)
        transformation: [
            { width: 512, height: 512, crop: 'limit' },
            { quality: 'auto:best' }
        ],
        public_id: (req, file) => `table-${req.params.tableId || 'temp'}`
    }
});

/**
 * Upload QR code buffer directly to Cloudinary (without multer)
 * @param {Buffer} buffer - QR code image buffer
 * @param {number} tableId - Table ID
 * @returns {Promise<object>} Cloudinary upload result
 */
export async function uploadQRToCloudinary(buffer, tableId) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'restaurant/qr-codes',
                public_id: `table-${tableId}`,
                format: 'png',
                // Keep transformation for QR codes
                transformation: [
                    { width: 512, height: 512, crop: 'limit' },
                    { quality: 'auto:best' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error('❌ Cloudinary upload error:', error);
                    reject(error);
                } else {
                    console.log('✅ QR uploaded to Cloudinary:', result.secure_url);
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @returns {Promise<object>} Deletion result
 */
export async function deleteFromCloudinary(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log('🗑️  Deleted from Cloudinary:', publicId, result);
        return result;
    } catch (error) {
        console.error('❌ Cloudinary delete error:', error);
        throw error;
    }
}

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of public_ids
 * @returns {Promise<object>} Deletion result
 */
export async function deleteMultipleFromCloudinary(publicIds) {
    try {
        const result = await cloudinary.api.delete_resources(publicIds);
        console.log('🗑️  Deleted multiple from Cloudinary:', publicIds.length, 'files');
        return result;
    } catch (error) {
        console.error('❌ Cloudinary batch delete error:', error);
        throw error;
    }
}

/**
 * Get image URL with transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {object} transformations - Transformation options
 * @returns {string} Transformed image URL
 */
export function getTransformedUrl(publicId, transformations = {}) {
    return cloudinary.url(publicId, transformations);
}

export default cloudinary;
