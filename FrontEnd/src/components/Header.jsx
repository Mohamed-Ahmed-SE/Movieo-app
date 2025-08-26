import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Home, Film, Tv, Bookmark, Play, Settings, User, LogOut, ChevronDownIcon, Globe, Star, Calendar, Zap, Moon, Sun, ArrowRight } from 'lucide-react';
import { Disclosure, Menu as HeadlessMenu, Transition } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import SearchModal from './SearchModal';
import { yearCategories } from '../utils/categoryUtils';
import { useTheme } from '../contexts/ThemeContext';

// Custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #ef4444, #8b5cf6);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #dc2626, #7c3aed);
  }
`;

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Movies', href: '/movie', icon: Film, hasDropdown: true },
  { name: 'Series', href: '/tv', icon: Tv, hasDropdown: true },
  { name: 'Watchlist', href: '/watchlist', icon: Bookmark },
];

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

// Normalize all anime, genre, language, year, and rating dropdown subcategory keys to match ExplorePage
const normalizeKey = str => (str ? str.toLowerCase().replace(/\s+/g, '-') : '');

// Static anime categories - consistent across all pages
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

// Debug logging for animation dropdowns
console.log('movieAnimationDirect:', movieAnimationDirect);
console.log('tvAnimationDirect:', tvAnimationDirect);

// Static category sections (without anime - anime will be added dynamically)
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

const Header = () => {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Safely use theme context
  let isDarkMode = true;
  let toggleTheme = () => {};
  let isThemeLoading = false;
  
  try {
    const theme = useTheme();
    isDarkMode = theme.isDarkMode;
    toggleTheme = theme.toggleTheme;
    isThemeLoading = theme.isThemeLoading;
  } catch (error) {
    console.warn('Theme context not available:', error);
  }
  


  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    setIsSearchOpen(true);
    toast.success('Search opened!');
  };

  const handleDockToggle = () => {
    setIsDockOpen(!isDockOpen);
    toast.success(isDockOpen ? 'Dock closed!' : 'Dock opened!');
  };

  const DropdownMenu = ({ categories, title }) => (
    <HeadlessMenu as="div" className="relative">
      <HeadlessMenu.Button className={`flex items-center gap-2 transition-colors group ${
        isDarkMode 
          ? 'text-white/80 hover:text-white'
          : 'text-black hover:text-black'
      }`}>
        <span className="font-medium">{title}</span>
        <ChevronDownIcon className="w-4 h-4 transition-transform group-hover:rotate-180" />
      </HeadlessMenu.Button>
      
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <HeadlessMenu.Items className={`absolute top-full mt-2 backdrop-blur-md border rounded-xl shadow-2xl min-w-[300px] max-h-[500px] overflow-y-auto overflow-hidden z-50 ${
          isDarkMode 
            ? 'bg-black/95 border-white/10'
            : 'bg-white/95 border-gray-200'
        }`}>
          <div className="p-4">
            <h3 className={`text-sm font-semibold px-2 py-1 mb-2 ${
              isDarkMode ? 'text-white/60' : 'text-gray-600'
            }`}>
              {title} Categories
            </h3>
            <div className="grid grid-cols-2 gap-1">
              {categories.map((category) => (
                <HeadlessMenu.Item key={category.name}>
                  {({ active }) => (
                    <Link
                      to={category.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active 
                          ? 'bg-red-600 text-white' 
                          : isDarkMode 
                            ? 'text-white/80 hover:text-white hover:bg-white/10'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">{category.icon}</span>
                      <span className="truncate">{category.name}</span>
                    </Link>
                  )}
                </HeadlessMenu.Item>
              ))}
            </div>
          </div>
        </HeadlessMenu.Items>
      </Transition>
    </HeadlessMenu>
  );

  const MainCategoryDropdown = ({ title }) => {
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const mediaType = title === 'Movies' ? 'movie' : 'tv';
    
    // Get static anime categories
    const animeCategories = getAnimeCategories(mediaType);
    
          // Create main categories with static anime categories
      let mainCategories;
      if (title === 'Movies') {
        mainCategories = [
          ...movieStaticCategories.slice(0, 3), // Language, Genre, Year
          { name: 'Anime', categories: animeCategories, icon: '🎮' },
          ...movieStaticCategories.slice(3) // Animation Cartoons
        ];
      } else {
        mainCategories = [
          ...tvStaticCategories.slice(0, 3), // Language, Genre, Year
          { name: 'Anime', categories: animeCategories, icon: '🎮' }
        ];
      }

    // Debug logging
    console.log('MainCategoryDropdown:', { title, mainCategories, hoveredCategory });

    return (
      <div className="relative">
        <button 
          className={`flex items-center gap-2 transition-colors duration-200 ${
            isDarkMode 
              ? 'text-white/80 hover:text-white'
              : 'text-black hover:text-black'
          }`}
          onMouseEnter={() => {
            setIsOpen(true);
            console.log('Dropdown opened for:', title);
          }}
          onMouseLeave={() => {
            setIsOpen(false);
            setHoveredCategory(null);
            console.log('Dropdown closed for:', title);
          }}
        >
          <span className="font-medium">{title}</span>
          <ChevronDownIcon className="w-4 h-4 transition-transform duration-200" />
        </button>
        
        <Transition
          as={React.Fragment}
          show={isOpen}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <div 
            className={`absolute top-full mt-2 backdrop-blur-sm border rounded-lg shadow-lg min-w-[600px] z-50 ${
              isDarkMode 
                ? 'bg-black/95 border-white/20'
                : 'bg-white/95 border-gray-200'
            }`}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => {
              setIsOpen(false);
              setHoveredCategory(null);
            }}
          >
            <div className="p-4">
              <div className="flex">
                {/* Main categories column */}
                <div className={`w-56 border-r pr-4 ${
                  isDarkMode ? 'border-white/20' : 'border-gray-200'
                }`}>
                  <div className="space-y-1">
                    {mainCategories.map((category) => (
                      <div
                        key={category.name}
                        className="relative"
                        onMouseEnter={() => {
                          setHoveredCategory(category);
                          console.log('Hovered category:', category);
                        }}
                      >
                        <div className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer transition-colors ${
                          isDarkMode 
                            ? 'text-white/80 hover:text-white hover:bg-white/10'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}>
                          <span className="text-lg">{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                        
                        {/* Active indicator */}
                        {hoveredCategory?.name === category.name && (
                          <div className="absolute left-0 top-0 w-1 h-full bg-red-500 rounded-r"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subcategories panel */}
                <div className="flex-1 pl-4">
                  {hoveredCategory ? (
                    <div>
                      {/* Subcategory header */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{hoveredCategory.icon}</span>
                          <h4 className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{hoveredCategory.name}</h4>
                        </div>
                        <p className={`text-xs ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>
                          {hoveredCategory.categories.length} options
                        </p>
                      </div>

                      {/* Subcategories grid */}
                      <div className="grid grid-cols-2 gap-1 max-h-[400px] overflow-y-auto">
                        {hoveredCategory.categories.map((subCategory) => {
                          console.log('Rendering subcategory:', subCategory);
                          return (
                            <Link
                              key={subCategory.name}
                              to={subCategory.href}
                              className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                                isDarkMode 
                                  ? 'text-white/80 hover:text-white hover:bg-white/10'
                                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-sm">{subCategory.icon}</span>
                              <span className="truncate">{subCategory.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <p className={`text-sm ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>Hover over a category</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    );
  };

  return (
    <>
      {/* Enhanced Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? isDarkMode 
              ? 'bg-black/80 backdrop-blur-sm border-b border-white/10'
              : 'bg-white/80 backdrop-blur-sm border-b border-gray-200'
            : isDarkMode
              ? 'bg-gradient-to-b from-black/50 to-transparent'
              : 'bg-gradient-to-b from-white/30 to-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ zIndex: 1000 }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Movieo
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                
                if (item.hasDropdown) {
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <item.icon className="w-5 h-5" />
                      {item.name === 'Movies' ? (
                        <div className="hidden lg:block">
                          <MainCategoryDropdown title="Movies" />
                        </div>
                      ) : item.name === 'Series' ? (
                        <div className="hidden lg:block">
                          <MainCategoryDropdown title="Series" />
                        </div>
                      ) : (
                        <NavLink
                          to={item.href}
                          className={({ isActive }) =>
                            `font-medium transition-colors ${
                              isActive ? 'text-white' : 'text-white/80 hover:text-white'
                            }`
                          }
                        >
                          {item.name}
                        </NavLink>
                      )}
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={item.href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      to={item.href}
                      className={`flex items-center gap-2 transition-colors ${
                        isActive 
                          ? 'text-red-500' 
                          : isDarkMode 
                            ? 'text-white/80 hover:text-white'
                            : 'text-black hover:text-black'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Mobile Dropdown Buttons - Removed Movies and Series for mobile */}
            <div className="flex items-center gap-2 lg:hidden">
              {/* Movies and Series removed from mobile header - use bottom navigation instead */}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                disabled={isThemeLoading}
                className={`p-2 sm:p-3 rounded-full backdrop-blur-sm border transition-all ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                } ${isThemeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isThemeLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full"
                  />
                ) : (
                  isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </motion.button>

              {/* Search Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSearch}
                className={`p-2 sm:p-3 rounded-full backdrop-blur-sm border transition-all ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                }`}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              {/* Dock Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDockToggle}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-2 sm:p-3 rounded-full shadow-lg transition-all"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>


            </div>
          </div>
        </div>
      </motion.header>

      {/* Custom Dock */}
      <AnimatePresence>
        {isDockOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDockOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />
            
            {/* Dock Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed top-20 right-0 h-full w-80 backdrop-blur-md border-l z-50 ${
                isDarkMode
                  ? 'bg-black/95 border-white/10'
                  : 'bg-white/95 border-gray-200'
              }`}
            >
              <div className="h-full p-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Quick Actions</h2>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsDockOpen(false)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                      isDarkMode 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <X className={`w-4 h-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`} />
                  </motion.button>
                </div>
                
                <div className="space-y-6">
                  <Link to="/profile">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsDockOpen(false)}
                      className={`w-full p-5 rounded-xl flex items-center justify-between transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-red-600' : 'bg-red-500'
                        }`}>
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-60" />
                    </motion.button>
                  </Link>
                  
                  <div className="mb-8"></div>
                  
                  <Link to="/settings">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsDockOpen(false)}
                      className={`w-full p-5 rounded-xl flex items-center justify-between transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-blue-600' : 'bg-blue-500'
                        }`}>
                          <Settings className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-60" />
                    </motion.button>
                  </Link>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={toggleTheme}
                    className={`w-full p-5 rounded-xl flex items-center justify-between transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500'
                      }`}>
                        {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
                      </div>
                      <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-5 rounded-xl flex items-center justify-between transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-gray-600' : 'bg-gray-500'
                      }`}>
                        <LogOut className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium">Logout</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-60" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Header;