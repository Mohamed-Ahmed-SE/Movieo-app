import React, { useState, useEffect } from 'react';
import { mobileNavigation } from '../contants/navigation';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdSearch, MdClose, MdTrendingUp, MdMovie, MdLiveTv, MdHome, MdBookmark, MdExpandMore, MdExpandLess } from 'react-icons/md';

import { FaFire, FaStar, FaGlobe, FaCalendar, FaPlay, FaHeart, FaEye } from 'react-icons/fa';
import SearchModal from './SearchModal';
import { useTheme } from '../contexts/ThemeContext';
import { scrollToTopSmooth } from '../utils/scrollUtils';

// Import the same category structures from Header.jsx
// Language categories for Movies
const movieLanguageCategories = [
  { name: 'English Movies', href: '/explore/movie/language/english', icon: '🇺🇸' },
  { name: 'Spanish Movies', href: '/explore/movie/language/spanish', icon: '🇪🇸' },
  { name: 'French Movies', href: '/explore/movie/language/french', icon: '🇫🇷' },
  { name: 'German Movies', href: '/explore/movie/language/german', icon: '🇩🇪' },
  { name: 'Italian Movies', href: '/explore/movie/language/italian', icon: '🇮🇹' },
  { name: 'Portuguese Movies', href: '/explore/movie/language/portuguese', icon: '🇵🇹' },
  { name: 'Russian Movies', href: '/explore/movie/language/russian', icon: '🇷🇺' },
  { name: 'Japanese Movies', href: '/explore/movie/language/japanese', icon: '🇯🇵' },
  { name: 'Korean Movies', href: '/explore/movie/language/korean', icon: '🇰🇷' },
  { name: 'Chinese Movies', href: '/explore/movie/language/chinese', icon: '🇨🇳' },
  { name: 'Hindi Movies', href: '/explore/movie/language/hindi', icon: '🇮🇳' },
  { name: 'Arabic Movies', href: '/explore/movie/language/arabic', icon: '🇸🇦' },
];

// Language categories for Series
const tvLanguageCategories = [
  { name: 'English Series', href: '/explore/tv/language/english', icon: '🇺🇸' },
  { name: 'Spanish Series', href: '/explore/tv/language/spanish', icon: '🇪🇸' },
  { name: 'French Series', href: '/explore/tv/language/french', icon: '🇫🇷' },
  { name: 'German Series', href: '/explore/tv/language/german', icon: '🇩🇪' },
  { name: 'Italian Series', href: '/explore/tv/language/italian', icon: '🇮🇹' },
  { name: 'Portuguese Series', href: '/explore/tv/language/portuguese', icon: '🇵🇹' },
  { name: 'Russian Series', href: '/explore/tv/language/russian', icon: '🇷🇺' },
  { name: 'Japanese Series', href: '/explore/tv/language/japanese', icon: '🇯🇵' },
  { name: 'Korean Series', href: '/explore/tv/language/korean', icon: '🇰🇷' },
  { name: 'Chinese Series', href: '/explore/tv/language/chinese', icon: '🇨🇳' },
  { name: 'Hindi Series', href: '/explore/tv/language/hindi', icon: '🇮🇳' },
  { name: 'Arabic Series', href: '/explore/tv/language/arabic', icon: '🇸🇦' },
];

// Genre categories for Movies
const movieGenreCategories = [
  { name: 'Action Movies', href: '/explore/movie/genre/action', icon: '💥' },
  { name: 'Adventure Movies', href: '/explore/movie/genre/adventure', icon: '🗺️' },
  { name: 'Comedy Movies', href: '/explore/movie/genre/comedy', icon: '😂' },
  { name: 'Crime Movies', href: '/explore/movie/genre/crime', icon: '🕵️' },
  { name: 'Documentary Movies', href: '/explore/movie/genre/documentary', icon: '📹' },
  { name: 'Drama Movies', href: '/explore/movie/genre/drama', icon: '🎭' },
  { name: 'Family Movies', href: '/explore/movie/genre/family', icon: '👨‍👩‍👧‍👦' },
  { name: 'Fantasy Movies', href: '/explore/movie/genre/fantasy', icon: '🧙‍♂️' },
  { name: 'History Movies', href: '/explore/movie/genre/history', icon: '📚' },
  { name: 'Horror Movies', href: '/explore/movie/genre/horror', icon: '👻' },
  { name: 'Music Movies', href: '/explore/movie/genre/music', icon: '🎵' },
  { name: 'Mystery Movies', href: '/explore/movie/genre/mystery', icon: '🔍' },
  { name: 'Romance Movies', href: '/explore/movie/genre/romance', icon: '💕' },
  { name: 'Sci-Fi Movies', href: '/explore/movie/genre/sci-fi', icon: '🚀' },
  { name: 'Thriller Movies', href: '/explore/movie/genre/thriller', icon: '😱' },
  { name: 'War Movies', href: '/explore/movie/genre/war', icon: '⚔️' },
  { name: 'Western Movies', href: '/explore/movie/genre/western', icon: '🤠' },
];

// Genre categories for Series
const tvGenreCategories = [
  { name: 'Action Series', href: '/explore/tv/genre/action', icon: '💥' },
  { name: 'Adventure Series', href: '/explore/tv/genre/adventure', icon: '🗺️' },
  { name: 'Comedy Series', href: '/explore/tv/genre/comedy', icon: '😂' },
  { name: 'Crime Series', href: '/explore/tv/genre/crime', icon: '🕵️' },
  { name: 'Documentary Series', href: '/explore/tv/genre/documentary', icon: '📹' },
  { name: 'Drama Series', href: '/explore/tv/genre/drama', icon: '🎭' },
  { name: 'Family Series', href: '/explore/tv/genre/family', icon: '👨‍👩‍👧‍👦' },
  { name: 'Fantasy Series', href: '/explore/tv/genre/fantasy', icon: '🧙‍♂️' },
  { name: 'Romance Series', href: '/explore/tv/genre/romance', icon: '💕' },
  { name: 'Sci-Fi Series', href: '/explore/tv/genre/sci-fi', icon: '🚀' },
  { name: 'Thriller Series', href: '/explore/tv/genre/thriller', icon: '😱' },
  { name: 'Animation Series', href: '/explore/tv/genre/animation', icon: '🎨' },
];

// Year categories
const yearCategories = [
  { name: '2024', key: '2024', icon: '📅' },
  { name: '2023', key: '2023', icon: '📅' },
  { name: '2022', key: '2022', icon: '📅' },
  { name: '2021', key: '2021', icon: '📅' },
  { name: '2020', key: '2020', icon: '📅' },
  { name: '2019', key: '2019', icon: '📅' },
  { name: '2018', key: '2018', icon: '📅' },
  { name: '2017', key: '2017', icon: '📅' },
  { name: '2016', key: '2016', icon: '📅' },
  { name: '2015', key: '2015', icon: '📅' },
];

// Year categories for Movies
const movieYearCategories = yearCategories.map(cat => ({
  name: cat.name + ' Movies',
  href: `/explore/movie/year/${cat.key}`,
  icon: cat.icon
}));

// Year categories for Series
const tvYearCategories = yearCategories.map(cat => ({
  name: cat.name + ' Series',
  href: `/explore/tv/year/${cat.key}`,
  icon: cat.icon
}));

// Anime categories function (same as Header.jsx)
const getAnimeCategories = (mediaType) => {
  return [
    {
      name: `All Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime`,
      icon: '🎮'
    },
    {
      name: `Romance Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/romance`,
      icon: '💕'
    },
    {
      name: `Action Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/action`,
      icon: '⚔️'
    },
    {
      name: `Drama Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/drama`,
      icon: '🎭'
    },
    {
      name: `Adventure Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/adventure`,
      icon: '🗺️'
    },
    {
      name: `Comedy Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/comedy`,
      icon: '😄'
    },
    {
      name: `Sci-Fi Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/sci-fi`,
      icon: '🚀'
    },
    {
      name: `Fantasy Anime ${mediaType === 'movie' ? 'Movies' : 'Series'}`,
      href: `/explore/${mediaType}/anime/fantasy`,
      icon: '🧙‍♂️'
    }
  ];
};

// Animation Cartoons categories for Movies (direct click, no subcategories)
const movieAnimationDirect = {
  name: 'Animation Cartoons Movies',
  href: '/explore/movie/animation',
  icon: '🎨'
};

// Animation Cartoons categories for Series (direct click, no subcategories)
const tvAnimationDirect = {
  name: 'Animation Cartoons Series',
  href: '/explore/tv/animation',
  icon: '🎨'
};

// Static category sections (same as Header.jsx)
const movieStaticCategories = [
  { name: 'Language', categories: movieLanguageCategories, icon: '🌍' },
  { name: 'Genre', categories: movieGenreCategories, icon: '🎬' },
  { name: 'Year', categories: movieYearCategories, icon: '📅' },
  { name: 'Animation Cartoons', categories: [movieAnimationDirect], icon: '🎨' },
];

const tvStaticCategories = [
  { name: 'Language', categories: tvLanguageCategories, icon: '🌍' },
  { name: 'Genre', categories: tvGenreCategories, icon: '🎬' },
  { name: 'Year', categories: tvYearCategories, icon: '📅' },
];

// Filter out Movies and Series from mobile navigation
const filteredMobileNavigation = mobileNavigation.filter(nav => 
  nav.label !== 'Movies' && nav.label !== 'Series'
);

const MobileNavigation = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeType, setActiveType] = useState(null); // 'movie' or 'tv'
  const [selectedCategory, setSelectedCategory] = useState(null); // Selected main category
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Smart scroll behavior - hide when scrolling down, show when scrolling up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);
  
  // Check if current route matches any nav item
  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = () => {
    scrollToTopSmooth();
  };

  const handleCategoryClick = (category, type = null) => {
    scrollToTopSmooth();
    if (type) {
      navigate(`/explore/${type}/${category}`);
    } else {
      navigate(`/explore/${category}`);
    }
    setShowCategoryModal(false);
  };

  const handleMainCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleSubcategoryClick = (subcategory) => {
    scrollToTopSmooth();
    navigate(subcategory.href);
    setShowCategoryModal(false);
    setSelectedCategory(null);
  };

  const getMainCategories = (type) => {
    const mediaType = type === 'movie' ? 'movie' : 'tv';
    const animeCategories = getAnimeCategories(mediaType);
    
    if (type === 'movie') {
      return [
        ...movieStaticCategories.slice(0, 3), // Language, Genre, Year
        { name: 'Anime', categories: animeCategories, icon: '🎮' },
        ...movieStaticCategories.slice(3) // Animation Cartoons
      ];
    } else {
      return [
        ...tvStaticCategories.slice(0, 3), // Language, Genre, Year
        { name: 'Anime', categories: animeCategories, icon: '🎮' }
      ];
    }
  };

  // Get icon for nav item
  const getNavIcon = (label) => {
    switch (label) {
      case 'Home':
        return <MdHome />;

      case 'Watchlist':
        return <MdBookmark />;
      case 'Search':
        return <MdSearch />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Mobile Navigation Bar */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            className={`fixed bottom-0 left-0 right-0 backdrop-blur-md border-t z-50 lg:hidden ${
              isDarkMode 
                ? 'bg-neutral-900/95 border-neutral-800'
                : 'bg-white/95 border-gray-200'
            }`}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center justify-around px-1 sm:px-2 py-2">
              {filteredMobileNavigation.map((nav) => (
                <NavLink
                  key={nav.label}
                  to={nav.href}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'text-red-500 bg-red-500/10' 
                        : isDarkMode
                          ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`
                  }
                >
                  <div className="text-lg sm:text-xl">
                    {getNavIcon(nav.label) || nav.icon}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[60px] sm:max-w-none">{nav.label}</span>
                </NavLink>
              ))}
              
              {/* Movies & Series Dropdown Button */}
              <button
                onClick={() => setShowCategoryModal(true)}
                className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 ${
                  isDarkMode
                    ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="text-lg sm:text-xl">
                  <MdExpandMore />
                </div>
                <span className="text-xs font-medium truncate max-w-[60px] sm:max-w-none">More</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal - Bottom Sheet Style */}
      <AnimatePresence>
        {showCategoryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCategoryModal(false);
                setSelectedCategory(null);
              }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed bottom-0 left-0 right-0 backdrop-blur-md border-t rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-hidden ${
                isDarkMode 
                  ? 'bg-neutral-900/95 border-neutral-700'
                  : 'bg-white/95 border-gray-200'
              }`}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className={`w-12 h-1 rounded-full ${
                  isDarkMode ? 'bg-neutral-600' : 'bg-gray-400'
                }`}></div>
              </div>

              <div className="px-4 pb-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Explore Content</h2>
                  <button
                    onClick={() => {
                      setShowCategoryModal(false);
                      setSelectedCategory(null);
                    }}
                    className={`p-2 transition-colors ${
                      isDarkMode 
                        ? 'text-neutral-400 hover:text-white'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <MdClose size={24} />
                  </button>
                </div>

                {/* Type Selection */}
                {!activeType && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveType('movie')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${
                        isDarkMode 
                          ? 'bg-neutral-800 hover:bg-neutral-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <MdMovie size={24} className="text-red-500" />
                      <div>
                        <div className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Movies</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                        }`}>Explore movies by category</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setActiveType('tv')}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${
                        isDarkMode 
                          ? 'bg-neutral-800 hover:bg-neutral-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <MdLiveTv size={24} className="text-blue-500" />
                      <div>
                        <div className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Series</div>
                        <div className={`text-sm ${
                          isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                        }`}>Explore TV series by category</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Main Categories */}
                {activeType && !selectedCategory && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => {
                          setActiveType(null);
                          setSelectedCategory(null);
                        }}
                        className={`p-2 transition-colors ${
                          isDarkMode 
                            ? 'text-neutral-400 hover:text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <MdClose size={20} />
                      </button>
                      <span className={`font-semibold capitalize ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{activeType}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {getMainCategories(activeType).map((category) => (
                        <button
                          key={category.name}
                          onClick={() => handleMainCategorySelect(category)}
                          className={`flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${
                            isDarkMode 
                              ? 'bg-neutral-800 hover:bg-neutral-700'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <div className="flex-1">
                            <div className={`font-semibold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{category.name}</div>
                            <div className={`text-sm ${
                              isDarkMode ? 'text-neutral-400' : 'text-gray-600'
                            }`}>{category.categories.length} options</div>
                          </div>
                          <MdExpandMore size={20} className={`${
                            isDarkMode ? 'text-neutral-400' : 'text-gray-500'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subcategories */}
                {selectedCategory && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={`p-2 transition-colors ${
                          isDarkMode 
                            ? 'text-neutral-400 hover:text-white'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <MdClose size={20} />
                      </button>
                      <span className={`font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{selectedCategory.name}</span>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                      <div className="grid grid-cols-1 gap-2">
                        {selectedCategory.categories.map((subcategory) => (
                          <button
                            key={subcategory.href}
                            onClick={() => handleSubcategoryClick(subcategory)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                              isDarkMode 
                                ? 'bg-neutral-800 hover:bg-neutral-700'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            <span className="text-lg">{subcategory.icon}</span>
                            <span className={`truncate ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{subcategory.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </>
  );
};

export default MobileNavigation;