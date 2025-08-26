import axios from 'axios';
import { applyContentFilters } from './contentFilter.js';

// TMDB API Configuration
const API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;
const BASE_URL = 'https://api.themoviedb.org/3';

// Mock data for when API token is not available
const mockData = {
  trending: {
    results: [
      // Only include non-anime movies/TV shows here
    ]
  },
  configuration: {
    images: {
      secure_base_url: "https://image.tmdb.org/t/p/",
      poster_sizes: ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
      backdrop_sizes: ["w300", "w780", "w1280", "original"]
    }
  },
  movieDetails: {
    1: {
      id: 1,
      title: "Sample Movie 1",
      overview: "This is a sample movie description for demonstration purposes.",
      poster_path: "/sample1.jpg",
      backdrop_path: "/sample1-backdrop.jpg",
      vote_average: 8.5,
      release_date: "2024-01-01",
      runtime: 120,
      genres: [{ id: 1, name: "Action" }, { id: 2, name: "Adventure" }],
      production_companies: [{ name: "Sample Studio" }]
    },
    2: {
      id: 2,
      title: "Sample Movie 2",
      overview: "Another sample movie for the demo app.",
      poster_path: "/sample2.jpg",
      backdrop_path: "/sample2-backdrop.jpg",
      vote_average: 7.8,
      release_date: "2024-01-15",
      runtime: 95,
      genres: [{ id: 3, name: "Comedy" }, { id: 4, name: "Drama" }],
      production_companies: [{ name: "Demo Studio" }]
    },
    3: {
      id: 3,
      title: "Sample Movie 3",
      overview: "A third sample movie to show the app functionality.",
      poster_path: "/sample3.jpg",
      backdrop_path: "/sample3-backdrop.jpg",
      vote_average: 9.1,
      release_date: "2024-02-01",
      runtime: 150,
      genres: [{ id: 5, name: "Sci-Fi" }, { id: 6, name: "Thriller" }],
      production_companies: [{ name: "Test Studio" }]
    }
  },
  credits: {
    1: {
      cast: [
        { id: 1, name: "John Doe", character: "Main Character", profile_path: "/actor1.jpg" },
        { id: 2, name: "Jane Smith", character: "Supporting Role", profile_path: "/actor2.jpg" }
      ],
      crew: [
        { id: 3, name: "Director Name", job: "Director", profile_path: "/director1.jpg" }
      ]
    },
    2: {
      cast: [
        { id: 4, name: "Actor Name", character: "Lead Role", profile_path: "/actor3.jpg" }
      ],
      crew: [
        { id: 5, name: "Crew Member", job: "Producer", profile_path: "/crew1.jpg" }
      ]
    },
    3: {
      cast: [
        { id: 6, name: "Another Actor", character: "Protagonist", profile_path: "/actor4.jpg" }
      ],
      crew: [
        { id: 7, name: "Another Director", job: "Director", profile_path: "/director2.jpg" }
      ]
    }
  },
  images: {
    1: {
      backdrops: [
        { file_path: "/sample1-backdrop.jpg", aspect_ratio: 1.78 }
      ],
      posters: [
        { file_path: "/sample1.jpg", aspect_ratio: 0.67 }
      ]
    },
    2: {
      backdrops: [
        { file_path: "/sample2-backdrop.jpg", aspect_ratio: 1.78 }
      ],
      posters: [
        { file_path: "/sample2.jpg", aspect_ratio: 0.67 }
      ]
    },
    3: {
      backdrops: [
        { file_path: "/sample3-backdrop.jpg", aspect_ratio: 1.78 }
      ],
      posters: [
        { file_path: "/sample3.jpg", aspect_ratio: 0.67 }
      ]
    }
  },
  videos: {
    1: {
      results: [
        { key: "sample_video_1", name: "Trailer", site: "YouTube", type: "Trailer" }
      ]
    },
    2: {
      results: [
        { key: "sample_video_2", name: "Teaser", site: "YouTube", type: "Teaser" }
      ]
    },
    3: {
      results: [
        { key: "sample_video_3", name: "Official Trailer", site: "YouTube", type: "Trailer" }
      ]
    }
  }
};

// Check if API token is properly configured
if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
  console.warn('⚠️ TMDB API Token not configured!');
  console.warn('📝 To get real movie data, create a .env file with:');
  console.warn('VITE_TMDB_API_TOKEN=your_actual_token_here');
  console.warn('🔗 Get your token from: https://www.themoviedb.org/settings/api');
  console.warn('🎬 Using demo data for now...');
}

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
    });

    // Handle specific error types
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error - check your internet connection');
    } else if (error.code === 'ERR_CONNECTION_CLOSED') {
      console.error('Connection closed - server may be down');
    } else if (error.response?.status === 401) {
      console.error('Unauthorized - check API token');
    } else if (error.response?.status === 429) {
      console.error('Rate limited - too many requests');
    }

    return Promise.reject(error);
  }
);

/**
 * Make API request with retry logic and fallback to mock data
 * @param {string} endpoint - API endpoint
 * @param {object} options - Request options
 * @param {number} retries - Number of retries (default: 3)
 * @returns {Promise} - API response
 */
export const apiRequest = async (endpoint, options = {}, retries = 3) => {
  // Only use mock data if API token is missing or invalid
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    console.log('Using mock data for:', endpoint);
    
    // ANIME LOGIC - ALWAYS CHECK FIRST
    if (endpoint.includes('anime')) {
      console.log('Anime category detected, FORCING real anime titles');
      
      // CREATE HARDCODED REAL ANIME RESULTS
      const realAnimeData = [
        {
          id: 1001,
          title: "Darling in the Franxx",
          overview: "A romance mecha anime about pilots fighting monsters together.",
          poster_path: "/darling-franxx.jpg",
          backdrop_path: "/darling-franxx-backdrop.jpg",
          vote_average: 8.5,
          first_air_date: "2018-01-01",
          media_type: "tv"
        },
        {
          id: 1002,
          title: "Tokyo Ghoul",
          overview: "A dark horror anime about a student who becomes a flesh-eating ghoul.",
          poster_path: "/tokyo-ghoul.jpg",
          backdrop_path: "/tokyo-ghoul-backdrop.jpg",
          vote_average: 8.0,
          first_air_date: "2014-01-01",
          media_type: "tv"
        },
        {
          id: 1003,
          title: "Haikyuu!!",
          overview: "A sports anime about high school volleyball team.",
          poster_path: "/haikyuu.jpg",
          backdrop_path: "/haikyuu-backdrop.jpg",
          vote_average: 8.3,
          first_air_date: "2014-01-01",
          media_type: "tv"
        },
        {
          id: 1004,
          title: "Your Name",
          overview: "A romantic fantasy anime about body-swapping teenagers.",
          poster_path: "/your-name.jpg",
          backdrop_path: "/your-name-backdrop.jpg",
          vote_average: 8.9,
          release_date: "2016-01-01",
          media_type: "movie"
        }
      ];
      
      console.log('Real anime data created:', realAnimeData.map(item => item.title));
      
      // Return all anime data
      return {
        data: {
          results: realAnimeData,
          total_pages: 1,
          total_results: realAnimeData.length
        }
      };
    }
    
    // Return appropriate mock data based on endpoint
    if (endpoint.includes('discover')) {
      // SIMPLIFIED MOCK DATA FILTERING
      let filteredResults = [...mockData.trending.results];
      
      console.log('Mock data filtering started with params:', options.params);
      
      if (options.params) {
        // Filter by media type
        if (endpoint.includes('/movie')) {
          filteredResults = filteredResults.filter(item => item.media_type === 'movie');
          console.log('Filtered for movies, count:', filteredResults.length);
        } else if (endpoint.includes('/tv')) {
          filteredResults = filteredResults.filter(item => item.media_type === 'tv');
          console.log('Filtered for TV shows, count:', filteredResults.length);
        }
        
        // Filter by year - SIMPLIFIED
        if (options.params.primary_release_year || options.params.first_air_date_year) {
          const year = options.params.primary_release_year || options.params.first_air_date_year;
          console.log('Filtering by year:', year);
          filteredResults = filteredResults.filter(item => {
            const itemYear = item.release_date || item.first_air_date;
            const matches = itemYear && itemYear.startsWith(year);
            console.log('Year check:', { title: item.title, itemYear, year, matches });
            return matches;
          });
          console.log('After year filtering, count:', filteredResults.length);
        }
        
        // Filter by rating - SIMPLIFIED
        if (options.params.vote_average_gte) {
          const minRating = parseFloat(options.params.vote_average_gte);
          console.log('Filtering by rating:', minRating);
          filteredResults = filteredResults.filter(item => {
            const matches = item.vote_average >= minRating;
            console.log('Rating check:', { title: item.title, rating: item.vote_average, minRating, matches });
            return matches;
          });
          console.log('After rating filtering, count:', filteredResults.length);
        }
      }
      
      // Filter out anime and items with no image
      // The original code had a helper function for this, but it's removed.
      // For now, we'll just return the filtered results.
      // If a more robust filtering is needed, it should be re-added.
      
      return {
        data: {
          results: filteredResults,
          total_pages: 1,
          total_results: filteredResults.length
        }
      };
    } else if (endpoint.includes('trending')) {
      return { data: mockData.trending, status: 200 };
    } else if (endpoint.includes('popular')) {
      return { 
        data: {
          results: mockData.popular.results,
          total_pages: 1,
          total_results: mockData.popular.results.length,
          page: 1
        }, 
        status: 200 
      };
    } else if (endpoint.includes('top_rated')) {
      return { 
        data: {
          results: mockData.topRated.results,
          total_pages: 1,
          total_results: mockData.topRated.results.length,
          page: 1
        }, 
        status: 200 
      };
    } else if (endpoint.includes('upcoming')) {
      return { 
        data: {
          results: mockData.upcoming.results,
          total_pages: 1,
          total_results: mockData.upcoming.results.length,
          page: 1
        }, 
        status: 200 
      };
    } else {
      return { data: mockData.configuration, status: 200 };
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await apiClient.get(url, {
        ...options,
        timeout: options.timeout || 10000,
      });
      
      // Process the response data to add correct media_type based on Animation genre
      if (response.data && response.data.results) {
        // First, apply content filtering to remove adult/sexual content using user settings
        response.data.results = applyContentFilters(response.data.results);
        
        // Then process anime detection
        response.data.results = response.data.results.map(item => {
                                         // Check if it's explicitly marked as anime
                if (item.media_type === 'anime') {
                  return { ...item, media_type: 'anime' };
                }
                
                // Check ONLY for Animation genre
                const hasAnimationGenre = item.genres?.some(genre => 
                  genre.name?.toLowerCase().includes('animation')
                );
                
                if (hasAnimationGenre) {
                  return { ...item, media_type: 'anime' };
                }
                
                // Also check genre_ids for animation (ID 16 is Animation)
                const hasAnimationGenreId = item.genre_ids?.includes(16);
                
                if (hasAnimationGenreId) {
                  return { ...item, media_type: 'anime' };
                }
                
                // Check for Japanese origin country (common for anime)
                const isJapanese = item.origin_country?.includes('JP') || 
                                  item.original_language === 'ja' ||
                                  item.original_language === 'ko';
                
                // Check for anime keywords in title or overview
                const hasAnimeKeywords = (item.title?.toLowerCase().includes('anime') || 
                                         item.name?.toLowerCase().includes('anime') ||
                                         item.overview?.toLowerCase().includes('anime')) &&
                                         isJapanese;
                
                if (hasAnimeKeywords) {
                  return { ...item, media_type: 'anime' };
                }
                
                // Check for romance anime series (common anime genre)
                const hasRomanceGenre = item.genre_ids?.includes(10749) && isJapanese;
                if (hasRomanceGenre) {
                  return { ...item, media_type: 'anime' };
                }
          
          // Keep original media_type for non-anime content
          return item;
        });
      }
      
      return response;
    } catch (error) {
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Check if API token is valid
 * @returns {Promise<boolean>} - True if token is valid
 */
export const validateApiToken = async () => {
  // If no API token, return true to allow mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    return true;
  }

  try {
    const response = await apiRequest('/configuration');
    return response.status === 200;
  } catch (error) {
    console.error('API Token validation failed:', error);
    return false;
  }
};

/**
 * Get API configuration
 * @returns {Promise<object>} - API configuration
 */
export const getApiConfiguration = async () => {
  try {
    const response = await apiRequest('/configuration');
    return response.data;
  } catch (error) {
    console.error('Failed to get API configuration:', error);
    throw error;
  }
};

/**
 * Search for movies/TV shows
 * @param {string} query - Search query
 * @param {number} page - Page number
 * @returns {Promise<object>} - Search results
 */
export const searchMulti = async (query, page = 1) => {
  // If no API token, return mock search results
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results.filter(movie => 
        movie.title.toLowerCase().includes(query.toLowerCase())
    );
    // Apply content filtering to mock results
    results = applyContentFilters(results);
    return {
      results,
      total_pages: 1,
      total_results: results.length
    };
  }

  try {
    const response = await apiRequest('/search/multi', {
      params: { query, page }
    });
    let results = response.data.results;
    // Apply content filtering to search results
    results = applyContentFilters(results);
    return { ...response.data, results };
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
};

/**
 * Get trending content
 * @param {string} mediaType - 'movie', 'tv', or 'all'
 * @param {string} timeWindow - 'day' or 'week'
 * @returns {Promise<object>} - Trending results
 */
export const getTrending = async (mediaType = 'all', timeWindow = 'week') => {
  // If no API token, return mock trending data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length
    };
  }

  try {
    const response = await apiRequest(`/trending/${mediaType}/${timeWindow}`);
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get trending:', error);
    throw error;
  }
};

/**
 * Get movie/TV show details
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} id - Movie/TV show ID
 * @returns {Promise<object>} - Details
 */
export const getDetails = async (mediaType, id) => {
  // If no API token, return mock movie details
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    return mockData.movieDetails[id] || mockData.movieDetails[1];
  }

  try {
    const response = await apiRequest(`/${mediaType}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get details:', error);
    throw error;
  }
};

/**
 * Get movie/TV show credits
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} id - Movie/TV show ID
 * @returns {Promise<object>} - Credits
 */
export const getCredits = async (mediaType, id) => {
  // If no API token, return mock credits
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    return mockData.credits[id] || mockData.credits[1];
  }

  try {
    const response = await apiRequest(`/${mediaType}/${id}/credits`);
    return response.data;
  } catch (error) {
    console.error('Failed to get credits:', error);
    throw error;
  }
};

/**
 * Get movie/TV show images
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} id - Movie/TV show ID
 * @returns {Promise<object>} - Images
 */
export const getImages = async (mediaType, id) => {
  // If no API token, return mock images
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    return mockData.images[id] || mockData.images[1];
  }

  try {
    const response = await apiRequest(`/${mediaType}/${id}/images`);
    return response.data;
  } catch (error) {
    console.error('Failed to get images:', error);
    throw error;
  }
};

/**
 * Get movie/TV show videos
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} id - Movie/TV show ID
 * @returns {Promise<object>} - Videos
 */
export const getVideos = async (mediaType, id) => {
  // If no API token, return mock videos
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    return mockData.videos[id] || mockData.videos[1];
  }

  try {
    const response = await apiRequest(`/${mediaType}/${id}/videos`);
    return response.data;
  } catch (error) {
    console.error('Failed to get videos:', error);
    throw error;
  }
};

/**
 * Discover movies/TV shows
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {object} params - Search parameters
 * @returns {Promise<object>} - Discover results
 */
export const discover = async (mediaType, params = {}) => {
  // If no API token, return mock discover results
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    // Handle the new category structure
    const discoverParams = {
      sort_by: 'popularity.desc',
      include_adult: false,
      ...params
    };

    // Handle vote_average_gte parameter
    if (params.vote_average_gte) {
      discoverParams['vote_average.gte'] = params.vote_average_gte;
    }

    // Handle sort_by parameter
    if (params.sort_by) {
      discoverParams.sort_by = params.sort_by;
    }
    
    // Handle year parameters
    if (params.primary_release_year) {
      discoverParams.primary_release_year = params.primary_release_year;
    }
    if (params.first_air_date_year) {
      discoverParams.first_air_date_year = params.first_air_date_year;
    }
    if (params.primary_release_date_gte) {
      discoverParams.primary_release_date_gte = params.primary_release_date_gte;
    }
    if (params.primary_release_date_lte) {
      discoverParams.primary_release_date_lte = params.primary_release_date_lte;
    }
    if (params.first_air_date_gte) {
      discoverParams.first_air_date_gte = params.first_air_date_gte;
    }
    if (params.first_air_date_lte) {
      discoverParams.first_air_date_lte = params.first_air_date_lte;
    }

    const response = await apiRequest(`/discover/${mediaType}`, {
      params: discoverParams
    });
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Discover failed:', error);
    throw error;
  }
};

/**
 * Get now playing movies
 * @returns {Promise<object>} - Now playing movies
 */
export const getNowPlaying = async () => {
  // If no API token, return mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    const response = await apiRequest('/movie/now_playing');
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get now playing movies:', error);
    throw error;
  }
};

/**
 * Get top rated movies/TV shows
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<object>} - Top rated content
 */
export const getTopRated = async (mediaType = 'movie') => {
  // If no API token, return mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    const response = await apiRequest(`/${mediaType}/top_rated`);
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get top rated:', error);
    throw error;
  }
};

/**
 * Get trending TV shows
 * @param {string} timeWindow - 'day' or 'week'
 * @returns {Promise<object>} - Trending TV shows
 */
export const getTrendingTV = async (timeWindow = 'week') => {
  // If no API token, return mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    const response = await apiRequest(`/trending/tv/${timeWindow}`);
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get trending TV:', error);
    throw error;
  }
};

/**
 * Get upcoming movies
 * @returns {Promise<object>} - Upcoming movies
 */
export const getUpcoming = async () => {
  // If no API token, return mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.trending.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    const response = await apiRequest('/movie/upcoming');
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get upcoming movies:', error);
    throw error;
  }
};

/**
 * Get popular movies/TV shows
 * @param {string} mediaType - 'movie' or 'tv'
 * @returns {Promise<object>} - Popular content
 */
export const getPopular = async (mediaType = 'movie') => {
  // If no API token, return mock data
  if (!API_TOKEN || API_TOKEN === 'your_tmdb_api_token_here') {
    let results = mockData.popular.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return {
      results,
      total_pages: 1,
      total_results: results.length,
      page: 1
    };
  }

  try {
    const response = await apiRequest(`/${mediaType}/popular`);
    let results = response.data.results;
    // The original code had a helper function for this, but it's removed.
    // For now, we'll just return the filtered results.
    // If a more robust filtering is needed, it should be re-added.
    return { ...response.data, results };
  } catch (error) {
    console.error('Failed to get popular:', error);
    throw error;
  }
};

export default apiClient; 