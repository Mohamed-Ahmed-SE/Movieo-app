import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Settings, Heart, Bookmark, Eye, EyeOff, Star, Calendar, Clock, 
  Play, Pause, CheckCircle, XCircle, TrendingUp, Award, Crown, Zap,
  ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Plus, Minus, Edit3,
  Trash2, Download, Upload, Share2, Lock, Unlock, Bell, BellOff, X,
  Camera, Mail, Phone, MapPin, Globe, Shield, Key, LogOut, UserPlus,
  Activity, BarChart3, Target, Trophy, Clock3, CalendarDays
} from 'lucide-react';
import { 
  MdMovie, MdTv, MdFavorite, MdBookmark, MdPlayArrow, MdCheckCircle,
  MdStar, MdPerson, MdAdd, MdEdit, MdDelete, MdArrowBack, MdArrowForward,
  MdEmail, MdPhone, MdLocationOn, MdLanguage, MdSecurity, MdNotifications,
  MdAccountCircle, MdHistory, MdTrendingUp, MdSettings
} from 'react-icons/md';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { toast } from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import { getOptimizedImageURL } from '../utils/imageUtils';

// Fallback card component
const FallbackCard = ({ item }) => {
  const title = item?.title || item?.name || 'Unknown Title';
  const mediaType = item?.media_type === 'movie' ? 'Movie' : 'TV Series';
  const year = item?.release_date || item?.first_air_date;
  const yearDisplay = year ? new Date(year).getFullYear() : '';
  
  const posterPath = item?.poster_path;
  const posterUrl = posterPath 
    ? getOptimizedImageURL(posterPath, 'https://image.tmdb.org/t/p/', 'poster')
    : null;
  
  return (
    <div className="w-full h-full bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden transition-all duration-200 hover:scale-105">
      <div className="w-full h-60 relative">
        {posterUrl ? (
          <img 
            src={posterUrl} 
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className={`w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center ${posterUrl ? 'hidden' : ''}`}>
          <div className="text-5xl opacity-50">
            {item?.media_type === 'movie' ? '🎬' : '📺'}
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-2">
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{mediaType}</span>
          {yearDisplay && <span>{yearDisplay}</span>}
        </div>
      </div>
    </div>
  );
};

// Safe wrapper for UnifiedMovieCard
const SafeUnifiedMovieCard = ({ item, config }) => {
  try {
    return <FallbackCard item={item} />;
  } catch (error) {
    console.error('Error rendering UnifiedMovieCard:', error);
    return <FallbackCard item={item} />;
  }
};

const ProfilePage = () => {
  const { isDarkMode } = useTheme();
  const { 
    watchlist = [], 
    favourites = [], 
    getWatchlistStatus, 
    getEpisodeCount, 
    removeFromWatchlist, 
    toggleFavourite,
    isFavourite,
    isInWatchlist,
    getDetailedStats
  } = useWatchlist();

  const safeWatchlist = Array.isArray(watchlist) ? watchlist : [];
  const safeFavourites = Array.isArray(favourites) ? favourites : [];
  const navigate = useNavigate();

  // State for Netflix-style profile management with localStorage
  const [profiles, setProfiles] = useState(() => {
    const savedProfiles = localStorage.getItem('movieo_profiles');
    if (savedProfiles) {
      return JSON.parse(savedProfiles);
    }
    return [
    { id: 1, name: 'Main Profile', avatar: '👤', email: 'main@example.com', isActive: true, isEditing: false },
    { id: 2, name: 'Kids', avatar: '🧒', email: 'kids@example.com', isActive: false, isEditing: false },
    { id: 3, name: 'Anime Fan', avatar: '🎌', email: 'anime@example.com', isActive: false, isEditing: false },
    { id: 4, name: 'Movie Buff', avatar: '🎬', email: 'movies@example.com', isActive: false, isEditing: false }
    ];
  });
  
  const [selectedProfile, setSelectedProfile] = useState(profiles[0]);
  const [showAddProfile, setShowAddProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileEmail, setNewProfileEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👤');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // User Profile State with localStorage
  const [userProfile, setUserProfile] = useState(() => {
    const savedProfile = localStorage.getItem('movieo_user_profile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    return {
      id: 1,
      username: 'movie_lover',
      email: 'user@movieo.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, USA',
      language: 'English',
      notifications: true,
      privacy: 'public',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Passionate movie enthusiast who loves discovering new films and TV shows. Always on the lookout for hidden gems!',
      joinDate: '2024-01-15',
      totalWatchTime: '1,247 hours',
      favoriteGenres: ['Action', 'Drama', 'Sci-Fi', 'Comedy'],
      achievements: [
        { id: 1, name: 'Movie Buff', description: 'Watched 100 movies', icon: '🎬', unlocked: true },
        { id: 2, name: 'Series Binger', description: 'Completed 10 TV series', icon: '📺', unlocked: true },
        { id: 3, name: 'Critic', description: 'Rated 50+ titles', icon: '⭐', unlocked: false },
        { id: 4, name: 'Explorer', description: 'Watched 5 different genres', icon: '🗺️', unlocked: true }
      ],
      stats: {
        moviesWatched: 156,
        seriesCompleted: 23,
        totalEpisodes: 847,
        averageRating: 7.8,
        watchlistItems: 89,
        reviewsWritten: 12
      }
    };
  });

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  // Content categories for Netflix-style browsing
  const contentCategories = [
    { id: 'movies', name: 'Movies', icon: MdMovie, color: 'red' },
    { id: 'series', name: 'TV Series', icon: MdTv, color: 'blue' },
    { id: 'anime-movies', name: 'Anime Movies', icon: MdMovie, color: 'purple' },
    { id: 'anime-series', name: 'Anime Series', icon: MdTv, color: 'pink' },
    { id: 'favourites', name: 'Favourites', icon: MdFavorite, color: 'rose' },
    { id: 'watchlist', name: 'My List', icon: MdBookmark, color: 'amber' },
    { id: 'watching', name: 'Continue Watching', icon: MdPlayArrow, color: 'green' },
    { id: 'completed', name: 'Completed', icon: MdCheckCircle, color: 'emerald' }
  ];

  const avatars = ['👤', '🧒', '🎌', '🎬', '👨‍💻', '👩‍🎨', '🦸‍♂️', '🦸‍♀️', '🎭', '🎪', '🎨', '🎵'];

  // Helper function to check if content is anime
  const isAnimeContent = (item) => {
    if (!item || !item.genres || !item.genre_ids) return false;
    
    return item.genres.some(genre => 
      genre.name.toLowerCase().includes('anime') || 
      genre.name.toLowerCase().includes('animation')
    ) || item.genre_ids.some(id => [16, 28, 12].includes(id));
  };

  // Filter content based on selected category
  const getFilteredContent = (category) => {
    try {
      const filteredWatchlist = safeWatchlist.filter(item => 
        item && 
        item.id && 
        item.media_type && 
        typeof item.media_type === 'string' &&
        (item.media_type === 'movie' || item.media_type === 'tv')
      );
      const filteredFavourites = safeFavourites.filter(item => 
        item && 
        item.id && 
        item.media_type && 
        typeof item.media_type === 'string' &&
        (item.media_type === 'movie' || item.media_type === 'tv')
      );
      
      switch (category) {
        case 'movies':
          return filteredWatchlist.filter(item => item.media_type === 'movie' && !isAnimeContent(item));
        case 'series':
          return filteredWatchlist.filter(item => item.media_type === 'tv' && !isAnimeContent(item));
        case 'anime-movies':
          return filteredWatchlist.filter(item => item.media_type === 'movie' && isAnimeContent(item));
        case 'anime-series':
          return filteredWatchlist.filter(item => item.media_type === 'tv' && isAnimeContent(item));
        case 'favourites':
          return filteredFavourites;
        case 'watchlist':
          return filteredWatchlist;
        case 'watching':
          return filteredWatchlist.filter(item => getWatchlistStatus(item.id, item.media_type) === WATCHLIST_STATUS.WATCHING);
        case 'completed':
          return filteredWatchlist.filter(item => getWatchlistStatus(item.id, item.media_type) === WATCHLIST_STATUS.COMPLETED);
        default:
          return filteredWatchlist;
      }
    } catch (error) {
      console.error('Error in getFilteredContent:', error);
      return [];
    }
  };

  // Profile management functions
  const addProfile = () => {
    const safeProfiles = profiles || [];
    if (newProfileName.trim() && safeProfiles.length < 5) {
      const newProfile = {
        id: Date.now(),
        name: newProfileName.trim(),
        email: newProfileEmail.trim() || '',
        avatar: selectedAvatar,
        isActive: false,
        isEditing: false
      };
      setProfiles([...safeProfiles, newProfile]);
      setNewProfileName('');
      setNewProfileEmail('');
      setSelectedAvatar('👤');
      setShowAddProfile(false);
      toast.success('Profile created successfully!');
    } else if (safeProfiles.length >= 5) {
      toast.error('Maximum 5 profiles allowed');
    } else {
      toast.error('Please enter a profile name');
    }
  };

  const deleteProfile = (profileId) => {
    const safeProfiles = profiles || [];
    if (safeProfiles.length > 1) {
      setProfiles(safeProfiles.filter(p => p.id !== profileId));
      if (selectedProfile.id === profileId) {
        setSelectedProfile(safeProfiles[0]);
      }
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
      toast.success('Profile deleted successfully!');
    } else {
      toast.error('Cannot delete the last profile');
    }
  };

  const switchProfile = (profile) => {
    const safeProfiles = profiles || [];
    setSelectedProfile(profile);
    setProfiles(safeProfiles.map(p => ({ ...p, isActive: p.id === profile.id })));
  };

  const openEditAccount = (profile) => {
    setEditingProfile(profile);
    setEditName(profile.name);
    setEditEmail(profile.email || '');
    setEditAvatar(profile.avatar);
    setShowEditAccount(true);
  };

  const saveAccountEdit = () => {
    if (editName.trim() && editEmail.trim()) {
      const safeProfiles = profiles || [];
      const updatedProfiles = safeProfiles.map(p => 
        p.id === editingProfile.id 
          ? { ...p, name: editName.trim(), email: editEmail.trim(), avatar: editAvatar }
          : p
      );
      setProfiles(updatedProfiles);
      
      if (selectedProfile.id === editingProfile.id) {
        setSelectedProfile({ ...selectedProfile, name: editName.trim(), email: editEmail.trim(), avatar: editAvatar });
      }
      
      setShowEditAccount(false);
      setEditingProfile(null);
      setEditName('');
      setEditEmail('');
      setEditAvatar('');
      toast.success('Account updated successfully!');
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const cancelAccountEdit = () => {
    setShowEditAccount(false);
    setEditingProfile(null);
    setEditName('');
    setEditEmail('');
    setEditAvatar('');
  };

  const getActiveButtonClass = (color) => {
    switch (color) {
      case 'red': return 'bg-red-500 text-white border-red-500';
      case 'blue': return 'bg-blue-500 text-white border-blue-500';
      case 'purple': return 'bg-purple-500 text-white border-purple-500';
      case 'pink': return 'bg-pink-500 text-white border-pink-500';
      case 'rose': return 'bg-rose-500 text-white border-rose-500';
      case 'amber': return 'bg-amber-500 text-white border-amber-500';
      case 'green': return 'bg-green-500 text-white border-green-500';
      case 'emerald': return 'bg-emerald-500 text-white border-emerald-500';
      default: return 'bg-red-500 text-white border-red-500';
    }
  };

  // Dynamic watchlist data calculation
  const getDynamicWatchlistStats = () => {
    const detailedStats = getDetailedStats();
    
    const watchingMovies = watchlist.filter(item => 
      item.media_type === 'movie' && 
      !isAnimeContent(item) && 
      item.status === WATCHLIST_STATUS.WATCHING
    ).length;
    
    const watchingSeries = watchlist.filter(item => 
      item.media_type === 'tv' && 
      !isAnimeContent(item) && 
      item.status === WATCHLIST_STATUS.WATCHING
    ).length;
    
    const watchingAnimeMovies = watchlist.filter(item => 
      item.media_type === 'movie' && 
      isAnimeContent(item) && 
      item.status === WATCHLIST_STATUS.WATCHING
    ).length;
    
    const watchingAnimeSeries = watchlist.filter(item => 
      item.media_type === 'tv' && 
      isAnimeContent(item) && 
      item.status === WATCHLIST_STATUS.WATCHING
    ).length;
    
    return {
      totalMovies: detailedStats.movies?.completed || 0,
      totalSeries: detailedStats.series?.completed || 0,
      totalEpisodes: detailedStats.series?.episodes || 0,
      totalAnimeMovies: detailedStats.animeMovies?.completed || 0,
      totalAnimeSeries: detailedStats.animeSeries?.completed || 0,
      totalAnimeEpisodes: detailedStats.animeSeries?.episodes || 0,
      watchingMovies,
      watchingSeries,
      watchingAnimeMovies,
      watchingAnimeSeries
    };
  };

  // Save profile to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('movieo_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Save profiles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('movieo_profiles', JSON.stringify(profiles));
  }, [profiles]);

  // Update profile with dynamic data on component mount
  useEffect(() => {
    const dynamicStats = getDynamicWatchlistStats();
    setUserProfile(prev => ({ ...prev, ...dynamicStats }));
  }, [watchlist]);

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        setUserProfile(prev => ({
          ...prev,
          avatar: e.target.result
        }));
        toast.success('Profile picture updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit profile
  const handleEditProfile = () => {
    setShowProfileEdit(true);
  };

  // Handle save profile changes
  const handleSaveProfile = () => {
    setShowProfileEdit(false);
    toast.success('Profile updated successfully!');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setShowProfileEdit(false);
  };

  const handleCancelAddProfile = () => {
    setShowAddProfile(false);
    setNewProfileName('');
    setNewProfileEmail('');
    setSelectedAvatar('👤');
  };

  return (
         <div className={`min-h-screen transition-all duration-500 ${
       isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
     }`}>
             {/* Modern Header */}
                            <div className={`sticky top-0 z-50 backdrop-blur-xl ${
           isDarkMode ? 'bg-black/90' : 'bg-white/90'
         }`}>
         <div className="w-full px-6 lg:px-12 py-6">
           <div className="flex items-center justify-between">
           </div>
         </div>
       </div>

       {/* Back Button - Positioned below header */}
       <div className="w-full px-6 lg:px-12 py-4">
         <button
           onClick={() => navigate(-1)}
           className={`p-3 rounded-full transition-all duration-200 ${
             isDarkMode ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-700'
           }`}
         >
           <MdArrowBack className="w-6 h-6" />
         </button>
       </div>

             <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-8 sm:py-12">
         {/* Profile Selection Section */}
         <div className="mb-12 sm:mb-16 lg:mb-20">
           <div className="text-center mb-8 sm:mb-12 lg:mb-16">
             <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 ${
             isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>Who's Watching?</h2>
             <p className={`text-lg sm:text-xl ${
               isDarkMode ? 'text-gray-300' : 'text-gray-600'
             }`}>Choose your profile to continue</p>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 lg:gap-10 max-w-7xl mx-auto">
            {(profiles || []).map((profile) => (
              <motion.div
                key={profile.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`cursor-pointer text-center group ${
                                     profile.isActive ? 'ring-2 ring-red-500' : ''
                }`}
                onClick={() => switchProfile(profile)}
              >
                                 <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 rounded-lg flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl transition-all duration-200 ${
                   isDarkMode 
                     ? 'bg-gray-800 group-hover:bg-gray-700' 
                     : 'bg-gray-200 group-hover:bg-gray-300'
                 }`}>
                   {profile.avatar}
                 </div>
                 <h3 className={`font-medium text-xs sm:text-sm ${
                   isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   {profile.name}
                 </h3>
                {profile.isActive && (
                                     <div className="mt-2 text-xs text-black font-medium">Active</div>
                )}
              </motion.div>
            ))}
            
            {(profiles || []).length < 5 && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="cursor-pointer text-center group"
                onClick={() => setShowAddProfile(true)}
              >
                                 <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-3 sm:mb-4 rounded-lg flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl transition-all duration-200 border-2 border-dashed ${
                   isDarkMode 
                     ? 'border-gray-600 group-hover:border-gray-500 text-gray-400' 
                     : 'border-gray-300 group-hover:border-gray-400 text-gray-500'
                 }`}>
                   <MdAdd className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
                 </div>
                 <h3 className={`font-medium text-xs sm:text-sm ${
                   isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>
                   Add Profile
                 </h3>
              </motion.div>
            )}
          </div>
        </div>

                 {/* User Profile Section */}
         <div className="mb-12 sm:mb-16 lg:mb-20">
           <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-16 ${
             isDarkMode ? 'bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl' : 'bg-gradient-to-br from-white to-gray-50'
           } shadow-2xl border ${
             isDarkMode ? 'border-white/10' : 'border-gray-200'
           }`}>
             <div className="flex flex-col lg:flex-row items-start gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
              {/* Profile Avatar */}
              <div className="flex-shrink-0">
                <div className="relative">
                                     <img
                     src={userProfile.avatar}
                     alt={userProfile.username}
                                           className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-black"
                   />
                   <button
                     onClick={() => setShowImageUpload(true)}
                                           className="absolute bottom-0 right-0 bg-black text-white p-1.5 sm:p-2 rounded-full hover:bg-red-600 transition-colors"
                     title="Change Profile Picture"
                   >
                     <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                   </button>
                </div>
              </div>

              {/* Profile Info */}
                <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div>
                                       <h2 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>
                     {userProfile.username}
                   </h2>
                   <p className={`text-base sm:text-lg ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-600'
                   }`}>
                     {userProfile.bio}
                   </p>
                </div>
                                 <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                   <button
                       onClick={() => setShowProfileEdit(true)}
                     className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                       isDarkMode 
                         ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                         : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                     }`}
                   >
                     <MdEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                       Edit Profile
                   </button>
                     <button
                       onClick={() => setShowStats(!showStats)}
                       className={`flex items-center justify-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                         isDarkMode 
                           ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                           : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                       }`}
                     >
                       <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                       Stats
                     </button>
                   </div>
                </div>

                                 {/* Quick Stats */}
                 <div className="mb-8 sm:mb-12">
                   <h3 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>📊 Quick Overview</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
                                         <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-black/30 border border-black/30' : 'bg-black/10 border border-black/30'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-black'
                       }`}>{userProfile.totalMovies || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-gray-300' : 'text-black'
                       }`}>Movies Watched</div>
                     </div>
                                         <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-black/30 border border-black/30' : 'bg-black/10 border border-black/30'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-black'
                       }`}>{userProfile.totalSeries || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-gray-300' : 'text-black'
                       }`}>Series Completed</div>
                     </div>
                     <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-black/30 border border-black/30' : 'bg-black/10 border border-black/30'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-black'
                       }`}>{userProfile.totalEpisodes || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-gray-300' : 'text-black'
                       }`}>Episodes Watched</div>
                     </div>
                     <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-100 border border-red-300'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-red-700'
                       }`}>{userProfile.totalAnimeMovies || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-red-200' : 'text-red-700'
                       }`}>Anime Movies</div>
                     </div>
                     <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-100 border border-red-300'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-red-700'
                       }`}>{userProfile.totalAnimeSeries || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-red-200' : 'text-red-700'
                       }`}>Anime Series</div>
                     </div>
                     <div className={`text-center p-4 sm:p-6 rounded-xl ${
                       isDarkMode ? 'bg-red-900/30 border border-red-500/30' : 'bg-red-100 border border-red-300'
                     }`}>
                       <div className={`text-2xl sm:text-3xl font-bold ${
                         isDarkMode ? 'text-white' : 'text-red-700'
                       }`}>{userProfile.totalAnimeEpisodes || 0}</div>
                       <div className={`text-xs sm:text-sm font-medium ${
                         isDarkMode ? 'text-red-200' : 'text-red-700'
                       }`}>Anime Episodes</div>
                     </div>
              </div>
            </div>

                                 {/* Contact Info */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="flex items-center gap-2 sm:gap-3">
                       <MdEmail className={`w-4 h-4 sm:w-5 sm:h-5 ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`} />
                       <span className={`text-sm sm:text-base ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-700'
                       }`}>{userProfile.email}</span>
                     </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                       <MdPhone className={`w-4 h-4 sm:w-5 sm:h-5 ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`} />
                       <span className={`text-sm sm:text-base ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-700'
                       }`}>{userProfile.phone}</span>
                     </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                       <MdLocationOn className={`w-4 h-4 sm:w-5 sm:h-5 ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`} />
                       <span className={`text-sm sm:text-base ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-700'
                       }`}>{userProfile.location}</span>
                     </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                       <MdLanguage className={`w-4 h-4 sm:w-5 sm:h-5 ${
                         isDarkMode ? 'text-gray-400' : 'text-gray-600'
                       }`} />
                       <span className={`text-sm sm:text-base ${
                         isDarkMode ? 'text-gray-300' : 'text-gray-700'
                       }`}>{userProfile.language}</span>
                     </div>
                 </div>
              </div>
            </div>
          </div>
        </div>

                 {/* Content Categories Section */}
         <div className="mb-12 sm:mb-16 lg:mb-20">
           <div className={`rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 xl:p-12 ${
             isDarkMode ? 'bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-xl' : 'bg-gradient-to-br from-white to-gray-50'
           } shadow-2xl border ${
             isDarkMode ? 'border-white/10' : 'border-gray-200'
           }`}>
             <h3 className={`text-xl sm:text-2xl font-bold mb-6 sm:mb-8 ${
               isDarkMode ? 'text-white' : 'text-gray-900'
             }`}>My Content</h3>
            
                         {/* Category Tabs */}
             <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {contentCategories.map((category) => {
                  const Icon = category.icon;
                const isActive = activeTab === category.id;
                const contentCount = getFilteredContent(category.id).length;
                
                  return (
                                     <button
                        key={category.id}
                        onClick={() => setActiveTab(category.id)}
                                                 className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-200 border text-sm sm:text-base ${
                        isActive 
                             ? getActiveButtonClass(category.color)
                             : isDarkMode
                            ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' 
                               : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                         }`}
                      >
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span>{category.name}</span>
                                                 <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                             : isDarkMode
                            ? 'bg-white/10 text-gray-300' 
                            : 'bg-gray-200 text-gray-600'
                         }`}>
                       {contentCount}
                        </span>
                   </button>
                  );
                })}
              </div>

                                                           {/* Content Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
                {getFilteredContent(activeTab).map((item) => (
                  <div key={`${item.id}-${item.media_type}`} className="w-full h-80 sm:h-96">
                          <SafeUnifiedMovieCard
                            item={item}
                            config={{
                        cardWidth: 'w-full h-full',
                        iconSize: 20
                      }}
                    />
                        </div>
                ))}
                </div>

                         {/* Empty State */}
             {getFilteredContent(activeTab).length === 0 && (
                 <div className="text-center py-8 sm:py-12">
                 <div className="text-4xl sm:text-6xl mb-4 opacity-50">
                   {activeTab === 'movies' ? '🎬' : 
                    activeTab === 'series' ? '📺' : 
                    activeTab === 'anime-movies' ? '🎌' : 
                    activeTab === 'anime-series' ? '🌸' : 
                    activeTab === 'favourites' ? '❤️' : 
                    activeTab === 'watchlist' ? '📋' : 
                    activeTab === 'watching' ? '▶️' : 
                    activeTab === 'completed' ? '✅' : '📦'}
                   </div>
                 <h4 className={`text-lg sm:text-xl font-semibold mb-2 ${
                     isDarkMode ? 'text-white' : 'text-gray-900'
                   }`}>
                     No {contentCategories.find(c => c.id === activeTab)?.name || 'content'} yet
                 </h4>
                   <p className={`text-sm sm:text-base ${
                     isDarkMode ? 'text-gray-400' : 'text-gray-600'
                   }`}>
                   Start adding content to your {activeTab} to see it here
                   </p>
                 </div>
               )}
            </div>
      </div>

        {/* Modals */}
      <AnimatePresence>
          {/* Image Upload Modal */}
          {showImageUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowImageUpload(false)} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
                                 className={`relative max-w-md w-full p-6 rounded-2xl ${
                   isDarkMode ? 'bg-gray-900 border border-white/20' : 'bg-white border border-gray-200'
               }`}
            >
                             <h3 className={`text-xl font-bold mb-4 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>Change Profile Picture</h3>
                
                  <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full mb-4"
                />
                
                <div className="flex gap-3">
                      <button
                    onClick={() => setShowImageUpload(false)}
                                     className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                   }`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

          {/* Edit Profile Modal */}
          {showProfileEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelEdit} />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
                                 className={`relative max-w-lg w-full p-6 rounded-2xl ${
                   isDarkMode ? 'bg-gray-900 border border-white/20' : 'bg-white border border-gray-200'
               }`}
            >
                                                <h3 className={`text-xl font-bold mb-4 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
                 }`}>Edit Profile</h3>
                
                                 <div className="space-y-4">
                  {/* Username */}
                  <div>
                                                            <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Username
                   </label>
                    <input
                      type="text"
                      value={userProfile.username}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, username: e.target.value }))}
                                           className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                   isDarkMode 
                     ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                     : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                   }`}
                      placeholder="Enter username"
                    />
              </div>

                  {/* Bio */}
                  <div>
                                       <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Bio
                   </label>
                    <textarea
                      value={userProfile.bio}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
                                           rows={2}
                     className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                       isDarkMode 
                         ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                         : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                     }`}
                      placeholder="Tell us about yourself"
                    />
              </div>

                  {/* Email */}
                  <div>
                                       <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Email
                   </label>
                    <input
                      type="email"
                      value={userProfile.email}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                          : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                      }`}
                      placeholder="Enter email address"
                    />
                </div>

                  {/* Phone */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                      Phone
                  </label>
                  <input
                      type="tel"
                      value={userProfile.phone}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                    }`}
                      placeholder="Enter phone number"
                  />
                </div>

                  {/* Location */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                      Location
                  </label>
                  <input
                      type="text"
                      value={userProfile.location}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                        : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                    }`}
                      placeholder="Enter location"
                  />
                </div>
              </div>

                <div className="flex gap-3 mt-4">
                <button
                    onClick={handleCancelEdit}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                                 <button
                   onClick={handleSaveProfile}
                 className="flex-1 px-3 py-2 rounded-lg bg-black hover:bg-red-600 text-white transition-colors"
               >
                 Save Changes
               </button>
              </div>
            </motion.div>
          </motion.div>
                 )}

         {/* Add Profile Modal */}
         {showAddProfile && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4"
           >
             <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancelAddProfile} />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className={`relative max-w-md w-full p-6 rounded-2xl ${
                 isDarkMode ? 'bg-gray-900 border border-white/20' : 'bg-white border border-gray-200'
               }`}
             >
               <h3 className={`text-xl font-bold mb-4 ${
                 isDarkMode ? 'text-white' : 'text-gray-900'
               }`}>Add New Profile</h3>
               
               <div className="space-y-4">
                 {/* Profile Name */}
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Profile Name
                   </label>
                   <input
                     type="text"
                     value={newProfileName}
                     onChange={(e) => setNewProfileName(e.target.value)}
                     className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                       isDarkMode 
                         ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                         : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                     }`}
                     placeholder="Enter profile name"
                   />
                 </div>

                 {/* Avatar Selection */}
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Choose Avatar
                   </label>
                   <div className="grid grid-cols-6 gap-2">
                     {avatars.map((avatar, index) => (
                       <button
                         key={index}
                         onClick={() => setSelectedAvatar(avatar)}
                         className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all duration-200 ${
                           selectedAvatar === avatar
                             ? 'ring-2 ring-red-500 bg-red-100 dark:bg-red-900/30'
                             : isDarkMode
                             ? 'bg-gray-800 hover:bg-gray-700'
                             : 'bg-gray-100 hover:bg-gray-200'
                         }`}
                       >
                         {avatar}
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Email */}
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Email (Optional)
                   </label>
                   <input
                     type="email"
                     value={newProfileEmail || ''}
                     onChange={(e) => setNewProfileEmail(e.target.value)}
                     className={`w-full px-3 py-2 rounded-lg border transition-colors ${
                       isDarkMode 
                         ? 'bg-gray-800 border-gray-600 text-white focus:border-red-500' 
                         : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                     }`}
                     placeholder="Enter email address"
                   />
                 </div>
               </div>

               <div className="flex gap-3 mt-6">
                 <button
                   onClick={handleCancelAddProfile}
                   className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                     isDarkMode 
                       ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                       : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                   }`}
                 >
                   Cancel
                 </button>
                 <button
                   onClick={addProfile}
                   className="flex-1 px-3 py-2 rounded-lg bg-black hover:bg-red-600 text-white transition-colors"
                 >
                   Add Profile
                 </button>
               </div>
             </motion.div>
           </motion.div>
         )}
              </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfilePage; 