import { useState, useEffect, useCallback } from 'react';
import { isAnimeContent } from '../utils/mediaTypeUtils';

const WATCHLIST_STORAGE_KEY = 'movieo_watchlist';

export const WATCHLIST_STATUS = {
  PLAN_TO_WATCH: 'plan_to_watch',
  WATCHING: 'watching',
  COMPLETED: 'completed',
  DROPPED: 'dropped'
};

const useWatchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  

  


  // Save watchlist to localStorage
  const saveWatchlist = useCallback((newWatchlist) => {
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  }, []);

  // Clean up duplicate entries in watchlist
  const cleanWatchlist = useCallback((watchlistData) => {
    const seen = new Set();
    const cleanedWatchlist = watchlistData.filter(item => {
      const key = `${item.id}-${item.media_type}`;
      if (seen.has(key)) {
        return false; // Remove duplicate
      }
      seen.add(key);
      return true;
    });
    
    return cleanedWatchlist;
  }, []);

  // Load watchlist from localStorage on mount
  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      
      if (savedWatchlist) {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        
        // Fix existing items: update media_type for animation content and fix anime movie episode counts
        const fixedWatchlist = parsedWatchlist.map(item => {
          // Check if it's anime based on Animation genre
          const isAnime = item.media_type === 'anime' || 
            item.genres?.some(genre => genre.name?.toLowerCase().includes('animation')) ||
            item.genre_ids?.includes(16);
          
          let updatedItem = { ...item };
          
          // If item has animation genres but is marked as movie/tv, update to anime
          if (isAnime && (item.media_type === 'movie' || item.media_type === 'tv')) {
            updatedItem.media_type = 'anime';
          }
          
          // Fix anime movies that have incorrect episode counts (should be 1, not 1000)
          if (isAnime && item.media_type === 'movie' && item.status === WATCHLIST_STATUS.COMPLETED && item.episodes_watched > 1) {
            updatedItem.episodes_watched = 1;
          }
          
          return updatedItem;
        });
        
        if (JSON.stringify(fixedWatchlist) !== JSON.stringify(parsedWatchlist)) {
          // Save fixed version if changes were made
          localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(fixedWatchlist));
          setWatchlist(fixedWatchlist);
        } else {
          setWatchlist(parsedWatchlist);
        }
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remove cleanWatchlist dependency to prevent re-runs

  // Force reload watchlist from localStorage
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

  // Add item to watchlist
  const addToWatchlist = useCallback((item, status = WATCHLIST_STATUS.PLAN_TO_WATCH, episodesWatched = 1) => {
    // Determine the correct media type
    let mediaType = item.media_type || 'movie';
    
    // Check if it's explicitly marked as anime
    if (item.media_type === 'anime') {
      mediaType = 'anime';
    } else {
      // Check ONLY for Animation genre
      const hasAnimationGenre = item.genres?.some(genre => 
        genre.name?.toLowerCase().includes('animation')
      );
      
      if (hasAnimationGenre) {
        mediaType = 'anime';
      } else {
        // Also check genre_ids for animation (ID 16 is Animation)
        const hasAnimationGenreId = item.genre_ids?.includes(16);
        
        if (hasAnimationGenreId) {
          mediaType = 'anime';
        }
      }
    }

    // Check if item already exists in watchlist
    const existingItemIndex = watchlist.findIndex(watchlistItem => 
      watchlistItem.id === item.id && watchlistItem.media_type === mediaType
    );

    if (existingItemIndex !== -1) {
      // Update existing item instead of adding duplicate
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

    // If marking as completed and it's a series/anime series, mark all episodes as watched
    if (status === WATCHLIST_STATUS.COMPLETED && mediaType === 'tv') {
      // Get series data to calculate actual total episodes from ALL seasons
      const seriesData = localStorage.getItem(`series_${item.id}_data`);
      let totalEpisodes = 0;
      
      if (seriesData) {
        const series = JSON.parse(seriesData);
        if (series.seasons) {
          // Calculate total episodes from ALL seasons
          totalEpisodes = series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
        }
      }
      
      // Fallback to item data if no series data
      if (totalEpisodes === 0) {
        totalEpisodes = item.number_of_episodes || item.episode_count || 1000;
      }
      
      episodesWatched = totalEpisodes;
      
      // Mark all episodes as watched in localStorage for each season
      try {
        if (seriesData) {
          const series = JSON.parse(seriesData);
          if (series.seasons) {
            series.seasons.forEach(season => {
              const seasonEpisodes = season.episode_count || 0;
              if (seasonEpisodes > 0) {
                // Create array of all episode IDs for this season
                const episodeIds = Array.from({ length: seasonEpisodes }, (_, i) => `episode_${season.season_number}_${i + 1}`);
                localStorage.setItem(`season_${item.id}_${season.season_number}_watched`, JSON.stringify(episodeIds));
              }
            });
          }
        }
        
        // Store completion data with actual total episode count
        localStorage.setItem(`series_${item.id}_completed`, JSON.stringify({
          totalEpisodes,
          completedAt: new Date().toISOString(),
          status: 'completed'
        }));
      } catch (error) {
        console.error('Error saving completion data:', error);
      }
    }

    // For anime movies, always count as 1 episode when completed
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
      first_air_date: item.first_air_date, // Store for TV series detection
      number_of_episodes: item.number_of_episodes, // Store for TV series detection
      episode_count: item.episode_count, // Store for TV series detection
      genres: item.genres,
      status,
      episodes_watched: episodesWatched,
      added_at: new Date().toISOString(),
      last_updated: new Date().toISOString()
    };

    const newWatchlist = [...watchlist, watchlistItem];
    
    // Save directly without cleaning (cleanWatchlist was causing issues)
    saveWatchlist(newWatchlist);
  }, [watchlist, saveWatchlist]); // Remove cleanWatchlist dependency

  // Remove item from watchlist
  const removeFromWatchlist = useCallback((id, media_type) => {
    const newWatchlist = watchlist.filter(item => 
      !(item.id === id && item.media_type === media_type)
    );
    saveWatchlist(newWatchlist);
  }, [watchlist, saveWatchlist]);

  // Migrate existing completed items to watch history
  const migrateCompletedItemsToHistory = useCallback(() => {
    const existingHistory = JSON.parse(localStorage.getItem('watch_history') || '[]');
    const existingIds = new Set(existingHistory.map(item => `${item.id}-${item.media_type}`));
    
    const completedItems = watchlist.filter(item => item.status === WATCHLIST_STATUS.COMPLETED);
    
    completedItems.forEach(item => {
      const itemKey = `${item.id}-${item.media_type}`;
      if (!existingIds.has(itemKey)) {
        const historyEntry = {
          id: item.id,
          media_type: item.media_type,
          title: item.title || item.name,
          poster_path: item.poster_path,
          episodes_watched: item.episodes_watched || 1,
          watched_at: item.last_updated || new Date().toISOString()
        };
        existingHistory.unshift(historyEntry);
        existingIds.add(itemKey);
      }
    });
    
    // Keep only last 100 entries
    if (existingHistory.length > 100) {
      existingHistory.splice(100);
    }
    
    localStorage.setItem('watch_history', JSON.stringify(existingHistory));
  }, [watchlist]);

  // Initialize watch history on mount
  useEffect(() => {
    migrateCompletedItemsToHistory();
  }, [migrateCompletedItemsToHistory]);

  // Track watch history with timestamp
  const trackWatchHistory = useCallback((item, status) => {
    if (status === WATCHLIST_STATUS.COMPLETED) {
      const watchHistory = JSON.parse(localStorage.getItem('watch_history') || '[]');
      const historyEntry = {
        id: item.id,
        media_type: item.media_type,
        title: item.title || item.name,
        poster_path: item.poster_path,
        episodes_watched: item.episodes_watched || 1, // This will be the total episodes for completed series
        watched_at: new Date().toISOString()
      };
      
      // Check if this item is already in history
      const existingIndex = watchHistory.findIndex(entry => 
        entry.id === item.id && entry.media_type === item.media_type
      );
      
      if (existingIndex !== -1) {
        // Update existing entry
        watchHistory[existingIndex] = historyEntry;
      } else {
        // Add new entry to beginning
        watchHistory.unshift(historyEntry);
      }
      
      // Keep only last 100 entries
      if (watchHistory.length > 100) {
        watchHistory.splice(100);
      }
      
      localStorage.setItem('watch_history', JSON.stringify(watchHistory));
    }
  }, []);

  // Get watch history
  const getWatchHistory = useCallback(() => {
    return JSON.parse(localStorage.getItem('watch_history') || '[]');
  }, []);

  // Update watchlist item status
  const updateWatchlistStatus = useCallback((id, media_type, status, episodesWatched = null) => {
    const newWatchlist = watchlist.map(item => {
      if (item.id === id && item.media_type === media_type) {
        let finalEpisodesWatched = episodesWatched;
        
        // If marking as completed and it's a series/anime, mark all episodes as watched
        if (status === WATCHLIST_STATUS.COMPLETED && (media_type === 'tv' || media_type === 'anime')) {
          // Get series data to calculate actual total episodes from ALL seasons
          const seriesData = localStorage.getItem(`series_${id}_data`);
          let totalEpisodes = 0;
          
          if (seriesData) {
            const series = JSON.parse(seriesData);
            if (series.seasons) {
              // Calculate total episodes from ALL seasons
              totalEpisodes = series.seasons.reduce((total, season) => total + (season.episode_count || 0), 0);
            }
          }
          
          // Fallback to item data if no series data
          if (totalEpisodes === 0) {
            totalEpisodes = item.number_of_episodes || item.episode_count || 1000;
          }
          
          finalEpisodesWatched = totalEpisodes;
          
          // Mark all episodes as watched in localStorage for each season
          try {
            if (seriesData) {
              const series = JSON.parse(seriesData);
              if (series.seasons) {
                series.seasons.forEach(season => {
                  const seasonEpisodes = season.episode_count || 0;
                  if (seasonEpisodes > 0) {
                    // Create array of all episode IDs for this season
                    const episodeIds = Array.from({ length: seasonEpisodes }, (_, i) => `episode_${season.season_number}_${i + 1}`);
                    localStorage.setItem(`season_${id}_${season.season_number}_watched`, JSON.stringify(episodeIds));
                  }
                });
              }
            }
            
            // Store completion data with actual total episode count
            localStorage.setItem(`series_${id}_completed`, JSON.stringify({
              totalEpisodes,
              completedAt: new Date().toISOString(),
              status: 'completed'
            }));
          } catch (error) {
            console.error('Error saving completion data:', error);
          }
        }
        
        // Handle anime movies - count as 1 episode when completed
        if (media_type === 'anime' && item.media_type === 'movie' && status === WATCHLIST_STATUS.COMPLETED) {
          finalEpisodesWatched = 1;
        }
        
        const updatedItem = { 
          ...item, 
          status, 
          episodes_watched: finalEpisodesWatched !== null ? finalEpisodesWatched : item.episodes_watched || 1,
          last_updated: new Date().toISOString() 
        };
        
        // Track watch history when completed
        if (status === WATCHLIST_STATUS.COMPLETED) {
          trackWatchHistory(updatedItem, status);
        }
        
        return updatedItem;
      }
      return item;
    });
    saveWatchlist(newWatchlist);
  }, [watchlist, saveWatchlist, trackWatchHistory]);

  // Check if item is in watchlist
  const isInWatchlist = useCallback((id, media_type) => {
    return watchlist.some(item => 
      item.id === id && item.media_type === media_type
    );
  }, [watchlist]);

  // Get watchlist item status
  const getWatchlistStatus = useCallback((id, media_type) => {
    const item = watchlist.find(item => 
      item.id === id && item.media_type === media_type
    );
    return item ? item.status : null;
  }, [watchlist]);

  // Get watchlist item episode count
  const getEpisodeCount = useCallback((id, media_type) => {
    const item = watchlist.find(item => 
      item.id === id && item.media_type === media_type
    );
    return item ? item.episodes_watched || 1 : 1;
  }, [watchlist]);

  // Get watchlist items by status
  const getWatchlistByStatus = useCallback((status) => {
    return watchlist.filter(item => item.status === status);
  }, [watchlist]);

  // Get watchlist statistics
  const getWatchlistStats = useCallback(() => {
    const stats = {
      total: watchlist.length,
      plan_to_watch: getWatchlistByStatus(WATCHLIST_STATUS.PLAN_TO_WATCH).length,
      watching: getWatchlistByStatus(WATCHLIST_STATUS.WATCHING).length,
      completed: getWatchlistByStatus(WATCHLIST_STATUS.COMPLETED).length,
      dropped: getWatchlistByStatus(WATCHLIST_STATUS.DROPPED).length
    };
    return stats;
  }, [watchlist, getWatchlistByStatus]);

  // Get detailed statistics with episode counts
  const getDetailedStats = useCallback(() => {

    // Movies completed (excluding anime/animation)
    const completedMovies = watchlist.filter(item => 
      item.status === WATCHLIST_STATUS.COMPLETED && 
      item.media_type === 'movie' && 
      !isAnimeContent(item)
    ).length;

    // Series completed (excluding anime/animation)
    const completedSeries = watchlist.filter(item => 
      item.status === WATCHLIST_STATUS.COMPLETED && 
      item.media_type === 'tv' && 
      !isAnimeContent(item)
    ).length;

    // Anime movies completed (separate from episodes)
    const completedAnimeMovies = watchlist.filter(item => 
      item.status === WATCHLIST_STATUS.COMPLETED && 
      item.media_type === 'movie' && 
      isAnimeContent(item)
    ).length;

    // Anime series completed (separate from movies)
    const completedAnimeSeries = watchlist.filter(item => 
      item.status === WATCHLIST_STATUS.COMPLETED && 
      item.media_type === 'tv' && 
      isAnimeContent(item)
    ).length;

    // Total anime completed (movies + series)
    const completedAnime = completedAnimeMovies + completedAnimeSeries;

    // Calculate episode counts from actual episode data
    // Series episodes (excluding anime/animation)
    const seriesEpisodes = watchlist
      .filter(item => 
        item.media_type === 'tv' && 
        item.status === WATCHLIST_STATUS.COMPLETED && 
        !isAnimeContent(item)
      )
      .reduce((total, item) => {
        // Use episodes_watched if available
        if (item.episodes_watched && item.episodes_watched > 0) {
          return total + item.episodes_watched;
        }
        
        // Fallback to series data for accurate episode count
        const seriesData = localStorage.getItem(`series_${item.id}_data`);
        if (seriesData) {
          try {
            const series = JSON.parse(seriesData);
            if (series.seasons) {
              const totalEpisodes = series.seasons.reduce((seasonSum, season) => seasonSum + (season.episode_count || 0), 0);
              return total + totalEpisodes;
            }
          } catch (error) {
            console.error('Error calculating episodes for series:', error);
          }
        }
        
        // Final fallback to item data
        return total + (item.number_of_episodes || item.episode_count || 0);
      }, 0);

    // Anime episodes (only from anime series, not movies)
    const animeEpisodes = watchlist
      .filter(item => {
        if (item.status !== WATCHLIST_STATUS.COMPLETED) return false;
        if (item.media_type !== 'tv') return false;
        return isAnimeContent(item);
      })
      .reduce((total, item) => {
        // Use episodes_watched if available
        if (item.episodes_watched && item.episodes_watched > 0) {
          return total + item.episodes_watched;
        }
        
        // Fallback to series data for accurate episode count
        const seriesData = localStorage.getItem(`series_${item.id}_data`);
        if (seriesData) {
          try {
            const series = JSON.parse(seriesData);
            if (series.seasons) {
              const totalEpisodes = series.seasons.reduce((seasonSum, season) => seasonSum + (season.episode_count || 0), 0);
              return total + totalEpisodes;
            }
          } catch (error) {
            console.error('Error calculating episodes for anime series:', error);
          }
        }
        
        // Final fallback to item data
        return total + (item.number_of_episodes || item.episode_count || 0);
      }, 0);

    // Debug logging to check the counts
    console.log('Profile Statistics Debug:', {
      totalWatchlist: watchlist.length,
      completedMovies,
      completedSeries,
      completedAnimeMovies,
      completedAnimeSeries,
      completedAnime,
      seriesEpisodes,
      animeEpisodes,
      animeItems: watchlist.filter(item => isAnimeContent(item)),
      completedAnimeItems: watchlist.filter(item => 
        item.status === WATCHLIST_STATUS.COMPLETED && isAnimeContent(item)
      )
    });

    return {
      completedMovies,
      completedSeries,
      completedAnime,
      completedAnimeMovies,
      completedAnimeSeries,
      seriesEpisodes,
      animeEpisodes
    };
  }, [watchlist]);

  // Export watchlist as JSON
  const exportWatchlist = useCallback(() => {
    const dataStr = JSON.stringify(watchlist, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `watchlist-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [watchlist]);

  // Import watchlist from JSON
  const importWatchlist = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedWatchlist = JSON.parse(e.target.result);
          if (Array.isArray(importedWatchlist)) {
            saveWatchlist(importedWatchlist);
            resolve('Watchlist imported successfully!');
          } else {
            reject('Invalid watchlist format');
          }
        } catch (error) {
          reject('Error parsing watchlist file');
        }
      };
      reader.onerror = () => reject('Error reading file');
      reader.readAsText(file);
    });
  }, [saveWatchlist]);

  // Refresh watch history manually
  const refreshWatchHistory = useCallback(() => {
    migrateCompletedItemsToHistory();
  }, [migrateCompletedItemsToHistory]);

  // Calculate episode distribution across seasons
  const calculateEpisodeDistribution = useCallback((totalEpisodes, seriesData) => {
    if (!seriesData?.seasons) return [];
    
    const distribution = [];
    let remainingEpisodes = totalEpisodes;
    
    // Sort seasons by season number
    const sortedSeasons = [...seriesData.seasons].sort((a, b) => a.season_number - b.season_number);
    
    for (const season of sortedSeasons) {
      const seasonEpisodes = season.episode_count || 0;
      const episodesInThisSeason = Math.min(remainingEpisodes, seasonEpisodes);
      
      if (episodesInThisSeason > 0) {
        distribution.push({
          season_number: season.season_number,
          episodes_watched: episodesInThisSeason,
          total_episodes: seasonEpisodes
        });
        
        remainingEpisodes -= episodesInThisSeason;
      }
      
      if (remainingEpisodes <= 0) break;
    }
    
    return distribution;
  }, []);

  // Mark specific episodes as watched/unwatched
  const toggleEpisodeWatched = useCallback((seriesId, seasonNumber, episodeNumber, isWatched) => {
    const episodeId = `episode_${seasonNumber}_${episodeNumber}`;
    const storageKey = `season_${seriesId}_${seasonNumber}_watched`;
    
    try {
      const currentWatched = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let newWatched;
      
      if (isWatched) {
        // Add episode if not already watched
        if (!currentWatched.includes(episodeId)) {
          newWatched = [...currentWatched, episodeId];
        } else {
          newWatched = currentWatched;
        }
      } else {
        // Remove episode if watched
        newWatched = currentWatched.filter(id => id !== episodeId);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(newWatched));
      
      // Update watchlist with new episode count
      const seriesData = localStorage.getItem(`series_${seriesId}_data`);
      if (seriesData) {
        const series = JSON.parse(seriesData);
        const totalWatched = calculateTotalWatchedEpisodes(seriesId, series);
        updateWatchlistStatus(seriesId, 'tv', 'watching', totalWatched);
      }
      
      return newWatched.length;
    } catch (error) {
      console.error('Error toggling episode watched status:', error);
      return 0;
    }
  }, [updateWatchlistStatus]);

  // Calculate total watched episodes across all seasons
  const calculateTotalWatchedEpisodes = useCallback((seriesId, seriesData) => {
    if (!seriesData?.seasons) return 0;
    
    let totalWatched = 0;
    
    seriesData.seasons.forEach(season => {
      const storageKey = `season_${seriesId}_${season.season_number}_watched`;
      const seasonWatched = JSON.parse(localStorage.getItem(storageKey) || '[]');
      totalWatched += seasonWatched.length;
    });
    
    return totalWatched;
  }, []);

  // Set total episode count and distribute across seasons
  const setEpisodeCount = useCallback((seriesId, totalEpisodes) => {
    const seriesData = localStorage.getItem(`series_${seriesId}_data`);
    if (!seriesData) return;
    
    const series = JSON.parse(seriesData);
    const distribution = calculateEpisodeDistribution(totalEpisodes, series);
    
    // Clear all existing episode data
    series.seasons.forEach(season => {
      localStorage.removeItem(`season_${seriesId}_${season.season_number}_watched`);
    });
    
    // Mark episodes as watched based on distribution
    distribution.forEach(({ season_number, episodes_watched }) => {
      const episodeIds = Array.from({ length: episodes_watched }, (_, i) => 
        `episode_${season_number}_${i + 1}`
      );
      localStorage.setItem(`season_${seriesId}_${season_number}_watched`, JSON.stringify(episodeIds));
    });
    
    // Update watchlist with total episode count
    updateWatchlistStatus(seriesId, 'tv', 'watching', totalEpisodes);
  }, [calculateEpisodeDistribution, updateWatchlistStatus]);

  // Get episode distribution for a series
  const getEpisodeDistribution = useCallback((seriesId) => {
    const seriesData = localStorage.getItem(`series_${seriesId}_data`);
    if (!seriesData) return [];
    
    const series = JSON.parse(seriesData);
    const totalWatched = calculateTotalWatchedEpisodes(seriesId, series);
    return calculateEpisodeDistribution(totalWatched, series);
  }, [calculateEpisodeDistribution, calculateTotalWatchedEpisodes]);

  return {
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
    getWatchHistory,
    refreshWatchHistory,
    toggleEpisodeWatched,
    calculateTotalWatchedEpisodes,
    setEpisodeCount,
    getEpisodeDistribution,
    reloadWatchlist
  };
};

export default useWatchlist; 