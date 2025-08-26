import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Star, Calendar, Users2, Award, Video, CheckCircle, Eye, Tv, Trophy, Settings } from 'lucide-react';
import { apiRequest } from '../utils/apiUtils';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const SeasonsPage = () => {
  const { isDarkMode } = useTheme();
  const { id, seasonNumber } = useParams();
  const navigate = useNavigate();
  const [seasonData, setSeasonData] = useState(null);
  const [seriesData, setSeriesData] = useState(null);
  const [allSeasons, setAllSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchedEpisodes, setWatchedEpisodes] = useState(new Set());
  const { addToWatchlist, isInWatchlist, updateWatchlistStatus, getEpisodeCount, getWatchlistStatus, toggleEpisodeWatched, setEpisodeCount, getEpisodeDistribution } = useWatchlist();
  const [showEpisodeCountModal, setShowEpisodeCountModal] = useState(false);
  const [episodeCountInput, setEpisodeCountInput] = useState('');

  // Get episode distribution for current series
  const episodeDistribution = getEpisodeDistribution(parseInt(id));

  const handleSetEpisodeCount = () => {
    const count = parseInt(episodeCountInput);
    if (count > 0 && count <= getTotalEpisodes()) {
      // Mark episodes as watched up to the specified count
      const episodeIds = [];
      for (let i = 1; i <= count; i++) {
        episodeIds.push(`episode_${seasonNumber}_${i}`);
      }
      
      // Save to localStorage
      localStorage.setItem(`season_${id}_${seasonNumber}_watched`, JSON.stringify(episodeIds));
      setWatchedEpisodes(new Set(episodeIds));
      
      // Update series episode count
      updateSeriesEpisodeCount(new Set(episodeIds));
      
      setShowEpisodeCountModal(false);
      setEpisodeCountInput('');
      toast.success(`Marked ${count} episodes as watched`);
    } else {
      toast.error(`Please enter a valid number between 1 and ${getTotalEpisodes()}`);
    }
  };

  const handleMarkAllAsWatched = () => {
    const allEpisodeIds = seasonData.episodes?.map((_, index) => 
      `episode_${seasonNumber}_${index + 1}`
    ) || [];
    
    // Save to localStorage
    localStorage.setItem(`season_${id}_${seasonNumber}_watched`, JSON.stringify(allEpisodeIds));
    setWatchedEpisodes(new Set(allEpisodeIds));
    
    // Update series episode count
    updateSeriesEpisodeCount(new Set(allEpisodeIds));
    
    toast.success(`All ${allEpisodeIds.length} episodes marked as watched`);
  };

  const handleRemoveAllWatched = () => {
    // Clear from localStorage
    localStorage.removeItem(`season_${id}_${seasonNumber}_watched`);
    setWatchedEpisodes(new Set());
    
    // Update series episode count
    updateSeriesEpisodeCount(new Set());
    
    toast.success('All episodes marked as unwatched');
  };

  useEffect(() => {
    const fetchSeasonData = async () => {
      setLoading(true);
      try {
        // Fetch season details and series details
        const [seasonResponse, seriesResponse] = await Promise.all([
          apiRequest(`/tv/${id}/season/${seasonNumber}`),
          apiRequest(`/tv/${id}`)
        ]);

        setSeasonData(seasonResponse.data);
        setSeriesData(seriesResponse.data);
        
        // Store series data for completion tracking
        localStorage.setItem(`series_${id}_data`, JSON.stringify(seriesResponse.data));
        
        // Get all seasons from the series data
        if (seriesResponse.data.seasons) {
          const filteredSeasons = seriesResponse.data.seasons.filter(
            s => s.season_number !== parseInt(seasonNumber)
          );
          setAllSeasons(filteredSeasons);
        }

        // Check if series is marked as completed in watchlist
        const isCompleted = isInWatchlist(parseInt(id), 'tv') && 
          getWatchlistStatus(parseInt(id), 'tv') === 'completed';
        
        if (isCompleted) {
          // If completed, mark all episodes as watched
          const allEpisodeIds = seasonResponse.data.episodes?.map((_, index) => 
            `episode_${seasonNumber}_${index + 1}`
          ) || [];
          setWatchedEpisodes(new Set(allEpisodeIds));
          localStorage.setItem(`season_${id}_${seasonNumber}_watched`, JSON.stringify(allEpisodeIds));
        } else {
          // Load watched episodes from localStorage
          const savedWatched = localStorage.getItem(`season_${id}_${seasonNumber}_watched`);
          if (savedWatched) {
            setWatchedEpisodes(new Set(JSON.parse(savedWatched)));
          }
        }
      } catch (error) {
        console.error('Error fetching season data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && seasonNumber) {
      fetchSeasonData();
    }
  }, [id, seasonNumber, isInWatchlist, getWatchlistStatus]);

  const handleEpisodeToggle = (episodeId, episodeNumber) => {
    // Check if series is completed - if so, clicking removes the episode from count
    const seriesStatus = getWatchlistStatus(parseInt(id), 'tv');
    const isSeriesCompleted = seriesStatus === WATCHLIST_STATUS.COMPLETED;
    
    // Use the correct episode ID format
    const correctEpisodeId = `episode_${seasonNumber}_${episodeNumber}`;
    
    // Use the new episode tracking system
    const isCurrentlyWatched = watchedEpisodes.has(correctEpisodeId);
    const newWatchedCount = toggleEpisodeWatched(parseInt(id), parseInt(seasonNumber), episodeNumber);
    
    // Update local state
    const newWatched = new Set(watchedEpisodes);
    if (isCurrentlyWatched) {
      newWatched.delete(correctEpisodeId);
    } else {
      newWatched.add(correctEpisodeId);
    }
    setWatchedEpisodes(newWatched);
    
    if (isSeriesCompleted && isCurrentlyWatched) {
      toast.success(`Episode ${episodeNumber} removed from watched count`);
    } else {
      toast.success(`Episode ${episodeNumber} ${isCurrentlyWatched ? 'removed from' : 'marked as'} watched (Total: ${newWatchedCount} episodes)`);
    }
  };

  const getWatchedCount = () => {
    // Get the actual count from localStorage to avoid discrepancies
    try {
      const savedWatched = localStorage.getItem(`season_${id}_${seasonNumber}_watched`);
      if (savedWatched) {
        const parsed = JSON.parse(savedWatched);
        return Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch (error) {
      console.error('Error getting watched count:', error);
    }
    return watchedEpisodes.size;
  };

  const getTotalEpisodes = () => {
    const total = seasonData?.episodes?.length || 0;
    return Math.max(total, 1); // Ensure minimum of 1 episode
  };

  const getTotalSeriesEpisodes = () => {
    if (!seriesData?.seasons) return 0;
    return seriesData.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
  };

  const updateSeriesEpisodeCount = (newWatched) => {
    // Calculate total watched episodes across all seasons
    let totalWatched = 0;
    
    // Get all season data from localStorage
    if (seriesData?.seasons) {
      seriesData.seasons.forEach(season => {
        const seasonWatched = localStorage.getItem(`season_${id}_${season.season_number}_watched`);
        if (seasonWatched) {
          try {
            const parsed = JSON.parse(seasonWatched);
            totalWatched += Array.isArray(parsed) ? parsed.length : 0;
          } catch (error) {
            console.error('Error parsing season watched data:', error);
          }
        }
      });
    }
    
    // Add current season's watched episodes
    totalWatched += newWatched.size;
    
    // Update watchlist with total episode count
    if (isInWatchlist(parseInt(id), 'tv')) {
      updateWatchlistStatus(parseInt(id), 'tv', 'watching', totalWatched);
    } else {
      // Add to watchlist if not already there
      const seriesItem = {
        id: parseInt(id),
        media_type: 'tv',
        title: seriesData?.name,
        poster_path: seriesData?.poster_path,
        backdrop_path: seriesData?.backdrop_path,
        overview: seriesData?.overview,
        vote_average: seriesData?.vote_average,
        release_date: seriesData?.first_air_date,
        genres: seriesData?.genres
      };
      addToWatchlist(seriesItem, 'watching', totalWatched);
    }
    
    return totalWatched;
  };

  if (loading) {
    return (
      <div className={`min-h-screen pt-20 transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className={`h-8 rounded mb-4 w-1/3 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-300'
            }`}></div>
            <div className={`h-64 rounded mb-8 ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-300'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!seasonData || !seriesData) {
    return (
      <div className={`min-h-screen pt-20 transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className={`text-2xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Season Not Found</h1>
            <p className={`mb-6 ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>The requested season could not be loaded.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/tv/${id}`)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Back to Series
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative min-h-[70vh] lg:min-h-[85vh] xl:min-h-[90vh] overflow-hidden"
        style={{ marginTop: '0' }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0">
          <img
            src={seasonData?.poster_path ? `https://image.tmdb.org/t/p/w1280${seasonData.poster_path}` : `https://picsum.photos/seed/${id}/1920/1080`}
            alt={seasonData?.name}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 ${
            isDarkMode 
              ? 'bg-gradient-to-t from-black via-black/50 to-transparent' 
              : 'bg-gradient-to-t from-black/80 via-black/40 to-transparent'
          }`} />
        </div>

                 {/* Hero Content */}
         <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-16 xl:py-20 h-full flex flex-col justify-end" style={{ paddingTop: '120px' }}>
          {/* Back Button - Positioned below header */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/tv/${id}`)}
            className={`absolute top-20 sm:top-24 left-4 sm:left-6 backdrop-blur-sm p-2 sm:p-3 rounded-full transition-colors z-20 ${
              isDarkMode 
                ? 'bg-black/50 hover:bg-black/70 text-white' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
            }`}
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>

          {/* Mobile Layout */}
          <div className="block lg:hidden" data-layout="mobile">
            <div className="flex flex-col gap-6">
              <div className="w-40 h-60 rounded-2xl overflow-hidden mx-auto shadow-2xl">
                <img
                  src={seasonData?.poster_path ? `https://image.tmdb.org/t/p/original${seasonData.poster_path}` : `https://picsum.photos/seed/${id}/400/600`}
                  alt={seasonData?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
                  {seasonData.name}
                </h1>
                <p className="text-white/90 text-sm mb-4 line-clamp-3 drop-shadow-md">
                  {seasonData.overview || 'No description available.'}
                </p>
                
                {/* Episode Progress - Mobile */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-green-600 p-2 rounded-full">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">
                        {getWatchedCount()} / {getTotalEpisodes()} Episodes
                      </div>
                      <div className="text-white/60 text-xs">
                        {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' 
                          ? 'All episodes watched (Series completed)' 
                          : 'Watched'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' && (
                    <div className="flex items-center justify-center gap-2 bg-green-600/20 border border-green-600/30 px-3 py-2 rounded-full">
                      <Trophy className="w-3 h-3 text-green-400" />
                      <span className="text-green-400 text-xs font-medium">Series Completed</span>
                    </div>
                  )}

                  {/* Quick Action Buttons - Mobile */}
                  <div className="flex flex-col gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEpisodeCountModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Settings className="w-3 h-3" />
                      Manage Episodes
                    </motion.button>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMarkAllAsWatched}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm flex-1"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Mark All
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleRemoveAllWatched}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm flex-1"
                      >
                        <Eye className="w-3 h-3" />
                        Clear All
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Episode Distribution - Mobile */}
                {episodeDistribution.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2 text-sm">Episode Distribution:</h4>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {episodeDistribution.map((dist, index) => (
                        <div key={index} className="bg-white/10 px-2 py-1 rounded-full text-xs">
                          <span className="text-white">S{dist.season_number}: </span>
                          <span className="text-green-400">{dist.episodes_watched}/{dist.total_episodes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tablet Layout */}
          <div className="hidden lg:block xl:hidden" data-layout="tablet">
            <div className="flex items-end gap-6">
              <div className="w-48 h-72 rounded-xl overflow-hidden flex-shrink-0 shadow-2xl">
                <img
                  src={seasonData?.poster_path ? `https://image.tmdb.org/t/p/original${seasonData.poster_path}` : `https://picsum.photos/seed/${id}/400/600`}
                  alt={seasonData?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {seasonData.name}
                </h1>
                <p className="text-white/70 text-base mb-6 line-clamp-3">
                  {seasonData.overview || 'No description available.'}
                </p>
               
                {/* Episode Progress - Tablet */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-600 p-2 rounded-full">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-semibold">
                        {getWatchedCount()} / {getTotalEpisodes()} Episodes
                      </div>
                      <div className="text-white/60 text-sm">
                        {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' 
                          ? 'All episodes watched (Series completed)' 
                          : 'Watched'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' && (
                    <div className="flex items-center gap-2 bg-green-600/20 border border-green-600/30 px-3 py-2 rounded-full">
                      <Trophy className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm font-medium">Series Completed</span>
                    </div>
                  )}

                  {/* Quick Action Buttons - Tablet */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowEpisodeCountModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                    >
                      <Settings className="w-4 h-4" />
                      Manage
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllAsWatched}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark All
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRemoveAllWatched}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Clear All
                    </motion.button>
                  </div>
                </div>

                {/* Episode Distribution - Tablet */}
                {episodeDistribution.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-white font-medium mb-2">Episode Distribution:</h4>
                    <div className="flex flex-wrap gap-2">
                      {episodeDistribution.map((dist, index) => (
                        <div key={index} className="bg-white/10 px-3 py-1 rounded-full text-sm">
                          <span className="text-white">Season {dist.season_number}: </span>
                          <span className="text-green-400">{dist.episodes_watched}/{dist.total_episodes}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

                     {/* Desktop Layout */}
           <div className="hidden xl:flex items-end gap-8 w-full" data-layout="desktop">
             <div className="w-56 h-80 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl">
               <img
                 src={seasonData?.poster_path ? `https://image.tmdb.org/t/p/original${seasonData.poster_path}` : `https://picsum.photos/seed/${id}/400/600`}
                 alt={seasonData?.name}
                 className="w-full h-full object-cover"
               />
             </div>

             <div className="flex-1">
               <h1 className="text-4xl xl:text-5xl font-bold text-white mb-4">
                 {seasonData.name}
               </h1>
               <p className="text-white/70 text-lg xl:text-xl mb-6 line-clamp-4">
                 {seasonData.overview || 'No description available.'}
               </p>
               
               {/* Episode Progress - Desktop */}
               <div className="flex items-center gap-8">
                 <div className="flex items-center gap-3">
                   <div className="bg-green-600 p-3 rounded-full">
                     <CheckCircle className="w-6 h-6 text-white" />
                   </div>
                   <div>
                     <div className="text-white font-semibold text-lg xl:text-xl">
                       {getWatchedCount()} / {getTotalEpisodes()} Episodes
                     </div>
                     <div className="text-white/60 text-base">
                       {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' 
                         ? 'All episodes watched (Series completed)' 
                         : 'Watched'
                       }
                     </div>
                   </div>
                 </div>
                 
                 {isInWatchlist(parseInt(id), 'tv') && getWatchlistStatus(parseInt(id), 'tv') === 'completed' && (
                   <div className="flex items-center gap-3 bg-green-600/20 border border-green-600/30 px-4 py-3 rounded-full">
                     <Trophy className="w-5 h-5 text-green-400" />
                     <span className="text-green-400 text-base font-medium">Series Completed</span>
                   </div>
                 )}

                 {/* Quick Action Buttons - Desktop */}
                 <div className="flex items-center gap-3">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => setShowEpisodeCountModal(true)}
                     className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors text-base"
                   >
                     <Settings className="w-5 h-5" />
                     Manage Episodes
                   </motion.button>
                   
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleMarkAllAsWatched}
                     className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors text-base"
                   >
                     <CheckCircle className="w-5 h-5" />
                     Mark All
                   </motion.button>
                   
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={handleRemoveAllWatched}
                     className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors text-base"
                   >
                     <Eye className="w-5 h-5" />
                     Clear All
                   </motion.button>
                 </div>
               </div>

               {/* Episode Distribution - Desktop */}
               {episodeDistribution.length > 0 && (
                 <div className="mt-6">
                   <h4 className="text-white font-medium mb-3 text-lg">Episode Distribution:</h4>
                   <div className="flex flex-wrap gap-3">
                     {episodeDistribution.map((dist, index) => (
                       <div key={index} className="bg-white/10 px-4 py-2 rounded-full text-base">
                         <span className="text-white">Season {dist.season_number}: </span>
                         <span className="text-green-400">{dist.episodes_watched}/{dist.total_episodes}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 lg:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 lg:mb-12">
          <h2 className={`text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Episodes</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className={`backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border ${
              isDarkMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-gray-100 border-gray-200'
            }`}>
              <span className={`text-xs sm:text-sm ${
                isDarkMode ? 'text-white/80' : 'text-gray-600'
              }`}>Progress: </span>
              <span className={`font-medium text-sm sm:text-base ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{getWatchedCount()}/{getTotalEpisodes()}</span>
            </div>
            {getWatchedCount() > 0 && (
              <div className={`backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border ${
                isDarkMode 
                  ? 'bg-green-500/20 border-green-500/30' 
                  : 'bg-green-100 border-green-200'
              }`}>
                <span className={`text-xs sm:text-sm font-medium ${
                  isDarkMode ? 'text-green-400' : 'text-green-700'
                }`}>
                  {(() => {
                    const watched = getWatchedCount();
                    const total = getTotalEpisodes();
                    if (total === 0) return '0%';
                    const percentage = Math.min(Math.round((watched / total) * 100), 100);
                    return `${percentage}% Complete`;
                  })()}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6 lg:space-y-8">
          {seasonData?.episodes?.map((episode, index) => {
            const seriesStatus = getWatchlistStatus(parseInt(id), 'tv');
            const isSeriesCompleted = seriesStatus === WATCHLIST_STATUS.COMPLETED;
            const episodeId = `episode_${seasonNumber}_${episode.episode_number}`;
            const isEpisodeWatched = watchedEpisodes.has(episodeId) || isSeriesCompleted;
            
            return (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border transition-all duration-300 ${
                  isEpisodeWatched
                    ? isDarkMode 
                      ? 'bg-green-600/20 border-green-500/50 shadow-lg shadow-green-500/20'
                      : 'bg-green-100 border-green-300 shadow-lg shadow-green-200'
                    : isDarkMode
                      ? 'bg-white/5 border-white/10 hover:bg-white/10'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                {/* Mobile Layout */}
                <div className="block sm:hidden">
                  <div className="flex flex-col gap-4">
                    <div className="w-full h-32 rounded-lg overflow-hidden">
                      <img
                        src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : `https://picsum.photos/seed/${episode.id}/300/200`}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className={`text-lg font-bold ${
                          isEpisodeWatched 
                            ? isDarkMode ? 'text-green-100' : 'text-green-800'
                            : isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {episode.episode_number}. {episode.name}
                        </h3>
                        {isEpisodeWatched && (
                          <CheckCircle className={`w-4 h-4 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      
                      <p className={`text-xs mb-2 line-clamp-2 ${
                        isEpisodeWatched 
                          ? isDarkMode ? 'text-green-200/80' : 'text-green-700'
                          : isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>
                        {episode.overview || 'No description available.'}
                      </p>
                      
                      <div className={`flex items-center gap-3 text-xs ${
                        isEpisodeWatched 
                          ? isDarkMode ? 'text-green-200/60' : 'text-green-600'
                          : isDarkMode ? 'text-white/60' : 'text-gray-500'
                      }`}>
                        <span>{episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}</span>
                        <span>{episode.runtime} min</span>
                        {episode.vote_average && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{episode.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEpisodeToggle(`episode_${seasonNumber}_${episode.episode_number}`, episode.episode_number)}
                        className={`p-2 rounded-full transition-all duration-300 ${
                          isEpisodeWatched
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
                            : 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                        }`}
                      >
                        {isEpisodeWatched ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full flex-shrink-0"
                      >
                        <Play className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:flex items-start gap-8">
                  <div className="w-40 h-24 lg:w-48 lg:h-28 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : `https://picsum.photos/seed/${episode.id}/300/200`}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className={`text-xl lg:text-2xl font-bold ${
                        isEpisodeWatched ? 'text-green-100' : 'text-white'
                      }`}>
                        {episode.episode_number}. {episode.name}
                      </h3>
                      {isEpisodeWatched && (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      )}
                      {episode.vote_average && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="w-5 h-5 fill-current" />
                          <span className="text-base">{episode.vote_average.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-sm lg:text-base mb-4 line-clamp-2 ${
                      isEpisodeWatched ? 'text-green-200/80' : 'text-white/70'
                    }`}>
                      {episode.overview || 'No description available.'}
                    </p>
                    
                    <div className={`flex items-center gap-4 text-sm lg:text-base ${
                      isEpisodeWatched ? 'text-green-200/60' : 'text-white/60'
                    }`}>
                      <span>{episode.air_date ? new Date(episode.air_date).toLocaleDateString() : 'TBA'}</span>
                      <span>{episode.runtime} min</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleEpisodeToggle(`episode_${seasonNumber}_${episode.episode_number}`, episode.episode_number)}
                      className={`p-4 rounded-full transition-all duration-300 ${
                        isEpisodeWatched
                          ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30'
                          : 'bg-white/10 hover:bg-white/20 text-white/60 hover:text-white'
                      }`}
                    >
                      {isEpisodeWatched ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Eye className="w-6 h-6" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full flex-shrink-0"
                    >
                      <Play className="w-6 h-6" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Other Seasons */}
        {allSeasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Other Seasons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6">
              {allSeasons.map((season, index) => (
                <motion.div
                  key={season.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tv/${id}/season/${season.season_number}`)}
                >
                  <div className="aspect-[2/3]">
                    <img
                      src={season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : `https://picsum.photos/seed/${season.id}/300/450`}
                      alt={season.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2 sm:p-4">
                    <h3 className="text-white font-medium mb-1 text-xs sm:text-sm">{season.name}</h3>
                    <p className="text-white/60 text-xs sm:text-sm">{season.episode_count} Episodes</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Episode Count Modal */}
      {showEpisodeCountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-black p-4 sm:p-8 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">Episode Management</h3>
            <p className="text-white/70 mb-6 text-sm sm:text-base">
              Manage watched episodes for this season. You can set a specific count or mark all episodes.
            </p>
            
            {/* Current Status */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="text-white/80 text-sm mb-2">Current Status:</div>
              <div className="text-white font-medium">
                {getWatchedCount()} / {getTotalEpisodes()} Episodes Watched
              </div>
            </div>

            {/* Set Specific Count */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Set Episode Count:</h4>
              <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
                <input
                  type="number"
                  value={episodeCountInput}
                  onChange={(e) => setEpisodeCountInput(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white px-3 sm:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                  placeholder={`1-${getTotalEpisodes()}`}
                  min="1"
                  max={getTotalEpisodes()}
                />
                <button
                  onClick={handleSetEpisodeCount}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium w-full sm:w-auto"
                >
                  Mark as Watched
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-6">
              <h4 className="text-white font-medium mb-3">Quick Actions:</h4>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleMarkAllAsWatched}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium w-full"
                >
                  Mark All Episodes as Watched
                </button>
                <button
                  onClick={handleRemoveAllWatched}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium w-full"
                >
                  Remove All Watched Episodes
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowEpisodeCountModal(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonsPage; 