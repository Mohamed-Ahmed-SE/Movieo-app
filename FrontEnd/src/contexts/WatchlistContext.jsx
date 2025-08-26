import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { isAnimeContent } from '../utils/mediaTypeUtils';

const WATCHLIST_STORAGE_KEY = 'movieo_watchlist';
export const WATCHLIST_STATUS = {
  PLAN_TO_WATCH: 'plan_to_watch',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  FAVOURITE: 'favourite'
};

const WatchlistContext = createContext();

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveWatchlist = useCallback((newWatchlist) => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }, []);

  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (savedWatchlist) {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        setWatchlist(parsedWatchlist);
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback(async (item, status = WATCHLIST_STATUS.PLAN_TO_WATCH, episodesWatched = 1) => {
    let mediaType = item.media_type || 'movie';
    
    // Debug logging for anime detection during add
    if (mediaType === 'movie') {
      console.log('Adding movie to watchlist:', {
        id: item.id,
        title: item.title,
        media_type: item.media_type,
        genres: item.genres,
        genre_ids: item.genre_ids,
        isAnime: isAnimeContent(item)
      });
    }
    
    // Keep original media_type for proper categorization in stats
    // Anime content will be detected by isAnimeContent() function in getDetailedStats

    const existingItemIndex = watchlist.findIndex(watchlistItem => 
      watchlistItem.id === item.id && watchlistItem.media_type === mediaType
    );

    if (existingItemIndex !== -1) {
      const updatedWatchlist = [...watchlist];
      updatedWatchlist[existingItemIndex] = {
        ...updatedWatchlist[existingItemIndex],
        status,
        episodes_watched: episodesWatched,
        last_updated: new Date().toISOString()
      };
      saveWatchlist(updatedWatchlist);
      return;
    }

    // For TV series, fetch series data if not available
    if (mediaType === 'tv') {
      const seriesData = localStorage.getItem(`series_${item.id}_data`);
      if (!seriesData) {
        try {
          console.log('Fetching series data for:', item.title || item.name, 'ID:', item.id);
          // Fetch series data from API using the same token as the rest of the app
          const API_TOKEN = import.meta.env.VITE_TMDB_API_TOKEN;
          const response = await fetch(`https://api.themoviedb.org/3/tv/${item.id}`, {
            headers: {
              'Authorization': `Bearer ${API_TOKEN}`,
              'Content-Type': 'application/json',
            },
          });
          console.log('API response status:', response.status);
          
          if (response.ok) {
            const fetchedSeriesData = await response.json();
            localStorage.setItem(`series_${item.id}_data`, JSON.stringify(fetchedSeriesData));
            console.log('Fetched and stored series data for:', item.title || item.name, 'Episodes:', fetchedSeriesData.number_of_episodes);
            
            // Update the item with complete data from API
            Object.assign(item, fetchedSeriesData);
            console.log('Updated item with fetched data:', {
              number_of_episodes: item.number_of_episodes,
              episode_count: item.episode_count
            });
          } else {
            console.error('API request failed:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Error fetching series data:', error);
        }
      } else {
        console.log('Using cached series data for:', item.title || item.name);
      }
    }

    if (status === WATCHLIST_STATUS.COMPLETED && mediaType === 'tv') {
      const seriesData = localStorage.getItem(`series_${item.id}_data`);
      let totalEpisodes = 0;
      
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          totalEpisodes = series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
        }
      }
      
      if (totalEpisodes === 0) {
        totalEpisodes = item.number_of_episodes || item.episode_count || 1;
      }
      
      episodesWatched = totalEpisodes;
      
      try {
        if (seriesData) {
          const series = JSON.parse(seriesData);
          if (series.seasons) {
            series.seasons.forEach(season => {
              const seasonEpisodes = season.episode_count || 0;
              if (seasonEpisodes > 0) {
                const episodeIds = Array.from({ length: seasonEpisodes }, (_, i) => `episode_${season.season_number}_${i + 1}`);
                localStorage.setItem(`season_${item.id}_${season.season_number}_watched`, JSON.stringify(episodeIds));
              }
            });
          }
        }
        
        localStorage.setItem(`series_${item.id}_completed`, JSON.stringify({
          totalEpisodes,
          completedAt: new Date().toISOString(),
          status: 'completed'
        }));
      } catch (error) {
        console.error('Error saving completion data:', error);
      }
    }

        // For ALL TV series, always set the correct episode count regardless of status
    if (mediaType === 'tv') {
      const seriesData = localStorage.getItem(`series_${item.id}_data`);
      let totalEpisodes = 0;
      
      if (seriesData) {
        try {
          const series = JSON.parse(seriesData);
          if (series.seasons) {
            totalEpisodes = series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
          }
        } catch (error) {
          console.error('Error parsing series data:', error);
        }
      }
      
      // If no series data or no episodes found, use the item's own episode count - no limit
      if (totalEpisodes === 0) {
        totalEpisodes = item.number_of_episodes || item.episode_count || 1;
      }
      
      // For completed series, set episodes_watched to total episodes
      if (status === WATCHLIST_STATUS.COMPLETED) {
        episodesWatched = totalEpisodes;
      } else {
        // For non-completed series, set episodes_watched to 0 but store total episodes
        episodesWatched = 0;
      }
      
      // Store the total episodes count for later use
      item.total_episodes = totalEpisodes;
      
             console.log('TV series episode calculation:', {
         id: item.id,
         title: item.title || item.name,
         totalEpisodes,
         episodesWatched,
         hasSeriesData: !!seriesData,
         itemEpisodes: item.number_of_episodes || item.episode_count,
         isAnime: isAnimeContent(item),
         originalItem: {
           number_of_episodes: item.number_of_episodes,
           episode_count: item.episode_count,
           media_type: item.media_type
         }
       });
    }

    if (status === WATCHLIST_STATUS.COMPLETED && mediaType === 'movie' && isAnimeContent(item)) {
      episodesWatched = 1;
    }

    const watchlistItem = {
      id: item.id,
      media_type: mediaType,
      title: item.title || item.name,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      overview: item.overview,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
      first_air_date: item.first_air_date,
      number_of_episodes: item.number_of_episodes,
      episode_count: item.episode_count,
      total_episodes: item.total_episodes, // Store total episodes for anime series
      genres: item.genres,
      genre_ids: item.genre_ids,
      status,
      is_favourite: false,
      episodes_watched: episodesWatched,
      added_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const newWatchlist = [...watchlist, watchlistItem];
    saveWatchlist(newWatchlist);
  }, [watchlist, saveWatchlist]);

  const updateWatchlistStatus = useCallback((id, media_type, newStatus, episodesWatched = 1) => {
    const updatedWatchlist = watchlist.map(item => {
      if (item.id === id && item.media_type === media_type) {
        return {
          ...item,
          status: newStatus,
          episodes_watched: episodesWatched,
          last_updated: new Date().toISOString()
        };
      }
      return item;
    });
    saveWatchlist(updatedWatchlist);
  }, [watchlist, saveWatchlist]);

  // New function to mark all episodes of a series as watched/unwatched
  const toggleSeriesCompletion = useCallback((seriesId, mediaType) => {
    const existingItem = watchlist.find(item => 
      item.id === seriesId && item.media_type === mediaType
    );

    if (existingItem && existingItem.status === WATCHLIST_STATUS.COMPLETED) {
      // If already completed, mark as unwatched
      updateWatchlistStatus(seriesId, mediaType, WATCHLIST_STATUS.PLAN_TO_WATCH, 0);
      
      // Clear all episode watched data
      try {
        const seriesData = localStorage.getItem(`series_${seriesId}_data`);
        if (seriesData) {
          const series = JSON.parse(seriesData);
          if (series.seasons) {
            series.seasons.forEach(season => {
              localStorage.removeItem(`season_${seriesId}_${season.season_number}_watched`);
            });
          }
        }
        localStorage.removeItem(`series_${seriesId}_completed`);
      } catch (error) {
        console.error('Error clearing completion data:', error);
      }
    } else {
      // Mark as completed with all episodes watched
      const seriesData = localStorage.getItem(`series_${seriesId}_data`);
      let totalEpisodes = 0;
      
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          totalEpisodes = series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
        }
      }
      
      if (totalEpisodes === 0) {
        totalEpisodes = 1; // Default to 1 episode
      }
      
      updateWatchlistStatus(seriesId, mediaType, WATCHLIST_STATUS.COMPLETED, totalEpisodes);
      
      // Mark all episodes as watched
      try {
        if (seriesData) {
          const series = JSON.parse(seriesData);
          if (series.seasons) {
            series.seasons.forEach(season => {
              const seasonEpisodes = season.episode_count || 0;
              if (seasonEpisodes > 0) {
                const episodeIds = Array.from({ length: seasonEpisodes }, (_, i) => `episode_${season.season_number}_${i + 1}`);
                localStorage.setItem(`season_${seriesId}_${season.season_number}_watched`, JSON.stringify(episodeIds));
              }
            });
          }
        }
        
        localStorage.setItem(`series_${seriesId}_completed`, JSON.stringify({
          totalEpisodes,
          completedAt: new Date().toISOString(),
          status: 'completed'
        }));
      } catch (error) {
        console.error('Error saving completion data:', error);
      }
    }
  }, [watchlist, updateWatchlistStatus]);

  const removeFromWatchlist = useCallback((id, media_type) => {
    const newWatchlist = watchlist.filter(item => 
      !(item.id === id && item.media_type === media_type)
    );
    saveWatchlist(newWatchlist);
  }, [watchlist, saveWatchlist]);

  const isInWatchlist = useCallback((id, media_type) => {
    return watchlist.some(item => 
      item.id === id && item.media_type === media_type
    );
  }, [watchlist]);

  const getWatchlistStatus = useCallback((id, media_type) => {
    const item = watchlist.find(item => 
      item.id === id && item.media_type === media_type
    );
    return item ? item.status : null;
  }, [watchlist]);

  const toggleFavourite = useCallback((id, media_type) => {
    const updatedWatchlist = watchlist.map(item => {
      if (item.id === id && item.media_type === media_type) {
        return {
          ...item,
          is_favourite: !item.is_favourite,
          last_updated: new Date().toISOString()
        };
      }
      return item;
    });
    saveWatchlist(updatedWatchlist);
  }, [watchlist, saveWatchlist]);

  const isFavourite = useCallback((id, media_type) => {
    const item = watchlist.find(item => 
      item.id === id && item.media_type === media_type
    );
    return item ? item.is_favourite : false;
  }, [watchlist]);

  const getWatchlistByStatus = useCallback((status) => {
    return watchlist.filter(item => item.status === status);
  }, [watchlist]);

  const getFavourites = useCallback(() => {
    return watchlist.filter(item => item.is_favourite);
  }, [watchlist]);

  const getWatchlistStats = useCallback(() => {
    const stats = {
      total: watchlist.length,
      plan_to_watch: getWatchlistByStatus(WATCHLIST_STATUS.PLAN_TO_WATCH).length,
      watching: getWatchlistByStatus(WATCHLIST_STATUS.WATCHING).length,
      completed: getWatchlistByStatus(WATCHLIST_STATUS.COMPLETED).length,
      dropped: getWatchlistByStatus(WATCHLIST_STATUS.DROPPED).length,
      favourites: getFavourites().length
    };
    return stats;
  }, [watchlist, getWatchlistByStatus, getFavourites]);

  const getDetailedStats = useCallback(() => {
    // Simplified logic: If it's a movie and it's anime, it's an anime movie (regardless of episodes)
    const movies = watchlist.filter(item => 
      item.media_type === 'movie' && !isAnimeContent(item)
    );
    const series = watchlist.filter(item => 
      item.media_type === 'tv' && !isAnimeContent(item)
    );
    const animeMovies = watchlist.filter(item => 
      item.media_type === 'movie' && isAnimeContent(item)
    );
    const animeSeries = watchlist.filter(item => 
      item.media_type === 'tv' && isAnimeContent(item)
    );

    // Debug logging for anime movies
    console.log('Watchlist items:', watchlist);
    console.log('Anime movies found:', animeMovies);
    console.log('Regular movies found:', movies);
    
    // Detailed debugging for anime detection
    watchlist.forEach(item => {
      if (item.media_type === 'movie') {
        console.log(`Movie ${item.id} (${item.title}):`, {
          media_type: item.media_type,
          genres: item.genres,
          genre_ids: item.genre_ids,
          isAnime: isAnimeContent(item),
          hasEpisodes: !!(item.number_of_episodes || item.episode_count),
          wouldBeAnimeMovie: isAnimeContent(item)
        });
      }
    });

    // Calculate actual watched episodes for series and anime series
    const calculateWatchedEpisodes = (items, isAnimeCategory = false) => {
      let total = 0;
      
      // Track which series we've already counted to avoid double-counting
      const countedSeries = new Set();
      
      // Count episodes from watchlist items
      total += items.reduce((sum, item) => {
        // For completed items, count their watched episodes
        if (item.status === WATCHLIST_STATUS.COMPLETED) {
          if (item.episodes_watched && item.episodes_watched > 0) {
            countedSeries.add(item.id);
            return sum + item.episodes_watched;
          }
          // Fallback to calculated episodes if episodes_watched is not set
          const seriesData = localStorage.getItem(`series_${item.id}_data`);
          if (seriesData) {
            try {
              const series = JSON.parse(seriesData);
              if (series.seasons) {
                const totalEpisodes = series.seasons.reduce((seasonSum, season) => seasonSum + (season.episode_count || 0), 0);
                countedSeries.add(item.id);
                return sum + totalEpisodes;
              }
            } catch (error) {
              console.error('Error calculating episodes for series:', error);
            }
          }
          countedSeries.add(item.id);
          return sum + (item.number_of_episodes || item.episode_count || 0);
        }
                 // For non-completed items, count their total episodes if they have episode data
         else {
           // For ALL series, use the stored total_episodes if available
           if (item.total_episodes) {
             countedSeries.add(item.id);
             return sum + item.total_episodes;
           }
           
           const seriesData = localStorage.getItem(`series_${item.id}_data`);
           if (seriesData) {
             try {
               const series = JSON.parse(seriesData);
               if (series.seasons) {
                 const totalEpisodes = series.seasons.reduce((seasonSum, season) => seasonSum + (season.episode_count || 0), 0);
                 countedSeries.add(item.id);
                 return sum + totalEpisodes;
               }
             } catch (error) {
               console.error('Error calculating episodes for series:', error);
             }
           }
           // Fallback to item's episode count - no limit
           countedSeries.add(item.id);
           return sum + (item.number_of_episodes || item.episode_count || 0);
         }
      }, 0);
      
      // Count episodes from localStorage ONLY for series NOT in watchlist, to avoid double-counting
      try {
        const allKeys = Object.keys(localStorage);
        const seasonKeys = allKeys.filter(key => key.includes('_watched') && key.startsWith('season_'));
        
        seasonKeys.forEach(key => {
          try {
            // Extract series ID from the key (season_123_1_watched -> 123)
            const seriesId = key.split('_')[1];
            if (seriesId && !countedSeries.has(parseInt(seriesId))) {
              // Check if this series belongs to the correct category
              const seriesData = localStorage.getItem(`series_${seriesId}_data`);
              if (seriesData) {
                const series = JSON.parse(seriesData);
                const isAnime = isAnimeContent(series);
                
                // Only count if the category matches and series is not in watchlist
                if (isAnime === isAnimeCategory) {
                  const watchedEpisodes = JSON.parse(localStorage.getItem(key));
                  if (Array.isArray(watchedEpisodes)) {
                    total += watchedEpisodes.length;
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error parsing watched episodes from localStorage:', error);
          }
        });
      } catch (error) {
        console.error('Error calculating episodes from localStorage:', error);
      }
      
      return total;
    };

    return {
      movies: {
        total: movies.length,
        completed: movies.filter(item => item.status === WATCHLIST_STATUS.COMPLETED).length,
        episodes: movies.filter(item => item.status === WATCHLIST_STATUS.COMPLETED)
          .reduce((total, item) => total + (item.episodes_watched || 1), 0)
      },
      series: {
        total: series.length,
        completed: series.filter(item => item.status === WATCHLIST_STATUS.COMPLETED).length,
        episodes: calculateWatchedEpisodes(series, false)
      },
      animeMovies: {
        total: animeMovies.length,
        completed: animeMovies.filter(item => item.status === WATCHLIST_STATUS.COMPLETED).length,
        episodes: animeMovies.filter(item => item.status === WATCHLIST_STATUS.COMPLETED)
          .reduce((total, item) => total + 1, 0)
      },
      animeSeries: {
        total: animeSeries.length,
        completed: animeSeries.filter(item => item.status === WATCHLIST_STATUS.COMPLETED).length,
        episodes: calculateWatchedEpisodes(animeSeries, true)
      }
    };
  }, [watchlist]);

  const exportWatchlist = useCallback(() => {
    const dataStr = JSON.stringify(watchlist, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'movieo_watchlist.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [watchlist]);

  const importWatchlist = useCallback((importedData) => {
    try {
      const parsedData = JSON.parse(importedData);
      if (Array.isArray(parsedData)) {
        saveWatchlist(parsedData);
        toast.success('Watchlist imported successfully!');
      } else {
        toast.error('Invalid watchlist format');
      }
    } catch (error) {
      console.error('Error importing watchlist:', error);
      toast.error('Error importing watchlist');
    }
  }, [saveWatchlist]);

  const cleanWatchlist = useCallback(() => {
    const seen = new Set();
    const cleaned = watchlist.filter(item => {
      const key = `${item.id}-${item.media_type}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    
    if (cleaned.length !== watchlist.length) {
      saveWatchlist(cleaned);
      toast.success(`Cleaned watchlist: removed ${watchlist.length - cleaned.length} duplicates`);
    }
  }, [watchlist, saveWatchlist]);

  const getWatchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem('movieo_watch_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error loading watch history:', error);
      return [];
    }
  }, []);

  const refreshWatchHistory = useCallback(() => {
    try {
      const history = localStorage.getItem('movieo_watch_history');
      if (history) {
        const parsedHistory = JSON.parse(history);
        const migratedHistory = parsedHistory.map(item => ({
          ...item,
          timestamp: item.timestamp || new Date().toISOString()
        }));
        localStorage.setItem('movieo_watch_history', JSON.stringify(migratedHistory));
        return migratedHistory;
      }
      return [];
    } catch (error) {
      console.error('Error refreshing watch history:', error);
      return [];
    }
  }, []);

  const getEpisodeCount = useCallback((seriesId) => {
    try {
      const seriesData = localStorage.getItem(`series_${seriesId}_data`);
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          return series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
        }
      }
      return 0;
    } catch (error) {
      console.error('Error getting episode count:', error);
      return 0;
    }
  }, []);

  const toggleEpisodeWatched = useCallback((seriesId, seasonNumber, episodeNumber) => {
    const key = `season_${seriesId}_${seasonNumber}_watched`;
    try {
      const watchedEpisodes = JSON.parse(localStorage.getItem(key) || '[]');
      const episodeId = `episode_${seasonNumber}_${episodeNumber}`;
      
      const isWatched = watchedEpisodes.includes(episodeId);
      let updatedEpisodes;
      
      if (isWatched) {
        updatedEpisodes = watchedEpisodes.filter(id => id !== episodeId);
      } else {
        updatedEpisodes = [...watchedEpisodes, episodeId];
      }
      
      localStorage.setItem(key, JSON.stringify(updatedEpisodes));
      return !isWatched;
    } catch (error) {
      console.error('Error toggling episode watched status:', error);
      return false;
    }
  }, []);

  const calculateTotalWatchedEpisodes = useCallback((seriesId) => {
    try {
      const seriesData = localStorage.getItem(`series_${seriesId}_data`);
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          return series.seasons.reduce((total, season) => {
            const seasonKey = `season_${seriesId}_${season.season_number}_watched`;
            const watchedEpisodes = JSON.parse(localStorage.getItem(seasonKey) || '[]');
            return total + watchedEpisodes.length;
          }, 0);
        }
      }
      return 0;
    } catch (error) {
      console.error('Error calculating total watched episodes:', error);
      return 0;
    }
  }, []);

  const setEpisodeCount = useCallback((seriesId, count) => {
    try {
      localStorage.setItem(`series_${seriesId}_episode_count`, count.toString());
    } catch (error) {
      console.error('Error setting episode count:', error);
    }
  }, []);

  const getEpisodeDistribution = useCallback((seriesId) => {
    try {
      const seriesData = localStorage.getItem(`series_${seriesId}_data`);
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          return series.seasons.map(season => {
            const seasonKey = `season_${seriesId}_${season.season_number}_watched`;
            const watchedEpisodes = JSON.parse(localStorage.getItem(seasonKey) || '[]');
            return {
              season_number: season.season_number,
              total_episodes: season.episode_count || 0,
              watched_episodes: watchedEpisodes.length
            };
          });
        }
      }
      return [];
    } catch (error) {
      console.error('Error getting episode distribution:', error);
      return [];
    }
  }, []);

  const reloadWatchlist = useCallback(() => {
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (savedWatchlist) {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        setWatchlist(parsedWatchlist);
      }
    } catch (error) {
      console.error('Error force reloading watchlist:', error);
    }
  }, []);

  const clearWatchlist = useCallback(() => {
    try {
      // Clear main watchlist
      localStorage.removeItem(WATCHLIST_STORAGE_KEY);
      setWatchlist([]);
      
      // Clear all series data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('series_') || key.startsWith('season_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear watch history
      localStorage.removeItem('movieo_watch_history');
      
      // Clear favourites (if stored separately)
      localStorage.removeItem('favourites');
      
      console.log('Watchlist cleared successfully');
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      throw error;
    }
  }, []);

  const value = {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    updateWatchlistStatus,
    isInWatchlist,
    getWatchlistStatus,
    getEpisodeCount,
    getWatchlistByStatus,
    getWatchlistStats,
    getDetailedStats,
    exportWatchlist,
    importWatchlist,
    cleanWatchlist,
    clearWatchlist,
    getWatchHistory,
    refreshWatchHistory,
    toggleEpisodeWatched,
    calculateTotalWatchedEpisodes,
    setEpisodeCount,
    getEpisodeDistribution,
    toggleSeriesCompletion,
    toggleFavourite,
    isFavourite,
    getFavourites,
    reloadWatchlist,
    WATCHLIST_STATUS
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}; 