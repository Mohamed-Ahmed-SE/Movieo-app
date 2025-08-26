import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useHotkeys } from 'react-hotkeys-hook';
import { debounce } from 'lodash';
import UnifiedMovieCard from './UnifiedMovieCard';
import { getMediaType } from '../utils/mediaTypeUtils';
import { useTheme } from '../contexts/ThemeContext';

const HorizontalScrollCard = ({ 
  data = [], 
  heading, 
  subheading,
  trending, 
  media_type,
  cardWidth = 200, // Desktop/laptop default width
  scrollAmount = 200, // Reduced from 300 to 200
  gap = 8, // Standardized to 8 (gap-2) for consistent spacing
  showControls = true,
  showPagination = true,
  autoScroll = false,
  autoScrollInterval = 5000,
  customCardComponent,
  anime
}) => {
  const { isDarkMode } = useTheme();
  const containerRef = useRef();
  const [isHovered, setIsHovered] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const autoScrollTimer = useRef(null);
  const [animeList, setAnimeList] = useState([]);
  const [responsiveCardWidth, setResponsiveCardWidth] = useState(cardWidth);

  // Responsive card width calculation
  const getResponsiveCardWidth = useCallback(() => {
    // Mobile: 140px (2 cards visible + gap)
    // Tablet: 160px (2-3 cards visible)
    // Desktop: Use the provided cardWidth (200px default)
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 640) return 170; // Mobile
      if (width < 1024) return 200; // Tablet
      return cardWidth; // Desktop/laptop
    }
    return cardWidth; // Fallback
  }, [cardWidth]);

  // Update responsive card width on mount and resize
  useEffect(() => {
    const updateCardWidth = () => {
      setResponsiveCardWidth(getResponsiveCardWidth());
    };

    updateCardWidth();
    window.addEventListener('resize', updateCardWidth);
    return () => window.removeEventListener('resize', updateCardWidth);
  }, [getResponsiveCardWidth]);

  // Keyboard navigation
  useHotkeys('left', () => handleScroll('left'), { enabled: isHovered });
  useHotkeys('right', () => handleScroll('right'), { enabled: isHovered });

  // Calculate scroll position and update controls
  const checkScrollPosition = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    
    // Calculate active index using responsive card width
    const index = Math.round(scrollLeft / (responsiveCardWidth + gap));
    setActiveIndex(Math.min(index, data.length - 1));
  }, [responsiveCardWidth, gap, data.length]);

  // Debounced scroll position check
  const debouncedCheckScrollPosition = useCallback(
    debounce(checkScrollPosition, 100),
    [checkScrollPosition]
  );

  // Handle scroll with momentum
  const handleScroll = useCallback((direction) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const scrollBy = direction === 'left' ? -scrollAmount : scrollAmount;
    
    container.scrollBy({ 
      left: scrollBy,
      behavior: 'smooth'
    });
  }, [scrollAmount]);

  // Scroll to specific index
  const scrollToIndex = useCallback((index) => {
    if (!containerRef.current || index < 0 || index >= data.length) return;
    
    containerRef.current.scrollTo({
      left: index * (responsiveCardWidth + gap),
      behavior: 'smooth'
    });
    setActiveIndex(index);
  }, [responsiveCardWidth, gap, data.length]);

  // Auto-scroll functionality
  useEffect(() => {
    if (!autoScroll || autoScrollPaused || !canScrollRight || !containerRef.current) {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      return;
    }

    autoScrollTimer.current = setInterval(() => {
      if (!containerRef.current) return;
      
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
      const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;
      
      if (isAtEnd) {
        // If at end, scroll back to start
        containerRef.current.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      } else {
        // Otherwise scroll right
        handleScroll('right');
      }
    }, autoScrollInterval);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [autoScroll, autoScrollInterval, autoScrollPaused, canScrollRight, handleScroll]);

  // Setup scroll and resize listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScrollEvent = () => debouncedCheckScrollPosition();
    container.addEventListener('scroll', handleScrollEvent);
    
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);
    
    // Initial check
    checkScrollPosition();
    
    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      resizeObserver.disconnect();
      debouncedCheckScrollPosition.cancel();
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [debouncedCheckScrollPosition, checkScrollPosition]);

  // Memoized card items for performance
  const scrollData = anime ? animeList : data;

  const cardItems = React.useMemo(() => (
    scrollData
      .filter(item => {
        // Filter out items without poster images
        const mediaType = getMediaType(item);
        const contentPosterPath = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
        if (contentPosterPath) return true;
        if (item?.poster_path) return true;
        return false;
      })
      .map((item, index) => {
        const CardComponent = customCardComponent || UnifiedMovieCard;
        const cardProps = customCardComponent
          ? { movie: item, index, size: 'medium' }
          : { movie: item, index, size: 'medium' };
        return (
          <motion.div
            key={`${item.id}-${index}`}
            className="snap-start flex-shrink-0"
            style={{ width: `${responsiveCardWidth}px` }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <CardComponent {...cardProps} />
          </motion.div>
        );
      })
  ), [scrollData, trending, media_type, customCardComponent, responsiveCardWidth]);

  // Fix: Only update animeList if anime is true and data is different
  useEffect(() => {
    if (anime) {
      // Map TMDB results to TMDB-like structure
      const mapped = data.map(item => ({
        id: item.id,
        poster_path: item.poster_path,
        overview: item.overview,
        title: item.title,
        vote_average: item.vote_average,
        release_date: item.release_date,
        media_type: item.media_type,
        genres: item.genres || [],
        episodes: item.episodes,
      }));
      // Only update if mapped is different from current animeList
      const mappedString = JSON.stringify(mapped);
      const animeListString = JSON.stringify(animeList);
      if (mappedString !== animeListString) {
        setAnimeList(mapped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anime, data]);

  return (
    <div
      className="w-full my-6 relative" // Reduced margin from my-8 to my-6
      onMouseEnter={() => {
        setIsHovered(true);
        if (autoScroll) setAutoScrollPaused(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        if (autoScroll) setAutoScrollPaused(false);
      }}
    >
      {/* Header section - Responsive */}
      <div className="flex items-end justify-between px-3 sm:px-4 mb-3"> {/* Responsive padding */}
        <div>
          <h2 className={`text-lg sm:text-xl md:text-2xl font-bold tracking-tight ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {heading}
          </h2>
          {subheading && (
            <p className={`text-xs mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>{subheading}</p>
          )}
        </div>
        
        {showPagination && data.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scrollToIndex(activeIndex - 1)}
              disabled={!canScrollLeft}
              className={`p-1 disabled:opacity-30 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Previous"
            >
              <FiChevronLeft size={16} />
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, data.length) }).map((_, i) => {
                // Calculate the index to display (for large datasets)
                const displayIndex = data.length <= 5 
                  ? i 
                  : Math.min(
                      Math.max(activeIndex - 2, 0) + i, 
                      data.length - 1
                    );
                
                return (
                  <button
                    key={i}
                    onClick={() => scrollToIndex(displayIndex)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      activeIndex === displayIndex 
                        ? isDarkMode ? 'bg-white w-3' : 'bg-gray-900 w-3'
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                    }`}
                    aria-label={`Go to item ${displayIndex + 1}`}
                  />
                );
              })}
            </div>
            
            <button
              onClick={() => scrollToIndex(activeIndex + 1)}
              disabled={!canScrollRight}
              className={`p-1 disabled:opacity-30 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Next"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Scroll container */}
      <div className="relative group">
          {/* Navigation Controls - Completely removed for cleaner design */}
          
          {/* Subtle gradient shadow effects for better visual flow */}
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-5"></div>
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-5"></div>

        {/* Scrollable content */}
        <div
          ref={containerRef}
          className="flex overflow-x-auto scrollbar-hide pl-4 pr-4 pb-4 snap-x snap-mandatory hide-scrollbar"
          style={{ 
            scrollBehavior: 'smooth',
            scrollSnapType: 'x mandatory',
            gap: `${gap}px`
          }}
        >
          {cardItems}
          {/* Add extra space at the end for better scrolling */}
          <div className="flex-shrink-0 w-2" /> {/* Smaller end space */}
        </div>
      </div>

      {/* Mobile pagination - Responsive */}
      {showPagination && data.length > 0 && (
        <div className="sm:hidden flex justify-center gap-1.5 mt-3">
          {Array.from({ length: Math.min(5, data.length) }).map((_, i) => {
            const displayIndex = data.length <= 5 
              ? i 
              : Math.min(
                  Math.max(activeIndex - 2, 0) + i, 
                  data.length - 1
                );
            
            return (
              <button
                key={i}
                onClick={() => scrollToIndex(displayIndex)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${activeIndex === displayIndex ? 'bg-white w-3' : 'bg-gray-600'}`}
                aria-label={`Go to item ${displayIndex + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default React.memo(HorizontalScrollCard);