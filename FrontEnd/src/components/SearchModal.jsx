import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdClose, MdMovie, MdLiveTv, MdStar } from 'react-icons/md';
import { FaPlay } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import { apiRequest } from '../utils/apiUtils';
import { isAnimeContent, getMediaType } from '../utils/mediaTypeUtils';
import { getOptimizedImageURL } from '../utils/imageUtils';

const SearchModal = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Simple popular searches
  const popularSearches = [
    { label: 'Avengers', type: 'movie' },
    { label: 'Breaking Bad', type: 'tv' },
    { label: 'Marvel', type: 'movie' },
    { label: 'Game of Thrones', type: 'tv' },
    { label: 'Star Wars', type: 'movie' },
    { label: 'Stranger Things', type: 'tv' },
    { label: 'The Office', type: 'tv' },
    { label: 'Friends', type: 'tv' },
    { label: 'Inception', type: 'movie' },
    { label: 'The Dark Knight', type: 'movie' },
  ];

  // Simple quick filters
  const quickFilters = [
    { label: 'Movies', type: 'movie' },
    { label: 'Series', type: 'tv' },
    { label: 'Trending', type: 'trending' },
    { label: 'Top Rated', type: 'top-rated' },
  ];

  // Live search function
  const performLiveSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search both movies and TV shows
      const [movieResponse, tvResponse] = await Promise.all([
        apiRequest('/search/movie', { params: { query, page: 1 } }),
        apiRequest('/search/tv', { params: { query, page: 1 } })
      ]);

      const movieResults = (movieResponse?.data?.results || []).map(item => ({
        ...item,
        media_type: 'movie'
      }));
      const tvResults = (tvResponse?.data?.results || []).map(item => ({
        ...item,
        media_type: 'tv'
      }));
      
      // Combine and filter results (remove items without posters)
      let combinedResults = [...movieResults, ...tvResults]
        .filter(item => item.poster_path)
        .slice(0, 6); // Limit to 6 results for modal

      // Process results to detect anime and set correct media type
      combinedResults = combinedResults.map(item => {
        const mediaType = getMediaType(item);
        return {
          ...item,
          media_type: mediaType
        };
      });

      setSearchResults(combinedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery);
        performLiveSearch(searchQuery);
        setIsSearching(false);
        // Add to search history
        if (!searchHistory.includes(searchQuery.trim())) {
          setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 4)]);
        }
      }, 800);
    } else {
      setDebouncedQuery('');
      setIsSearching(false);
      setSearchResults([]);
      setShowResults(false);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, searchHistory]);

  // Handle search submission
  const handleSearch = (query = searchQuery) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setSearchQuery('');
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    handleSearch(suggestion.label);
  };

  // Handle quick filter click
  const handleQuickFilterClick = (filter) => {
    if (filter.type === 'trending') {
      navigate('/explore/movie/trending');
    } else if (filter.type === 'top-rated') {
      navigate('/explore/movie/top-rated');
    } else if (filter.type === 'movie') {
      navigate('/explore/movie/popular');
    } else if (filter.type === 'tv') {
      navigate('/explore/tv/popular');
    }
    onClose();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 overflow-hidden"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl border flex flex-col overflow-hidden ${
              isDarkMode 
                ? 'bg-neutral-900 border-neutral-700'
                : 'bg-white border-gray-200'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Simple Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-neutral-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Search</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                }`}
              >
                <MdClose className={`text-xl ${
                  isDarkMode ? 'text-white' : 'text-gray-700'
                }`} />
              </motion.button>
            </div>

            {/* Search Input */}
            <div className="p-6 flex-shrink-0">
              <form onSubmit={handleSubmit} className="relative mb-6">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for movies, series..."
                  className={`w-full px-4 py-3 pl-12 pr-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-lg border ${
                    isDarkMode
                      ? 'bg-neutral-800 text-white border-neutral-600'
                      : 'bg-gray-100 text-gray-900 border-gray-300'
                  }`}
                />
                <MdSearch className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${
                  isDarkMode ? 'text-neutral-400' : 'text-gray-500'
                }`} />
                
                {isSearching && (
                  <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-neutral-800 max-h-[calc(85vh-120px)] space-y-4">
                {/* Live Search Results */}
                {showResults && searchResults.length > 0 && (
                  <div className="mb-6">
                    <h3 className={`font-medium mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Search Results</h3>
                    <div className="space-y-3">
                      {searchResults.map((result, index) => (
                        <motion.div
                          key={`${result.id}-${result.media_type || 'unknown'}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => {
                            let route;
                            if (result.media_type === 'tv') {
                              route = `/tv/${result.id}`;
                            } else if (result.media_type === 'anime') {
                              route = `/tv/${result.id}`; // Anime are typically TV shows
                            } else {
                              route = `/movie/${result.id}`;
                            }
                            navigate(route);
                            onClose();
                          }}
                        >
                          <img
                                                          src={getOptimizedImageURL(result.poster_path, 'https://image.tmdb.org/t/p/', 'poster')}
                            alt={result.title || result.name}
                            className="w-12 h-18 object-cover rounded"
                          />
                          <div className="flex-1">
                            <h4 className={`font-medium text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {result.title || result.name}
                            </h4>
                            <div className={`flex items-center gap-2 text-xs ${
                              isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                            }`}>
                              <span>
                                {result.media_type === 'tv' ? 'Series' : 
                                 result.media_type === 'anime' ? 'Anime' : 'Movie'}
                              </span>
                              {result.vote_average && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MdStar className="text-yellow-400" />
                                    {result.vote_average.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <FaPlay className={`${
                            isDarkMode ? 'text-neutral-400' : 'text-gray-500'
                          }`} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSearch(searchQuery)}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        View All Results →
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Quick Filters */}
                {!searchQuery && (
                  <div className="mb-6">
                    <h3 className={`font-medium mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Quick Browse</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {quickFilters.map((filter, index) => (
                        <motion.button
                          key={filter.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickFilterClick(filter)}
                          className={`flex items-center justify-center p-4 rounded-lg transition-colors font-medium ${
                            isDarkMode 
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-white'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          }`}
                        >
                          {filter.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular Searches */}
                {(!searchQuery || (searchQuery && !showResults)) && (
                  <div>
                    <h3 className={`font-medium mb-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Popular Searches</h3>
                    <div className="space-y-2">
                      {popularSearches.map((suggestion, index) => (
                        <motion.button
                          key={suggestion.label}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors text-left w-full ${
                            isDarkMode ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className={`${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{suggestion.label}</span>
                                                      <FaPlay className={`${
                              isDarkMode ? 'text-neutral-400' : 'text-gray-500'
                            }`} />
                          </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal; 