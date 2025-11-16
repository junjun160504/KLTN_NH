/**
 * @fileoverview Image URL Helper Utilities
 * @description Handle backward compatibility between local and Cloudinary URLs
 */

/**
 * Get full image URL (handle both local and Cloudinary)
 * @param {string} imageUrl - Image URL from database
 * @returns {string|null} Full image URL or null
 */
export function getImageUrl(imageUrl) {
    if (!imageUrl) return null;

    // Nếu đã là Cloudinary URL (full HTTPS URL)
    if (imageUrl.startsWith('https://res.cloudinary.com/')) {
        return imageUrl;
    }

    // Nếu đã là full URL khác
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Nếu là local path → convert sang server URL (backward compatibility)
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
    return `${BACKEND_URL}${imageUrl}`;
}

/**
 * Check if image is stored on Cloudinary
 * @param {string} imageUrl - Image URL from database
 * @returns {boolean} True if Cloudinary URL
 */
export function isCloudinaryUrl(imageUrl) {
    if (!imageUrl) return false;
    return imageUrl.startsWith('https://res.cloudinary.com/');
}

/**
 * Get thumbnail URL from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
export function getThumbnailUrl(cloudinaryUrl, width = 200, height = 200) {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return cloudinaryUrl;
    }

    // Transform: w_200,h_200,c_fill
    return cloudinaryUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
}

/**
 * Get optimized URL from Cloudinary
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string} Optimized URL
 */
export function getOptimizedUrl(cloudinaryUrl) {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return cloudinaryUrl;
    }

    // Auto format + quality
    return cloudinaryUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

/**
 * Extract public_id from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string|null} Public ID or null
 */
export function extractPublicId(cloudinaryUrl) {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return null;
    }

    try {
        // Example: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/file.jpg
        const parts = cloudinaryUrl.split('/upload/');
        if (parts.length !== 2) return null;

        const pathWithVersion = parts[1];
        // Remove version (v1234567890/)
        const pathParts = pathWithVersion.split('/');
        if (pathParts[0].startsWith('v')) {
            pathParts.shift(); // Remove version
        }

        // Join remaining parts and remove extension
        const publicIdWithExt = pathParts.join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension

        return publicId;
    } catch (error) {
        console.error('Failed to extract public_id:', error);
        return null;
    }
}
