import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, Bookmark, Heart, Share2, Eye, X, CheckCircle, EyeOff, Clock, Settings } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { toast } from 'react-hot-toast';
import { getMediaType } from '../utils/mediaTypeUtils';

const WatchlistModal = ({ 
  isOpen, 
  onClose, 
  movie, 
  title = 'Update Status' 
}) => {
  const { 
    addToWatchlist, 
    removeFromWatchlist, 
    isInWatchlist, 
    getWatchlistStatus, 
    toggleSeriesCompletion, 
    toggleFavourite, 
    isFavourite 
  } = useWatchlist();

  // Early return if no movie data or movie is invalid
  if (!movie || !movie.id) return null;

  const mediaType = getMediaType(movie);
  const isInUserWatchlist = isInWatchlist(movie?.id, mediaType);
  const currentWatchlistStatus = getWatchlistStatus(movie?.id, mediaType);
  const isUserFavourite = isFavourite(movie?.id, mediaType);

  const handleWatchlistStatus = async (status) => {
    try {
      // Ensure the movie object has the correct media_type for watchlist
      const watchlistMovie = {
        ...movie,
        media_type: mediaType
      };
      
      await addToWatchlist(watchlistMovie, status);
      onClose();
      toast.success(`${isInUserWatchlist ? 'Updated to' : 'Added to'} ${getStatusLabel(status)}`);
    } catch (error) {
      console.error('Error updating watchlist status:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const handleSeriesCompletionToggle = () => {
    try {
      toggleSeriesCompletion(movie?.id, mediaType);
      onClose();
      const currentStatus = getWatchlistStatus(movie?.id, mediaType);
      if (currentStatus === WATCHLIST_STATUS.COMPLETED) {
        toast.success('Series marked as unwatched');
      } else {
        toast.success('All episodes marked as watched');
      }
    } catch (error) {
      console.error('Error toggling series completion:', error);
      toast.error('Failed to update series status');
    }
  };

  const handleFavouriteToggle = () => {
    try {
      toggleFavourite(movie?.id, mediaType);
      if (isUserFavourite) {
        toast.success('Removed from favourites');
      } else {
        toast.success('Added to favourites');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      toast.error('Failed to update favourites');
    }
  };

  const getStatusLabel = (status) => {
    const statusConfig = {
      [WATCHLIST_STATUS.PLAN_TO_WATCH]: 'Plan to Watch',
      [WATCHLIST_STATUS.WATCHING]: 'Watching',
      [WATCHLIST_STATUS.COMPLETED]: 'Completed',
      [WATCHLIST_STATUS.DROPPED]: 'Dropped'
    };
    return statusConfig[status] || status;
  };

  // Early return if modal is not open or no movie data
  if (!isOpen || !movie || !movie.id) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="bg-white/10 hover:bg-white/20 w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300"
              >
                <X className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-white mb-2">
                {movie?.title || movie?.name}
              </h3>
              <p className="text-white/60 text-sm">
                Choose a new status for this item
              </p>
            </div>

            <div className="space-y-3">
              {[
                { status: WATCHLIST_STATUS.PLAN_TO_WATCH, label: 'Plan to Watch', icon: Clock },
                { status: WATCHLIST_STATUS.WATCHING, label: 'Watching', icon: Play },
                { status: WATCHLIST_STATUS.COMPLETED, label: 'Completed', icon: CheckCircle },
                { status: WATCHLIST_STATUS.DROPPED, label: 'Dropped', icon: EyeOff }
              ].map((option) => (
                <motion.button
                  key={option.status}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWatchlistStatus(option.status)}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    currentWatchlistStatus === option.status
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <option.icon className="w-5 h-5" />
                    <span className="font-semibold">{option.label}</span>
                    {currentWatchlistStatus === option.status && (
                      <CheckCircle className="w-5 h-5 ml-auto" />
                    )}
                  </div>
                </motion.button>
              ))}
              
              {/* Favourite Toggle */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFavouriteToggle}
                className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                  isUserFavourite
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-5 h-5 ${isUserFavourite ? 'fill-current' : ''}`} />
                  <span className="font-semibold">
                    {isUserFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                  </span>
                  {isUserFavourite && (
                    <CheckCircle className="w-5 h-5 ml-auto" />
                  )}
                </div>
              </motion.button>

              {/* Series Completion Toggle for TV/Anime Series Only */}
              {(mediaType === 'tv' || mediaType === 'anime') && (movie?.number_of_episodes || movie?.episode_count) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSeriesCompletionToggle}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 ${
                    currentWatchlistStatus === WATCHLIST_STATUS.COMPLETED
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {currentWatchlistStatus === WATCHLIST_STATUS.COMPLETED ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {currentWatchlistStatus === WATCHLIST_STATUS.COMPLETED 
                        ? 'Mark All Episodes as Unwatched' 
                        : 'Mark All Episodes as Watched'
                      }
                    </span>
                    {currentWatchlistStatus === WATCHLIST_STATUS.COMPLETED && (
                      <CheckCircle className="w-5 h-5 ml-auto" />
                    )}
                  </div>
                </motion.button>
              )}
              
              {/* Remove from Watchlist Button */}
              {isInUserWatchlist && (
                <div className="border-t border-white/20 pt-3 mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      removeFromWatchlist(movie.id, mediaType);
                      onClose();
                      toast.success('Removed from watchlist');
                    }}
                    className="w-full p-4 rounded-2xl text-left transition-all duration-300 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5" />
                      <span className="font-semibold">Remove from Watchlist</span>
                    </div>
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WatchlistModal; 