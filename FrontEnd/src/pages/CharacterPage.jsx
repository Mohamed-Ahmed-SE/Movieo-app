  import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Calendar, Play, Film, Tv, Info, Award, X, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiRequest } from '../utils/apiUtils';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useTheme } from '../contexts/ThemeContext';

const CharacterPage = () => {
  const { isDarkMode } = useTheme();
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [filmography, setFilmography] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedBio, setExpandedBio] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        setLoading(true);
        const [personResponse, filmographyResponse] = await Promise.all([
          apiRequest(`/person/${id}`),
          apiRequest(`/person/${id}/combined_credits`)
        ]);

        setPerson(personResponse.data);
        setFilmography(
          (filmographyResponse.data.cast || [])
            .sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date))
        );
      } catch (error) {
        console.error('Error fetching person data:', error);
        toast.error('Failed to load character information');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPersonData();
    }
  }, [id]);

  const filteredFilmography = filmography.filter(item => {
    if (activeTab === 'movie') return item.media_type === 'movie';
    if (activeTab === 'tv') return item.media_type === 'tv';
    return true;
  });

  const profileImage = person?.profile_path 
    ? `https://image.tmdb.org/t/p/original${person.profile_path}` 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.name || '')}&background=333&color=fff&size=500`;

  const featuredRoles = filmography
    .filter(item => item.vote_average > 7)
    .slice(0, 3);

  if (loading) {
    return (
      <div className={`min-h-screen pt-20 transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton height={32} width={120} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <Skeleton height={500} className="rounded-xl" />
            </div>
            <div className="md:col-span-2 space-y-6">
              <Skeleton height={60} width="80%" />
              <Skeleton height={24} width="40%" />
              <Skeleton height={24} width="60%" />
              <div className="space-y-3">
                <Skeleton height={24} />
                <Skeleton height={24} count={5} />
              </div>
            </div>
          </div>
          <Skeleton height={40} width="30%" className="mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height={300} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className={`min-h-screen flex items-center justify-center pt-20 transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className={`text-center p-8 rounded-2xl backdrop-blur-sm max-w-md mx-4 border ${
          isDarkMode ? 'bg-black border-white/20' : 'bg-white border-gray-200'
        }`}>
          <div className="text-6xl mb-6">🎭</div>
          <h2 className={`text-3xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Character Not Found</h2>
          <p className="text-white/60 mb-8">
            The character you're looking for doesn't exist or may have been removed.
          </p>
          <NavLink 
            to="/" 
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-lg font-bold transition-all duration-300 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 sm:pt-20 transition-all duration-500 ${
      isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Background Gradient */}
      <div className={`fixed inset-0 -z-10 ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900/20 via-black to-black'
          : 'bg-gradient-to-b from-gray-100/20 via-gray-50 to-gray-50'
      }`} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <NavLink 
            to=".." 
            className={`inline-flex items-center gap-2 transition-colors group ${
              isDarkMode 
                ? 'text-white/70 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <motion.div
              whileHover={{ x: -5 }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5 group-hover:text-white transition-colors" />
              <span className="group-hover:text-white transition-colors">Back</span>
            </motion.div>
          </NavLink>
        </motion.div>

        {/* Character Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-10 md:mb-12"
        >
          {/* Profile Image */}
          <div className="lg:col-span-1">
            <motion.div 
              className="relative group"
              whileHover={{ scale: 1.02 }}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl border border-white/20">
                <LazyLoadImage
                  src={profileImage}
                  alt={person.name}
                  effect="blur"
                  className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-none h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                  <div className="text-center w-full">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-medium text-sm inline-flex items-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      View Details
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Character Details */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 md:space-y-8">
            {/* Name and Basic Info */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {person.name}
              </h1>
              
              {featuredRoles.length > 0 && (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-white/60">Known for:</span>
                  {featuredRoles.map((role) => (
                    <span 
                      key={role.id}
                      className="text-xs sm:text-sm bg-white/10 text-white px-2 sm:px-3 py-1 rounded-full border border-white/20"
                    >
                      {role.title || role.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Facts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {person.birthday && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Birth Information</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{new Date(person.birthday).toLocaleDateString()}</p>
                  {person.deathday && (
                    <p className="text-white/60 text-sm mt-1">Died: {new Date(person.deathday).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              {person.known_for_department && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Known For</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{person.known_for_department}</p>
                </div>
              )}

              {person.place_of_birth && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 text-white/60">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Place of Birth</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{person.place_of_birth}</p>
                </div>
              )}

              {person.popularity && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Popularity</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{person.popularity.toFixed(1)}</p>
                </div>
              )}

              {person.gender && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 text-white/60">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" x2="12" y1="19" y2="22"></line>
                      <line x1="8" x2="16" y1="22" y2="22"></line>
                    </svg>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Gender</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{person.gender === 1 ? 'Female' : person.gender === 2 ? 'Male' : 'Other'}</p>
                </div>
              )}

              {person.adult && (
                <div className="p-3 sm:p-4 bg-black/50 rounded-xl border border-white/20">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 text-white/60">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <h4 className="text-xs sm:text-sm font-semibold text-white/60">Content Type</h4>
                  </div>
                  <p className="text-white text-sm sm:text-lg font-medium">{person.adult ? 'Adult Content' : 'Family Friendly'}</p>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography && (
              <div className="bg-black/50 rounded-2xl p-4 sm:p-6 border border-white/20 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-4 sm:h-4 text-white">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10,9 9,9 8,9"></polyline>
                      </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Biography</h3>
                  </div>
                  {person.biography.length > 300 && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setExpandedBio(!expandedBio)}
                      className="text-sm text-white/60 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {expandedBio ? 'Show Less' : 'Read More'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedBio ? 'rotate-180' : ''}`} />
                    </motion.button>
                  )}
                </div>
                <div className="relative">
                  <p className={`text-white/80 leading-relaxed ${!expandedBio ? 'overflow-hidden' : ''}`} style={{ 
                    display: !expandedBio ? '-webkit-box' : 'block',
                    WebkitLineClamp: !expandedBio ? '4' : 'none',
                    WebkitBoxOrient: !expandedBio ? 'vertical' : 'horizontal',
                    lineHeight: !expandedBio ? '1.6em' : '1.7em',
                    maxHeight: !expandedBio ? '6.4em' : 'none'
                  }}>
                    {person.biography}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filmography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 sm:mb-12 md:mb-16"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Filmography <span className="text-white/60">({filteredFilmography.length})</span>
            </h2>

            {/* Filter Tabs */}
            <div className="flex gap-1 sm:gap-2 bg-black/50 rounded-xl p-1 border border-white/20 backdrop-blur-sm">
              {[
                { key: 'all', label: 'All', icon: null },
                { key: 'movie', label: 'Movies', icon: Film },
                { key: 'tv', label: 'TV Shows', icon: Tv }
              ].map((tab) => (
                <motion.button
                  key={tab.key}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon && <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Filmography Grid */}
          {filteredFilmography.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {filteredFilmography
                .filter(item => {
                  // Filter out items without poster images
                  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
                  const contentPosterPath = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                  if (contentPosterPath) return true;
                  if (item?.poster_path) return true;
                  return false;
                })
                .map((item, index) => (
                <motion.div
                  key={`${item.id}-${item.media_type}`}
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <UnifiedMovieCard 
                    movie={item} 
                    index={index}
                    onClick={() => setSelectedMovie(item)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 md:py-16 bg-black/50 rounded-2xl border border-white/20 backdrop-blur-sm">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎬</div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                No {activeTab === 'movie' ? 'movies' : activeTab === 'tv' ? 'TV shows' : 'content'} found
              </h3>
              <p className="text-white/60 max-w-md mx-auto text-sm sm:text-base">
                {person.name} hasn't appeared in any {activeTab === 'movie' ? 'movies' : activeTab === 'tv' ? 'TV shows' : 'content'} yet.
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Movie Details Modal */}
      <AnimatePresence>
        {selectedMovie && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMovie(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMovie(null)}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 bg-black/50 rounded-full p-1 sm:p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="md:col-span-1">
                  <LazyLoadImage
                    src={`https://image.tmdb.org/t/p/original${selectedMovie.poster_path}`}
                    alt={selectedMovie.title || selectedMovie.name}
                    effect="blur"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="md:col-span-2 p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2">
                    {selectedMovie.title || selectedMovie.name}
                  </h3>
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs sm:text-sm border border-white/20">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                      {selectedMovie.vote_average?.toFixed(1)}
                    </span>
                    <span className="text-xs sm:text-sm text-white/60">
                      {selectedMovie.release_date?.substring(0, 4) || selectedMovie.first_air_date?.substring(0, 4)}
                    </span>
                    <span className="text-xs sm:text-sm text-white/60 capitalize">
                      {selectedMovie.media_type}
                    </span>
                  </div>
                  <p className="text-white/80 mb-3 sm:mb-4 text-sm sm:text-base">
                    {selectedMovie.overview || 'No description available.'}
                  </p>
                  <p className="text-xs sm:text-sm text-white/60 mb-1">
                    <span className="font-medium text-white/80">Character:</span> {selectedMovie.character || 'Unknown'}
                  </p>
                  <div className="mt-4 sm:mt-6">
                    <NavLink
                      to={`/${selectedMovie.media_type}/${selectedMovie.id}`}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                      View Details
                    </NavLink>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CharacterPage;