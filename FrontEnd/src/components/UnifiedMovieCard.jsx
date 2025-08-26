import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Bookmark, Heart, Share2, Eye, X, CheckCircle, EyeOff, Clock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWatchlist } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import moment from 'moment';
import { getMediaType } from '../utils/mediaTypeUtils';
import { getBestPoster } from '../utils/imageUtils';
import WatchlistModal from './WatchlistModal';

const UnifiedMovieCard = ({ movie, index, size = 'medium' }) => {
  const { isDarkMode } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const navigate = useNavigate();
  const { isInWatchlist, isFavourite, getWatchlistStatus } = useWatchlist();



  const { imageURL } = useSelector((state) => state.movieoData);

  const title = movie?.title || movie?.name || 'Untitled';
  const releaseDate = movie?.release_date || movie?.first_air_date;
  const rating = movie?.vote_average ? Number(movie.vote_average).toFixed(1) : 'N/A';
  

  
  // Check for content-specific custom images first, then fallback to original
  // Determine media type using centralized function
  const mediaType = React.useMemo(() => {
    return getMediaType(movie);
  }, [movie]);
  
  // Memoize poster path calculation to prevent unnecessary recalculations
  const posterPath = useMemo(() => {
    return getBestPoster(movie.id, movie?.poster_path, 'https://image.tmdb.org/t/p/', mediaType);
  }, [movie.id, mediaType, movie?.poster_path]);
  
  if (!posterPath) return null;

  const overview = movie?.overview || 'No description available.';

  const getRatingColor = (rating) => {
    const num = parseFloat(rating);
    if (num >= 8) return 'text-emerald-400';
    if (num >= 6) return 'text-amber-400';
    if (num >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  // Memoize watchlist status to prevent unnecessary re-renders
  const isInUserWatchlist = React.useMemo(() => isInWatchlist(movie.id, mediaType), [isInWatchlist, movie.id, mediaType]);
  const currentWatchlistStatus = React.useMemo(() => getWatchlistStatus(movie.id, mediaType), [getWatchlistStatus, movie.id, mediaType]);
  const isUserFavourite = React.useMemo(() => isFavourite(movie.id, mediaType), [isFavourite, movie.id, mediaType]);

  // Enhanced size configurations with consistent sizing
  const sizeConfig = {
    small: {
      cardWidth: 'w-38',
      aspectRatio: 'aspect-[2/3]',
      titleSize: 'text-sm',
      ratingSize: 'text-xs',
      iconSize: 14,
      buttonSize: 'w-6 h-6',
      padding: 'p-2',
      gap: 'gap-2'
    },
    medium: {
      cardWidth: 'w-50',
      aspectRatio: 'aspect-[2/3]',
      titleSize: 'text-sm',
      ratingSize: 'text-xs',
      iconSize: 16,
      buttonSize: 'w-7 h-7',
      padding: 'p-3',
      gap: 'gap-2'
    },
    large: {
      cardWidth: 'w-60',
      aspectRatio: 'aspect-[2/3]',
      titleSize: 'text-base',
      ratingSize: 'text-sm',
      iconSize: 18,
      buttonSize: 'w-8 h-8',
      padding: 'p-4',
      gap: 'gap-2'
    },
    list: {
      cardWidth: 'w-full',
      aspectRatio: 'aspect-[3/1]',
      titleSize: 'text-lg',
      ratingSize: 'text-sm',
      iconSize: 18,
      buttonSize: 'w-8 h-8',
      padding: 'p-4',
      gap: 'gap-3'
    }
  };

  const config = sizeConfig[size];

  // No spring animation - using CSS transitions for better performance

  const handleCardClick = () => {
    // Use unified navigation - anime content goes to movie/tv routes based on original media_type
    if (mediaType === 'anime') {
      // For anime content, determine the appropriate route based on the data structure
      // Check if it has TV-specific properties to determine if it's a series
      const isTVSeries = movie.first_air_date || movie.number_of_episodes || movie.episode_count;
      const routeType = isTVSeries ? 'tv' : 'movie';
      navigate(`/${routeType}/${movie.id}`);
    } else {
      navigate(`/${mediaType}/${movie.id}`);
    }
  };

  const handleWatchlistToggle = (e) => {
    e.stopPropagation();
    setShowWatchlistModal(true);
  };

  const handleFavouriteToggle = (e) => {
    e.stopPropagation();
    setShowWatchlistModal(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }}
      className="relative group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
        {/* Enhanced Single-Sided Card Design */}
        <div 
          className={`movie-card relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 cursor-pointer h-full ${config.cardWidth} border border-gray-700/50 ${
            size === 'list' ? 'flex' : ''
          }`}
          onClick={handleCardClick}
        >
          {/* Poster Image with Enhanced Effects */}
          <div className={`relative ${size === 'list' ? 'w-32 h-48 flex-shrink-0' : config.aspectRatio} overflow-hidden`}>
            {posterPath ? (
              <img
                src={posterPath}
                alt={title}
                className={`w-full h-full object-cover transition-all duration-200 ease-out ${
                  isHovered ? 'scale-110 brightness-110' : 'scale-100 brightness-100'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <div className="text-gray-500 text-center">
                  <div className="text-3xl mb-2">🎬</div>
                  <div className="text-xs">No Image</div>
                </div>
              </div>
            )}
            
            {/* Loading Skeleton */}
            {!imageLoaded && posterPath && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse" />
            )}

            {/* Enhanced Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
            
            {/* Top Badge with Enhanced Design */}
            <div className={`absolute top-3 left-3 flex items-center ${config.gap}`}>
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                #{index + 1}
              </div>
            </div>

            {/* Watchlist and Favourite Buttons */}
            <div className={`absolute top-3 right-3 flex items-center gap-2 z-20`}>
              {/* Favourite Button */}
              <motion.button
                className={`bg-black/70 backdrop-blur-md ${config.buttonSize} flex items-center justify-center rounded-full border border-white/30 hover:border-white/60 z-20 transition-all duration-200 cursor-pointer`}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.8)' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFavouriteToggle}
                style={{ pointerEvents: 'auto' }}
              >
                <Heart className={`${isUserFavourite ? 'text-red-500 fill-current' : 'text-white'}`} size={config.iconSize} />
              </motion.button>

              {/* Watchlist Button */}
              <motion.button
                className={`bg-black/70 backdrop-blur-md ${config.buttonSize} flex items-center justify-center rounded-full border border-white/30 hover:border-white/60 z-20 transition-all duration-200 cursor-pointer`}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(0,0,0,0.8)' }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWatchlistToggle}
                style={{ pointerEvents: 'auto' }}
              >
                {isInUserWatchlist ? (
                  <Bookmark className="text-yellow-400" size={config.iconSize} />
                ) : (
                  <Bookmark className="text-white" size={config.iconSize} />
                )}
              </motion.button>
            </div>

            {/* Play Button Overlay - Removed for cleaner design */}
          </div>

          {/* Enhanced Bottom Info */}
          {size === 'list' ? (
            <div className={`flex-1 ${config.padding} z-10`}>
              <div className="space-y-3">
                {/* Title and Media Type */}
                <div>
                  <h3 className={`font-bold ${config.titleSize} leading-tight line-clamp-2 drop-shadow-lg mb-2 text-white`}>
                    {title}
                  </h3>
                  <span className={`text-xs uppercase font-medium tracking-wider text-white/70`}>
                    {mediaType}
                  </span>
                </div>

                {/* Rating and Year */}
                <div className={`flex items-center gap-3`}>
                  <div className={`flex items-center gap-1 ${getRatingColor(rating)} bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full`}>
                    <Star size={config.iconSize} className="fill-current" />
                    <span className={`${config.ratingSize} font-bold text-white`}>{rating}</span>
                  </div>
                  {releaseDate && (
                    <span className={`text-sm px-3 py-1 rounded-full text-white/80 bg-black/50 backdrop-blur-sm`}>
                      {moment(releaseDate && releaseDate.length > 10 ? releaseDate.slice(0, 10) : releaseDate).format("YYYY")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`absolute bottom-0 left-0 right-0 ${config.padding} z-10`}>
              <div className="space-y-2">
                {/* Rating and Year with Enhanced Design */}
                <div className={`flex items-center justify-between ${config.gap}`}>
                  <div className={`flex items-center gap-1 ${getRatingColor(rating)} bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full`}>
                    <Star size={config.iconSize} className="fill-current" />
                    <span className={`${config.ratingSize} font-bold text-white`}>{rating}</span>
                  </div>
                  {releaseDate && (
                    <span className={`text-xs px-2 py-1 rounded-full text-white/80 bg-black/50 backdrop-blur-sm`}>
                      {moment(releaseDate && releaseDate.length > 10 ? releaseDate.slice(0, 10) : releaseDate).format("YYYY")}
                    </span>
                  )}
                </div>

                {/* Enhanced Title */}
                <h3 className={`font-bold ${config.titleSize} leading-tight line-clamp-2 drop-shadow-lg text-white`}>
                  {title}
                </h3>

                {/* Enhanced Media Type */}
                <span className={`text-xs uppercase font-medium tracking-wider text-white/70`}>
                  {mediaType}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Watchlist Modal */}
        <WatchlistModal
          isOpen={showWatchlistModal}
          onClose={() => setShowWatchlistModal(false)}
          movie={movie}
        />
      </motion.div>
    );
  };

export default UnifiedMovieCard;