/**
 * Utility functions for handling custom images
 */

/**
 * Get image quality setting from localStorage
 * @returns {string} - Image quality setting (low, medium, high)
 */
export const getImageQuality = () => {
  return localStorage.getItem('imageQuality') || 'high';
};

/**
 * Get TMDB image size based on quality setting
 * @param {string} quality - Image quality setting
 * @param {string} type - Image type (poster, backdrop, profile, still)
 * @returns {string} - TMDB image size
 */
export const getImageSize = (quality = 'high', type = 'poster') => {
  const qualitySettings = {
    low: {
      poster: 'w185',
      backdrop: 'w300',
      profile: 'w45',
      still: 'w185'
    },
    medium: {
      poster: 'w500',
      backdrop: 'w1280',
      profile: 'w185',
      still: 'w500'
    },
    high: {
      poster: 'original',
      backdrop: 'original',
      profile: 'w500',
      still: 'original'
    }
  };

  return qualitySettings[quality]?.[type] || qualitySettings.high[type];
};

/**
 * Get optimized image URL with quality settings
 * @param {string} originalPath - Original image path
 * @param {string} imageURL - Base image URL
 * @param {string} type - Image type (poster, backdrop, profile, still)
 * @param {string} quality - Image quality setting
 * @returns {string} - Optimized image URL
 */
export const getOptimizedImageURL = (originalPath, imageURL, type = 'poster', quality = 'high') => {
  if (!originalPath || !imageURL) {
    return null;
  }
  
  const currentQuality = getImageQuality();
  const size = getImageSize(currentQuality, type);
  
  // If originalPath already has a size prefix, replace it
  if (originalPath.includes('/t/p/')) {
    return originalPath.replace(/\/t\/p\/[^\/]+/, `/t/p/${size}`);
  }
  
  // Handle original size (no size prefix)
  if (size === 'original') {
    return `${imageURL}original${originalPath}`;
  }
  
  return `${imageURL}${size}${originalPath}`;
};

/**
 * Get custom poster image from localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} mediaType - Media type (movie/tv)
 * @returns {string|null} - Custom poster URL or null
 */
export const getCustomPoster = (id, mediaType = 'movie') => {
  if (!id) return null;
  // Check for content-specific custom poster first
  const contentPoster = localStorage.getItem(`content_poster_${id}_${mediaType}`);
  if (contentPoster) return contentPoster;
  // Fallback to old format
  return localStorage.getItem(`customPoster-${id}`);
};

/**
 * Get custom backdrop image from localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} mediaType - Media type (movie/tv)
 * @returns {string|null} - Custom backdrop URL or null
 */
export const getCustomBackdrop = (id, mediaType = 'movie') => {
  if (!id) return null;
  // Check for content-specific custom backdrop first
  const contentBackdrop = localStorage.getItem(`content_backdrop_${id}_${mediaType}`);
  if (contentBackdrop) return contentBackdrop;
  // Fallback to old format
  return localStorage.getItem(`customBackdrop-${id}`);
};

/**
 * Save custom poster image to localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} imageUrl - Image URL (base64 or URL)
 * @param {string} mediaType - Media type (movie/tv)
 */
export const saveCustomPoster = (id, imageUrl, mediaType = 'movie') => {
  if (!id || !imageUrl) return;
  localStorage.setItem(`content_poster_${id}_${mediaType}`, imageUrl);
};

/**
 * Save custom backdrop image to localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} imageUrl - Image URL (base64 or URL)
 * @param {string} mediaType - Media type (movie/tv)
 */
export const saveCustomBackdrop = (id, imageUrl, mediaType = 'movie') => {
  if (!id || !imageUrl) return;
  localStorage.setItem(`content_backdrop_${id}_${mediaType}`, imageUrl);
};

/**
 * Remove custom poster image from localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} mediaType - Media type (movie/tv)
 */
export const removeCustomPoster = (id, mediaType = 'movie') => {
  if (!id) return;
  localStorage.removeItem(`content_poster_${id}_${mediaType}`);
  localStorage.removeItem(`customPoster-${id}`); // Also remove old format
};

/**
 * Remove custom backdrop image from localStorage
 * @param {number} id - Movie/TV show ID
 * @param {string} mediaType - Media type (movie/tv)
 */
export const removeCustomBackdrop = (id, mediaType = 'movie') => {
  if (!id) return;
  localStorage.removeItem(`content_backdrop_${id}_${mediaType}`);
  localStorage.removeItem(`customBackdrop-${id}`); // Also remove old format
};

/**
 * Get the best available poster image (custom or original) with quality optimization
 * @param {number} id - Movie/TV show ID
 * @param {string} originalPath - Original poster path
 * @param {string} imageURL - Base image URL
 * @param {string} mediaType - Media type (movie/tv)
 * @returns {string} - Best available poster URL
 */
export const getBestPoster = (id, originalPath, imageURL, mediaType = 'movie') => {
  const customPoster = getCustomPoster(id, mediaType);
  if (customPoster) return customPoster;
  if (originalPath && imageURL) {
    return getOptimizedImageURL(originalPath, imageURL, 'poster');
  }
  return null;
};

/**
 * Get the best available backdrop image (custom or original) with quality optimization
 * @param {number} id - Movie/TV show ID
 * @param {string} originalPath - Original backdrop path
 * @param {string} imageURL - Base image URL
 * @param {string} mediaType - Media type (movie/tv)
 * @returns {string} - Best available backdrop URL
 */
export const getBestBackdrop = (id, originalPath, imageURL, mediaType = 'movie') => {
  const customBackdrop = getCustomBackdrop(id, mediaType);
  if (customBackdrop) return customBackdrop;
  if (originalPath && imageURL) {
    return getOptimizedImageURL(originalPath, imageURL, 'backdrop');
  }
  return null;
};

/**
 * Validate image file
 * @param {File} file - File to validate
 * @param {number} maxSize - Maximum file size in bytes (default: 5MB)
 * @returns {object} - Validation result with success and error message
 */
export const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return { success: false, error: 'No file selected' };
  }

  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Please select a valid image file' };
  }

  if (file.size > maxSize) {
    return { success: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  return { success: true, error: null };
};

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}; 