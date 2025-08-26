import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Search, Filter, Grid3X3, List, ArrowUp, ArrowDown, 
  Star, TrendingUp, Flame, Clock, Play, Heart, Bookmark
} from 'lucide-react';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import { CustomSkeletonLoader, FullScreenLoader } from '../components/EnhancedLoader';
import Breadcrumb from '../components/Breadcrumb';
import { useTheme } from '../contexts/ThemeContext';
import { searchMulti, apiRequest } from '../utils/apiUtils';
import { applyContentFilters } from '../utils/contentFilter.js';
import { getMediaType } from '../utils/mediaTypeUtils';
import { getOptimizedImageURL } from '../utils/imageUtils';

const SearchPage = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalResults, setTotalResults] = useState(0)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('relevance') // 'relevance', 'rating', 'date', 'title'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc' or 'desc'
  const [showFilters, setShowFilters] = useState(false)
  const [mediaType, setMediaType] = useState('all') // 'all', 'movie', 'tv', 'person'
  const [yearFilter, setYearFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  const query = location?.search?.slice(3)

  // Spring animations
  const pageSpring = {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 300, friction: 30 }
  };

  const fetchData = useCallback(async () => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/search/multi', {
        params: {
          query: query,
          page: page,
          include_adult: false,
          language: 'en-US'
        }
      })
      
      const results = response.data.results || [];
      
      // First apply content filtering to remove adult/sexual content using user settings
      const filteredResults = applyContentFilters(results);
      
      // Process the data to add correct media_type based on Animation genre
      const processedResults = filteredResults.map(item => {
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
      
      const finalResults = processedResults.filter(item => 
        (mediaType === 'all' || item.media_type === mediaType) &&
        (yearFilter === 'all' || 
          (item.release_date && item.release_date.startsWith(yearFilter)) ||
          (item.first_air_date && item.first_air_date.startsWith(yearFilter))
        ) &&
        (ratingFilter === 'all' || 
          (item.vote_average && parseFloat(item.vote_average) >= parseFloat(ratingFilter))
        )
      );

      setData(prev => page === 1 ? finalResults : [...prev, ...finalResults])
      setTotalPages(response.data.total_pages)
      setTotalResults(response.data.total_results)
      
      // Populate anime cards for header dropdown
      const animeCards = finalResults.filter(item => item.media_type === 'anime');
      if (animeCards.length > 0) {
        // Merge with existing anime cards or replace them
        const existingAnimeCards = window.animeCards || [];
        const allAnimeCards = [...existingAnimeCards, ...animeCards];
        
        // Remove duplicates based on id
        const uniqueAnimeCards = allAnimeCards.filter((card, index, self) => 
          index === self.findIndex(c => c.id === card.id)
        );
        
        window.animeCards = uniqueAnimeCards;
      }
      
      if (page === 1 && finalResults.length === 0) {
        toast.error('No results found for your search criteria');
      }
    } catch (error) {
      setError('Failed to fetch search results');
      toast.error('Failed to load search results');
      console.error('error', error)
    } finally {
      setLoading(false);
    }
  }, [query, page, mediaType, yearFilter, ratingFilter])

  useEffect(() => {
    if (query) {
      setPage(1)
      setData([])
      fetchData()
    }
  }, [location?.search, mediaType, yearFilter, ratingFilter])

  const handleScroll = useCallback(() => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200 && 
        !loading && 
        query && 
        page < totalPages) {
      setPage(prev => prev + 1)
    }
  }, [loading, query, page, totalPages])

  useEffect(() => {
    if (query && page > 1) {
      fetchData()
    }
  }, [page, fetchData])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const sortResults = (results) => {
    if (sortBy === 'relevance') return results;
    
    return [...results].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.vote_average || 0;
          bValue = b.vote_average || 0;
          break;
        case 'date':
          aValue = a.release_date || a.first_air_date || '';
          bValue = b.release_date || b.first_air_date || '';
          break;
        case 'title':
          aValue = (a.title || a.name || '').toLowerCase();
          bValue = (b.title || b.name || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedData = sortResults(data);

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1900; year--) {
      years.push(year.toString());
    }
    return years;
  };

  if (loading && page === 1) {
    return <FullScreenLoader text="Searching..." />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`min-h-screen pt-20 transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}
    >
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Breadcrumb />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-6">
            <div>
              <h1 className={`text-3xl lg:text-4xl font-bold mb-2 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Search Results
              </h1>
              {query && (
                <p className={`text-lg ${
                  isDarkMode ? 'text-white/60' : 'text-gray-600'
                }`}>
                  Found {totalResults} results for "{decodeURIComponent(query)}"
                </p>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className={`flex rounded-lg p-1 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-red-600 text-white' 
                      : isDarkMode
                        ? 'text-white/60 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-red-600 text-white' 
                      : isDarkMode
                        ? 'text-white/60 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Sort Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
    <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`backdrop-blur-md rounded-xl p-6 mb-8 border ${
                isDarkMode 
                  ? 'bg-white/5 border-white/10'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Media Type Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Media Type
                  </label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Types</option>
                    <option value="movie">Movies</option>
                    <option value="tv">TV Shows</option>
                    <option value="person">People</option>
                  </select>
                </div>

                {/* Year Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Year
                  </label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">All Years</option>
                    {getYearOptions().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Minimum Rating
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      isDarkMode
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="all">Any Rating</option>
                    <option value="8">8+ Stars</option>
                    <option value="7">7+ Stars</option>
                    <option value="6">6+ Stars</option>
                    <option value="5">5+ Stars</option>
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-white/80' : 'text-gray-700'
                  }`}>
                    Sort By
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        isDarkMode
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="relevance">Relevance</option>
                      <option value="rating">Rating</option>
                      <option value="date">Release Date</option>
                      <option value="title">Title</option>
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {sortOrder === 'asc' ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Bar for Mobile */}
      <motion.div 
          className='lg:hidden mb-6'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className='relative'>
          <input
            type='text'
              placeholder='Search movies, TV shows, people...'
              onChange={(e) => navigate(`/search?q=${encodeURIComponent(e.target.value)}`)}
              value={query ? decodeURIComponent(query) : ''}
              className='px-4 py-3 text-lg w-full bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500 pl-12 placeholder-white/50'
            />
            <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5' />
        </div>
      </motion.div>

        {/* Error State */}
        {error && (
          <motion.div 
            className='bg-red-500/20 border border-red-500/50 text-red-400 py-6 px-4 rounded-xl text-center mb-8'
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className='text-4xl mb-2'>⚠️</div>
            <p className='text-lg font-medium'>{error}</p>
            <p className='text-sm mt-2'>Please try again later</p>
          </motion.div>
        )}

        {/* Empty State */}
        {(!data || data.length === 0) && !loading && !error && (
          <motion.div 
            className='text-center py-16'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className='text-8xl mb-6'>🔍</div>
            <h3 className='text-2xl font-bold text-white mb-4'>No Results Found</h3>
            <p className='text-white/60 text-lg mb-6'>
              Try adjusting your search criteria or filters
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Adjust Filters
            </motion.button>
          </motion.div>
        )}

        {/* Results Grid/List */}
        {data.length > 0 && (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              >
                <AnimatePresence>
                  {sortedData
                    .filter(item => {
                      // Filter out items without poster images
                      const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
                      const contentPosterPath = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                      if (contentPosterPath) return true;
                      if (item?.poster_path) return true;
                      return false;
                    })
                    .map((item, index) => (
                      <UnifiedMovieCard 
                        key={item.id} 
                        movie={item} 
                        index={index} 
                        size="medium"
                      />
                    ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                {sortedData
                  .filter(item => {
                    // Filter out items without poster images
                    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
                    const contentPosterPath = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                    if (contentPosterPath) return true;
                    if (item?.poster_path) return true;
                    return false;
                  })
                  .map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      onClick={() => navigate(`/${item.media_type || 'movie'}/${item.id}`)}
                      className={`backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 cursor-pointer ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Mobile Layout */}
                      <div className="block lg:hidden">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={(() => {
                                const mediaType = getMediaType(item);
                                const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                                if (contentPoster) return contentPoster;
                                return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                              })()}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-bold truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {item.title || item.name}
                              </h3>
                            </div>
                            <p className={`text-xs mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                              </div>
                              <span className={`${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                              }`}>
                                {item.release_date || item.first_air_date ? 
                                  new Date(item.release_date || item.first_air_date).getFullYear() : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tablet Layout */}
                      <div className="hidden lg:block xl:hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={(() => {
                                const mediaType = getMediaType(item);
                                const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                                if (contentPoster) return contentPoster;
                                return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                              })()}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-base font-bold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {item.title || item.name}
                              </h3>
                            </div>
                            <p className={`text-sm mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                              </div>
                              <span className={`${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                              }`}>
                                {item.release_date || item.first_air_date ? 
                                  new Date(item.release_date || item.first_air_date).getFullYear() : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden xl:flex items-center gap-4">
                        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={(() => {
                              const mediaType = getMediaType(item);
                              const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                              if (contentPoster) return contentPoster;
                              return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                            })()}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-lg font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            {item.title || item.name}
                          </h3>
                          </div>
                          <p className={`text-sm mb-2 line-clamp-1 ${
                            isDarkMode ? 'text-white/60' : 'text-gray-600'
                          }`}>
                            {item.overview}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            <span className={`${
                              isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                              {item.release_date || item.first_air_date ? 
                                new Date(item.release_date || item.first_air_date).getFullYear() : 
                                'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            )}
          </>
        )}

        {/* Loading Indicator */}
        {loading && (
          <motion.div 
            className='flex justify-center py-12'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <CustomSkeletonLoader count={6} />
          </motion.div>
        )}

        {/* End of Results */}
        {!loading && data.length > 0 && page >= totalPages && (
          <motion.div 
            className='text-center py-12 text-white/60'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className='text-4xl mb-4'>🎬</div>
            <p className='text-lg font-medium'>You've reached the end of results</p>
            <p className='text-sm mt-2'>Try adjusting your search criteria for more results</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default SearchPage