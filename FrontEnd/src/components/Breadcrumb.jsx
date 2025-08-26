import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MdChevronRight, MdHome } from 'react-icons/md';

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(segment => segment);

  // Define readable names for different segments
  const getReadableName = (segment, index) => {
    const segmentMap = {
      'explore': 'Explore',
      'movie': 'Movies',
      'tv': 'TV Shows',
      'search': 'Search',

      'bookmarks': 'Bookmarks',
      'settings': 'Settings',
      // Categories
      'action': 'Action',
      'comedy': 'Comedy',
      'drama': 'Drama',
      'horror': 'Horror',
      'romance': 'Romance',
      'sci-fi': 'Sci-Fi',
      'thriller': 'Thriller',
      // Languages
      'english': 'English',
      'spanish': 'Spanish',
      'korean': 'Korean',
      'japanese': 'Japanese',
      'hindi': 'Hindi',
      'french': 'French',
      // Popular
      'trending': 'Trending Now',
      'top-rated': 'Top Rated',
      'upcoming': 'Upcoming',
      // Collections
      'marvel': 'Marvel Cinematic',
      'dc': 'DC Universe',
      'pixar': 'Pixar Animation',
      'ghibli': 'Studio Ghibli',
      // Special categories
      'anime': 'Anime',
      'arabic': 'Arabic',
    };

    return segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Don't show breadcrumb on home page
  if (pathSegments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2 text-sm text-neutral-400 mb-4 px-1 sm:px-0"
    >
      <Link 
        to="/" 
        className="flex items-center gap-1 hover:text-white transition-colors duration-200"
      >
        <MdHome size={16} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      
      {pathSegments.map((segment, index) => {
        const isLast = index === pathSegments.length - 1;
        const readableName = getReadableName(segment, index);
        
        return (
          <React.Fragment key={index}>
            <MdChevronRight size={16} className="text-neutral-600" />
            {isLast ? (
              <span className="text-white font-medium">{readableName}</span>
            ) : (
              <Link
                to={`/${pathSegments.slice(0, index + 1).join('/')}`}
                className="hover:text-white transition-colors duration-200"
              >
                {readableName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </motion.div>
  );
};

export default Breadcrumb; 