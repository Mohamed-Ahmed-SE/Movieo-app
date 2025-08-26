// Content filtering utility to remove adult/sexual content
export const filterAdultContent = (data) => {
  if (!data || !Array.isArray(data)) return data;

  // Keywords that indicate adult/sexual content
  const adultKeywords = [
    'adult', 'adult content', 'adult film', 'adult movie', 'adult video',
    'porn', 'pornographic', 'pornography', 'xxx', 'x-rated',
    'erotic', 'erotica', 'erotic film', 'erotic movie',
    'sex', 'sexual', 'sexuality', 'sexual content', 'sexual film',
    'nude', 'nudity', 'naked', 'nudist',
    'softcore', 'hardcore', 'explicit', 'explicit content',
    'mature', 'mature content', 'adult entertainment',
    'adult film industry', 'adult movie industry',
    'adult video industry', 'adult content industry'
  ];

  // Genre IDs that typically indicate adult content
  const adultGenreIds = [
    10749, // Romance (but we'll keep romance, just filter explicit ones)
    99,    // Documentary (but we'll keep documentaries, just filter explicit ones)
  ];

  // Filter out adult content
  return data.filter(item => {
    // Check title for adult keywords
    const title = (item.title || item.name || '').toLowerCase();
    const hasAdultTitle = adultKeywords.some(keyword => 
      title.includes(keyword.toLowerCase())
    );
    if (hasAdultTitle) return false;

    // Check overview for adult keywords
    const overview = (item.overview || '').toLowerCase();
    const hasAdultOverview = adultKeywords.some(keyword => 
      overview.includes(keyword.toLowerCase())
    );
    if (hasAdultOverview) return false;

    // Check for explicit content in title or overview
    const explicitKeywords = ['explicit', 'adult film', 'adult movie', 'porn', 'xxx'];
    const hasExplicitContent = explicitKeywords.some(keyword => 
      title.includes(keyword) || overview.includes(keyword)
    );
    if (hasExplicitContent) return false;

    // Check for mature content indicators
    const matureKeywords = ['mature content', 'adult entertainment', 'adult film industry'];
    const hasMatureContent = matureKeywords.some(keyword => 
      title.includes(keyword) || overview.includes(keyword)
    );
    if (hasMatureContent) return false;

    // Additional filtering for romance content that might be explicit
    if (item.genre_ids && item.genre_ids.includes(10749)) {
      // For romance, check if it's explicitly adult content
      const romanceAdultKeywords = ['adult romance', 'erotic romance', 'sexual romance'];
      const isExplicitRomance = romanceAdultKeywords.some(keyword => 
        title.includes(keyword) || overview.includes(keyword)
      );
      if (isExplicitRomance) return false;
    }

    return true;
  });
};

// Enhanced filtering for specific content types
export const filterContentByType = (data, contentType = 'general') => {
  if (!data || !Array.isArray(data)) return data;

  let filteredData = filterAdultContent(data);

  switch (contentType) {
    case 'family':
      // Additional filtering for family-friendly content
      const familyUnfriendlyKeywords = [
        'horror', 'gore', 'blood', 'violence', 'murder', 'death',
        'scary', 'frightening', 'terrifying', 'disturbing',
        'psychological', 'thriller', 'suspense', 'mystery'
      ];
      
      filteredData = filteredData.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        
        return !familyUnfriendlyKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
      });
      break;

    case 'kids':
      // Filter for children's content only
      const kidsKeywords = [
        'animation', 'cartoon', 'children', 'kids', 'family',
        'educational', 'learning', 'fun', 'adventure'
      ];
      
      filteredData = filteredData.filter(item => {
        const title = (item.title || item.name || '').toLowerCase();
        const overview = (item.overview || '').toLowerCase();
        
        return kidsKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
      });
      break;

    default:
      // General filtering (already done above)
      break;
  }

  return filteredData;
};

// Filter content by age rating
export const filterByAgeRating = (data, maxAgeRating = 'PG-13') => {
  if (!data || !Array.isArray(data)) return data;

  const ageRatingOrder = {
    'G': 1,
    'PG': 2,
    'PG-13': 3,
    'R': 4,
    'NC-17': 5,
    'TV-Y': 1,
    'TV-Y7': 2,
    'TV-G': 2,
    'TV-PG': 3,
    'TV-14': 4,
    'TV-MA': 5
  };

  const maxRating = ageRatingOrder[maxAgeRating] || 3;

  return data.filter(item => {
    const rating = item.certification || item.rating || item.content_rating;
    if (!rating) return true; // If no rating, allow it
    
    const itemRating = ageRatingOrder[rating] || 3;
    return itemRating <= maxRating;
  });
};

// Get user's content filter settings from localStorage
export const getUserFilterSettings = () => {
  try {
    const savedSettings = localStorage.getItem('contentFilterSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      filterAdult: true,
      maxAgeRating: 'PG-13',
      contentType: 'general'
    };
  } catch (error) {
    console.error('Error reading content filter settings:', error);
    return {
      filterAdult: true,
      maxAgeRating: 'PG-13',
      contentType: 'general'
    };
  }
};

// Main content filtering function
export const applyContentFilters = (data, options = {}) => {
  let filteredData = data;

  // Get user settings if no options provided
  if (Object.keys(options).length === 0) {
    options = getUserFilterSettings();
  }

  // Apply adult content filtering
  if (options.filterAdult !== false) {
    filteredData = filterAdultContent(filteredData);
  }

  // Apply content type filtering
  if (options.contentType) {
    filteredData = filterContentByType(filteredData, options.contentType);
  }

  // Apply age rating filtering
  if (options.maxAgeRating) {
    filteredData = filterByAgeRating(filteredData, options.maxAgeRating);
  }

  return filteredData;
}; 