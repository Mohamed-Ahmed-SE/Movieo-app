import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpring, animated } from '@react-spring/web';
import { toast } from 'react-hot-toast';
import {
  Play, Star, TrendingUp, Clock, Heart,
  Film, Tv, Bookmark, Grid3X3, List, Trash2, CheckCircle, EyeOff, Download,
  Upload, Filter, Plus, X, Settings, Search, Calendar, Users, Award,
  Sparkles, Zap, Target, Eye, BookOpen, Tv2, Gamepad2, Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { getMediaType } from '../utils/mediaTypeUtils';
import { getOptimizedImageURL } from '../utils/imageUtils';
import Breadcrumb from '../components/Breadcrumb';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import WatchlistModal from '../components/WatchlistModal';
import CustomSkeletonLoader from '../components/EnhancedLoader';

const WatchlistPage = () => {
  const { isDarkMode } = useTheme();
  // Custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .scrollbar-thin::-webkit-scrollbar {
        width: 6px;
      }
      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: #374151;
        border-radius: 3px;
      }
      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: #4B5563;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  const { watchlist, isLoading, removeFromWatchlist, updateWatchlistStatus, getWatchlistStats, exportWatchlist, importWatchlist, reloadWatchlist, getFavourites, isFavourite, toggleFavourite, toggleSeriesCompletion, getWatchlistStatus } = useWatchlist();
  const [activeFilter, setActiveFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const imageURL = useSelector(state => state.movieoData.imageURL);
  const navigate = useNavigate();

  useEffect(() => {
    reloadWatchlist();
  }, [reloadWatchlist]);

  // Filter and sort watchlist
  const filteredWatchlist = React.useMemo(() => {
    let filtered = watchlist;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(query) ||
        (item.overview || '').toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => {
        const isAnime = item.media_type === 'anime' ||
          item.genres?.some(genre => genre.name?.toLowerCase().includes('animation')) ||
          item.genre_ids?.includes(16);

        if (typeFilter === 'anime') {
          return isAnime;
        } else if (typeFilter === 'movie') {
          return item.media_type === 'movie' && !isAnime;
        } else if (typeFilter === 'tv') {
          return item.media_type === 'tv' && !isAnime;
        } else {
          return item.media_type === typeFilter;
        }
      });
    }

    // Filter by status
    if (activeFilter !== 'all') {
      if (activeFilter === 'favourites') {
        filtered = filtered.filter(item => item.is_favourite);
      } else {
        filtered = filtered.filter(item => item.status === activeFilter);
      }
    }

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'rating':
          aValue = a.vote_average || 0;
          bValue = b.vote_average || 0;
          break;
        case 'title':
          aValue = (a.title || a.name || '').toLowerCase();
          bValue = (b.title || b.name || '').toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.dateAdded || 0);
          bValue = new Date(b.dateAdded || 0);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [watchlist, activeFilter, typeFilter, sortBy, sortOrder, searchQuery]);

  const handleStatusUpdate = (id, media_type, newStatus) => {
    updateWatchlistStatus(id, media_type, newStatus);
    toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
  };

  const handleStatusModalOpen = (item) => {
    setSelectedItem(item);
    setShowStatusModal(true);
  };

  const handleStatusModalClose = () => {
    setShowStatusModal(false);
    setSelectedItem(null);
  };

  const handleStatusSelect = (status) => {
    if (selectedItem) {
      updateWatchlistStatus(selectedItem.id, selectedItem.media_type, status);
      toast.success(`Status updated to ${getStatusLabel(status)}`);
    }
    handleStatusModalClose();
  };

  const handleFavouriteToggle = () => {
    if (selectedItem) {
      try {
        const mediaType = getMediaType(selectedItem);
        const isUserFavourite = isFavourite(selectedItem.id, mediaType);
        
        toggleFavourite(selectedItem.id, mediaType);
        if (isUserFavourite) {
          toast.success('Removed from favourites');
        } else {
          toast.success('Added to favourites');
        }
      } catch (error) {
        console.error('Error toggling favourite:', error);
        toast.error('Failed to update favourites');
      }
    }
  };

  const handleSeriesCompletionToggle = () => {
    if (selectedItem) {
      try {
        const mediaType = getMediaType(selectedItem);
        
        toggleSeriesCompletion(selectedItem.id, mediaType);
        const currentStatus = getWatchlistStatus(selectedItem.id, mediaType);
        if (currentStatus === WATCHLIST_STATUS.COMPLETED) {
          toast.success('Series marked as unwatched');
        } else {
          toast.success('All episodes marked as watched');
        }
      } catch (error) {
        console.error('Error toggling series completion:', error);
        toast.error('Failed to update series status');
      }
    }
  };

  const handleRemove = (id, media_type) => {
    removeFromWatchlist(id, media_type);
    toast.success('Removed from watchlist');
  };

  const handlePlay = (item) => {
    const mediaType = item.media_type;
    if (mediaType === 'anime') {
      const isTVSeries = item.first_air_date || item.number_of_episodes || item.episode_count;
      const routeType = isTVSeries ? 'tv' : 'movie';
      navigate(`/${routeType}/${item.id}`);
    } else {
      navigate(`/${mediaType}/${item.id}`);
    }
  };

  const handleExport = () => {
    try {
      exportWatchlist();
      toast.success('Watchlist exported successfully!');
    } catch (error) {
      toast.error('Failed to export watchlist');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      await importWatchlist(importFile);
      setShowImportModal(false);
      setImportFile(null);
      toast.success('Watchlist imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import watchlist');
    } finally {
      setIsImporting(false);
    }
  };

  const stats = getWatchlistStats();

  const statusConfig = {
    [WATCHLIST_STATUS.PLAN_TO_WATCH]: {
      label: 'Plan to Watch',
      color: 'bg-gradient-to-r from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      icon: <Clock className="w-4 h-4" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    [WATCHLIST_STATUS.WATCHING]: {
      label: 'Watching',
      color: 'bg-gradient-to-r from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      icon: <Play className="w-4 h-4" />,
      gradient: 'from-green-500 to-green-600'
    },
    [WATCHLIST_STATUS.COMPLETED]: {
      label: 'Completed',
      color: 'bg-gradient-to-r from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      icon: <CheckCircle className="w-4 h-4" />,
      gradient: 'from-purple-500 to-purple-600'
    },
    [WATCHLIST_STATUS.DROPPED]: {
      label: 'Dropped',
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: <EyeOff className="w-4 h-4" />,
      gradient: 'from-red-500 to-red-600'
    },
    'favourites': {
      label: 'Favourites',
      color: 'bg-gradient-to-r from-red-500 to-red-600',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: <Heart className="w-4 h-4" />,
      gradient: 'from-red-500 to-red-600'
    }
  };

  const getStatusLabel = (status) => {
    return statusConfig[status]?.label || status;
  };

  const sortOptions = [
    { value: 'date', label: 'Date Added', icon: <Calendar className="w-4 h-4" /> },
    { value: 'title', label: 'Title', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'rating', label: 'Rating', icon: <Star className="w-4 h-4" /> }
  ];

  const pageSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { tension: 300, friction: 20 }
  });

  if (isLoading) {
    return <CustomSkeletonLoader count={12} className="pt-32" />;
  }

  return (
    <animated.div style={pageSpring} className={`min-h-screen pt-16 transition-all duration-500 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-24 left-4 z-50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className={`backdrop-blur-xl border p-3 rounded-xl transition-all ${
            isDarkMode 
              ? 'bg-black/80 border-white/20 text-white hover:bg-white/10'
              : 'bg-white/90 border-gray-200 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999]"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`w-80 h-full backdrop-blur-xl border-r p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 z-[99999] ${
                isDarkMode 
                  ? 'bg-black/95 border-white/10'
                  : 'bg-white/95 border-gray-200'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Sidebar Content */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Bookmark className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Watchlist</h1>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{filteredWatchlist.length} items</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                    isDarkMode 
                      ? 'bg-white/10 hover:bg-white/20'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <X className={`w-4 h-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`} />
                </button>
              </div>

              {/* Mobile Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    isDarkMode ? 'text-white/40' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-red-500/50 ${
                      isDarkMode
                        ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Stats */}
              <div className="mb-6">
                <h3 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-white/80' : 'text-gray-700'
                }`}>Overview</h3>
                <div className="space-y-2">
                  {Object.entries(stats).map(([status, count]) => (
                    <div key={status} className={`${statusConfig[status]?.bgColor} rounded-lg p-3 border ${statusConfig[status]?.borderColor}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`${statusConfig[status]?.color} p-2 rounded-lg`}>
                            {statusConfig[status]?.icon}
                          </div>
                          <span className={`text-sm ${
                          isDarkMode ? 'text-white/80' : 'text-gray-700'
                        }`}>{statusConfig[status]?.label}</span>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{count}</div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-white/60' : 'text-gray-600'
                          }`}>
                            {count === 1 ? 'item' : 'items'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Type Filters */}
              <div className="mb-6">
                <h3 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-white/80' : 'text-gray-700'
                }`}>Content Type</h3>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All Types', icon: <Sparkles className="w-4 h-4" /> },
                    { key: 'movie', label: 'Movies', icon: <Film className="w-4 h-4" /> },
                    { key: 'tv', label: 'Series', icon: <Tv className="w-4 h-4" /> },
                    { key: 'anime', label: 'Anime', icon: <Gamepad2 className="w-4 h-4" /> }
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setTypeFilter(key);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        typeFilter === key
                          ? 'bg-red-500/20 border border-red-500/30'
                          : isDarkMode
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Status Filters */}
              <div className="mb-6">
                <h3 className={`text-sm font-medium mb-3 ${
                  isDarkMode ? 'text-white/80' : 'text-gray-700'
                }`}>Status</h3>
                <div className="space-y-2">
                  {[
                    { key: 'all', label: 'All Status', icon: <Target className="w-4 h-4" /> },
                    ...Object.entries(statusConfig).map(([status, config]) => ({
                      key: status,
                      label: config.label,
                      icon: config.icon
                    }))
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveFilter(key);
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        activeFilter === key
                          ? 'bg-red-500/20 border border-red-500/30'
                          : isDarkMode
                          ? 'text-white/60 hover:text-white hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      {icon}
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleExport();
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Layout */}
      <div className="flex h-screen">
        {/* Left Sidebar - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className={`hidden lg:block w-80 backdrop-blur-xl border-r p-6 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 ${
            isDarkMode 
              ? 'bg-black/80 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}
        >
          {/* Logo & Title */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <Bookmark className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Watchlist</h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-white/60' : 'text-gray-600'
                }`}>{filteredWatchlist.length} items</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-white/40' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-red-500/50 ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
                    : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium mb-3 ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>Overview</h3>
            <div className="space-y-2">
              {Object.entries(stats).map(([status, count]) => (
                <div key={status} className={`${statusConfig[status]?.bgColor} rounded-lg p-3 border ${statusConfig[status]?.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`${statusConfig[status]?.color} p-2 rounded-lg`}>
                        {statusConfig[status]?.icon}
                      </div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white/80' : 'text-gray-700'
                      }`}>{statusConfig[status]?.label}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-lg ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{count}</div>
                      <div className={`text-xs ${
                        isDarkMode ? 'text-white/60' : 'text-gray-600'
                      }`}>
                        {count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Type Filters */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium mb-3 ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>Content Type</h3>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'All Types', icon: <Sparkles className="w-4 h-4" /> },
                { key: 'movie', label: 'Movies', icon: <Film className="w-4 h-4" /> },
                { key: 'tv', label: 'Series', icon: <Tv className="w-4 h-4" /> },
                { key: 'anime', label: 'Anime', icon: <Gamepad2 className="w-4 h-4" /> }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    typeFilter === key
                      ? 'bg-red-500/20 text-white border border-red-500/30'
                      : isDarkMode 
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Filters */}
          <div className="mb-6">
            <h3 className={`text-sm font-medium mb-3 ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>Status</h3>
            <div className="space-y-2">
              {[
                { key: 'all', label: 'All Status', icon: <Target className="w-4 h-4" /> },
                ...Object.entries(statusConfig).map(([status, config]) => ({
                  key: status,
                  label: config.label,
                  icon: config.icon
                }))
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    activeFilter === key
                      ? 'bg-red-500/20 text-white border border-red-500/30'
                      : isDarkMode 
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleExport}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-3 rounded-lg flex items-center gap-2 text-sm font-medium transition-all"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/30 backdrop-blur-xl border-b border-white/10 p-3 sm:p-4 flex-shrink-0 sticky top-0 z-40"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Breadcrumb />
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                {/* View Toggle */}
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-red-500 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-red-500 text-white' 
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className="bg-white/5 hover:bg-white/10 px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-white transition-all"
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm hidden sm:block">Sort</span>
                  </button>

                  <AnimatePresence>
                    {showSortDropdown && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: -10 }}
                        className="absolute top-full mt-2 right-0 bg-gray-900/95 backdrop-blur-xl rounded-lg p-2 border border-white/20 shadow-2xl z-[99999] min-w-[200px]"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                                                  className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                        sortBy === option.value
                          ? 'bg-red-500 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                          >
                            {option.icon}
                            <span className="text-sm">{option.label}</span>
                          </button>
                        ))}
                        <div className="border-t border-white/20 my-2" />
                        <button
                          onClick={() => {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                            setShowSortDropdown(false);
                          }}
                          className="w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-sm">
                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                          </span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>

                    {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700 min-h-0">
            {/* Content */}
            {filteredWatchlist.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-32 h-32 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/10"
                >
                  <Bookmark className="w-16 h-16 text-white/60" />
                </motion.div>
                <h3 className={`text-3xl font-bold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Your watchlist is empty</h3>
                <p className={`mb-8 text-lg ${
                  isDarkMode ? 'text-white/60' : 'text-gray-600'
                }`}>Start adding movies and TV shows to your watchlist</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center gap-3 mx-auto transition-all duration-300"
                >
                  <Plus className="w-6 h-6" />
                  Explore Content
                </motion.button>
              </motion.div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4"
              >
                <AnimatePresence>
                  {filteredWatchlist.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.media_type}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative group"
                    >
                      <UnifiedMovieCard movie={item} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <AnimatePresence>
                  {filteredWatchlist.map((item, index) => (
                    <motion.div
                      key={`${item.id}-${item.media_type}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
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
                              <span className={`${statusConfig[item.status]?.color} px-2 py-0.5 rounded text-xs font-medium flex-shrink-0`}>
                                {statusConfig[item.status]?.label}
                              </span>
                            </div>
                            <p className={`text-xs mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{item.vote_average?.toFixed(1) || 'N/A'}</span>
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusModalOpen(item);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.id, item.media_type);
                              }}
                              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
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
                              <span className={`${statusConfig[item.status]?.color} px-2 py-1 rounded text-xs font-medium`}>
                                {statusConfig[item.status]?.label}
                              </span>
                            </div>
                            <p className={`text-sm mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{item.vote_average?.toFixed(1) || 'N/A'}</span>
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusModalOpen(item);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.id, item.media_type);
                              }}
                              className={`p-2 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-white/10 hover:bg-white/20 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
                            <span className={`${statusConfig[item.status]?.color} px-2 py-1 rounded text-xs font-medium`}>
                              {statusConfig[item.status]?.label}
                            </span>
                          </div>
                          <p className={`text-sm mb-2 line-clamp-1 ${
                            isDarkMode ? 'text-white/60' : 'text-gray-600'
                          }`}>
                            {item.overview}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{item.vote_average?.toFixed(1) || 'N/A'}</span>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusModalOpen(item);
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemove(item.id, item.media_type);
                            }}
                            className={`p-2 rounded-lg ${
                              isDarkMode 
                                ? 'bg-white/10 hover:bg-white/20 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
          </div>
        </div>

      {/* Enhanced Import Modal */}
        <AnimatePresence>
          {showImportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border shadow-2xl ${
                  isDarkMode 
                    ? 'bg-gray-900/95 border-white/20'
                    : 'bg-white/95 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Import Watchlist</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowImportModal(false)}
                    className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <X className={`w-5 h-5 ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`} />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className={`block text-sm font-semibold ${
                      isDarkMode ? 'text-white/80' : 'text-gray-700'
                    }`}>Select JSON file</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className={`block w-full rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 focus:outline-none focus:border-red-500/50 ${
                        isDarkMode 
                          ? 'bg-white/10 hover:bg-white/20 border-2 border-white/20 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300"
                    >
                      {isImporting ? 'Importing...' : 'Import'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowImportModal(false)}
                      className={`flex-1 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                        isDarkMode 
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unified Watchlist Modal */}
        <WatchlistModal
          isOpen={showStatusModal}
          onClose={handleStatusModalClose}
          movie={selectedItem}
        />

      </div>
    </animated.div>
  );
};

export default WatchlistPage;