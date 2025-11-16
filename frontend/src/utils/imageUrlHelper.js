/**
 * @fileoverview Image URL Helper Utilities for Frontend
 * @description Handle backward compatibility between local and Cloudinary URLs
 */

/**
 * Get full image URL with optional optimization (handle both local and Cloudinary)
 * @param {string} imageUrl - Image URL from API response
 * @param {Object} options - Transformation options
 * @param {number} options.width - Max width
 * @param {number} options.height - Max height
 * @param {string} options.crop - Crop mode (limit, fill, fit, etc.)
 * @param {boolean} options.optimize - Apply auto optimization (f_auto, q_auto)
 * @returns {string|null} Full image URL or null
 */
const getImageUrl = (imageUrl, options = {}) => {
    if (!imageUrl) return null;

    // Nếu đã là Cloudinary URL (full HTTPS URL)
    if (imageUrl.startsWith('https://res.cloudinary.com/')) {
        // Apply transformations if requested
        if (options.width || options.height || options.optimize) {
            return applyTransformation(imageUrl, options);
        }
        return imageUrl;
    }

    // Nếu đã là full URL khác
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    // Nếu là local path → convert sang server URL (backward compatibility)
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    return `${BACKEND_URL}${imageUrl}`;
};

/**
 * Check if image is stored on Cloudinary
 * @param {string} imageUrl - Image URL from API
 * @returns {boolean} True if Cloudinary URL
 */
const isCloudinaryUrl = (imageUrl) => {
    if (!imageUrl) return false;
    return imageUrl.startsWith('https://res.cloudinary.com/');
};

/**
 * Apply Cloudinary transformations to URL (lazy transformation)
 * @param {string} cloudinaryUrl - Original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} Transformed URL
 */
const applyTransformation = (cloudinaryUrl, options = {}) => {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return cloudinaryUrl;
    }

    const transformations = [];

    // Size transformation
    if (options.width || options.height) {
        const w = options.width ? `w_${options.width}` : '';
        const h = options.height ? `h_${options.height}` : '';
        const crop = options.crop || 'limit';
        transformations.push([w, h, `c_${crop}`].filter(Boolean).join(','));
    }

    // Optimization
    if (options.optimize !== false) {
        transformations.push('f_auto,q_auto:good');
    }

    // Quality override
    if (options.quality) {
        transformations.push(`q_${options.quality}`);
    }

    if (transformations.length === 0) {
        return cloudinaryUrl;
    }

    // Insert transformations into URL
    const transformStr = transformations.join(',');
    return cloudinaryUrl.replace('/upload/', `/upload/${transformStr}/`);
};

/**
 * Get thumbnail URL from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @param {number} width - Thumbnail width
 * @param {number} height - Thumbnail height
 * @returns {string} Thumbnail URL
 */
const getThumbnailUrl = (cloudinaryUrl, width = 200, height = 200) => {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return cloudinaryUrl;
    }

    // Transform: w_200,h_200,c_fill
    return cloudinaryUrl.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`);
};

/**
 * Get optimized URL from Cloudinary
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string} Optimized URL
 */
const getOptimizedUrl = (cloudinaryUrl) => {
    if (!isCloudinaryUrl(cloudinaryUrl)) {
        return cloudinaryUrl;
    }

    // Auto format + quality
    return cloudinaryUrl.replace('/upload/', '/upload/f_auto,q_auto/');
};

export { getImageUrl, isCloudinaryUrl, getThumbnailUrl, getOptimizedUrl, applyTransformation };
