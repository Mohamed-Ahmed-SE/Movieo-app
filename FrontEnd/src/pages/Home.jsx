import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, TrendingUp, Clock, Heart, Film, Tv, Bookmark, Grid3X3, List, Share2, Calendar, Users, Award, Globe, Eye, Download, Info, ImageIcon, MessageCircle, ArrowRight, DollarSign, Edit3, Search, Filter, Settings, User, Bell, Crown, Zap, Target, Sparkles, Rocket, Shield, Gift, Trophy, Medal, Diamond, Gem, Crown as CrownIcon } from 'lucide-react';
import { useSelector } from 'react-redux';
import BannerHome from '../components/BannerHome';
import HorizontalScrollCard from '../components/HorizontalScollCard';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import { CustomSkeletonLoader } from '../components/EnhancedLoader';
import Breadcrumb from '../components/Breadcrumb';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { getTrending, getNowPlaying, getTopRated, getTrendingTV, getUpcoming, getPopular, discover } from '../utils/apiUtils';
import { applyContentFilters } from '../utils/contentFilter.js';
import moment from 'moment';

const Home = () => {
  const { isDarkMode } = useTheme();
  const [bannerData, setBannerData] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [trendingTV, setTrendingTV] = useState([]);
  const [upcomingMovies, setUpcomingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [dramaMovies, setDramaMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [animationMovies, setAnimationMovies] = useState([]);
  const [documentaryMovies, setDocumentaryMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalShows: 0,
    totalUsers: 0,
    totalHours: 0
  });
  const { imageURL } = useSelector((state) => state.movieoData);

  // Helper function to process data and add correct media_type based on Animation genre
  const processDataForAnime = (data) => {
    if (!data || !Array.isArray(data)) return data;
    
    // First apply content filtering to remove adult/sexual content using user settings
    const filteredData = applyContentFilters(data);
    
    return filteredData.map(item => {
      // Check if it's explicitly marked as anime
      if (item.media_type === 'anime') {
        return { ...item, media_type: 'anime' };
      }
      
      // Check ONLY for Animation genre
      const hasAnimationGenre = item.genres?.some(genre => 
        genre.name?.toLowerCase().includes('animation')
      );
      
      if (hasAnimationGenre) {
        return { ...item, media_type: 'anime' };
      }
      
      // Also check genre_ids for animation (ID 16 is Animation)
      const hasAnimationGenreId = item.genre_ids?.includes(16);
      
      if (hasAnimationGenreId) {
        return { ...item, media_type: 'anime' };
      }
      
      // Check for Japanese origin country (common for anime)
      const isJapanese = item.origin_country?.includes('JP') || 
                        item.original_language === 'ja' ||
                        item.original_language === 'ko';
      
      // Check for anime keywords in title or overview
      const hasAnimeKeywords = (item.title?.toLowerCase().includes('anime') || 
                               item.name?.toLowerCase().includes('anime') ||
                               item.overview?.toLowerCase().includes('anime')) &&
                               isJapanese;
      
      if (hasAnimeKeywords) {
        return { ...item, media_type: 'anime' };
      }
      
      // Check for romance anime series (common anime genre)
      const hasRomanceGenre = item.genre_ids?.includes(10749) && isJapanese;
      if (hasRomanceGenre) {
        return { ...item, media_type: 'anime' };
      }
      
      // Also check for romance anime by title keywords
      const hasRomanceKeywords = (item.title?.toLowerCase().includes('romance') || 
                                 item.name?.toLowerCase().includes('romance') ||
                                 item.overview?.toLowerCase().includes('romance')) &&
                                 isJapanese;
      if (hasRomanceKeywords) {
        return { ...item, media_type: 'anime' };
      }
      
      // Keep original media_type for non-anime content
      return item;
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          trending, 
          nowPlaying, 
          topRated, 
          tvShows, 
          upcoming, 
          popular,
          popularTVShows,
          action,
          comedy,
          drama,
          horror,
          romance,
          sciFi,
          animation,
          documentary
        ] = await Promise.all([
          getTrending('movie', 'week'),
          getNowPlaying(),
          getTopRated('movie'),
          getTrendingTV('week'),
          getUpcoming(),
          getPopular('movie'),
          getPopular('tv'),
          discover('movie', { with_genres: 28 }), // Action
          discover('movie', { with_genres: 35 }), // Comedy
          discover('movie', { with_genres: 18 }), // Drama
          discover('movie', { with_genres: 27 }), // Horror
          discover('movie', { with_genres: 10749 }), // Romance
          discover('movie', { with_genres: 878 }), // Sci-Fi
          discover('movie', { with_genres: 16 }), // Animation
          discover('movie', { with_genres: 99 }) // Documentary
        ]);

        setBannerData(processDataForAnime(trending?.results || []));
        setTrendingMovies(processDataForAnime(trending?.results || []));
        setNowPlayingMovies(processDataForAnime(nowPlaying?.results || []));
        setTopRatedMovies(processDataForAnime(topRated?.results || []));
        setTrendingTV(processDataForAnime(tvShows?.results || []));
        setUpcomingMovies(processDataForAnime(upcoming?.results || []));
        setPopularMovies(processDataForAnime(popular?.results || []));
        setPopularTV(processDataForAnime(popularTVShows?.results || []));
        setActionMovies(processDataForAnime(action?.results || []));
        setComedyMovies(processDataForAnime(comedy?.results || []));
        setDramaMovies(processDataForAnime(drama?.results || []));
        setHorrorMovies(processDataForAnime(horror?.results || []));
        setRomanceMovies(processDataForAnime(romance?.results || []));
        
        // Also fetch additional romance content specifically for anime
        const romanceAnimeMovies = await discover('movie', { 
          with_genres: '16,10749', 
          with_original_language: 'ja', 
          with_origin_country: 'JP' 
        });
        
        const romanceAnimeTV = await discover('tv', { 
          with_genres: '16,10749', 
          with_origin_country: 'JP' 
        });
        
        // Combine regular romance, anime movies, and anime TV, removing duplicates
        const allRomance = [
          ...(romance?.results || []), 
          ...(romanceAnimeMovies?.results || []),
          ...(romanceAnimeTV?.results || [])
        ];
        const uniqueRomance = allRomance.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        setRomanceMovies(processDataForAnime(uniqueRomance));
        setSciFiMovies(processDataForAnime(sciFi?.results || []));
        setAnimationMovies(processDataForAnime(animation?.results || []));
        setDocumentaryMovies(processDataForAnime(documentary?.results || []));

        // Set mock stats
        setStats({
          totalMovies: 25000,
          totalShows: 15000,
          totalUsers: 5000000,
          totalHours: 25000000
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);



  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return <CustomSkeletonLoader />;
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      {/* Enhanced Hero Section */}
      <section className="relative">
        <BannerHome data={bannerData} />
        
        {/* Darker gradient overlays for better text readability */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10"></div>
      </section>

      {/* Enhanced Featured Movies Section */}
      <section className="mt-4 mb-12">
        <HorizontalScrollCard
          data={bannerData || []}
          heading="Featured Movies"
          subheading="Handpicked for you"
          media_type="movie"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>


      {/* Enhanced Top Rated Section */}
      <section className="my-12 sm:my-16 lg:my-20">
        <HorizontalScrollCard
          data={topRatedMovies || []}
          heading="Top Rated Movies"
          subheading="All time best"
          media_type="movie"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>

      {/* Enhanced Upcoming Movies Section */}
      <section className="my-12 sm:my-16 lg:my-20">
        <HorizontalScrollCard
          data={upcomingMovies || []}
          heading="Coming Soon"
          subheading="Upcoming releases"
          media_type="movie"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>


      <section className="my-20">
        <div className="w-full px-4">
          <motion.div 
            className={`rounded-3xl p-12 border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-red-600/20 via-purple-600/20 to-blue-600/20 border-white/10'
                : 'bg-gradient-to-r from-red-100 via-purple-100 to-blue-100 border-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center mb-12">
              <h3 className={`text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-4 ${
                isDarkMode 
                  ? 'from-white to-gray-300'
                  : 'from-gray-900 to-gray-600'
              }`}>
                Our Platform by the Numbers
              </h3>
              <p className={`text-lg max-w-2xl mx-auto ${
                isDarkMode ? 'text-white/60' : 'text-gray-600'
              }`}>
                Join millions of users discovering amazing content every day
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: stats.totalMovies, label: 'Movies', color: 'text-red-500', icon: Film },
                { value: stats.totalShows, label: 'TV Shows', color: 'text-purple-500', icon: Tv },
                { value: stats.totalUsers, label: 'Users', color: 'text-blue-500', icon: Users },
                { value: stats.totalHours, label: 'Hours Watched', color: 'text-green-500', icon: Clock },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div 
                    key={index}
                    className="text-center"
                    whileHover={{ scale: 1.05 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDarkMode ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${stat.color} mb-2`}>
                      {formatNumber(stat.value)}
                    </div>
                    <div className={`font-medium ${
                      isDarkMode ? 'text-white/60' : 'text-gray-600'
                    }`}>{stat.label}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Popular Movies Section */}
      <section className="my-12 sm:my-16 lg:my-20">
        <HorizontalScrollCard
          data={popularMovies || []}
          heading="Popular Movies"
          subheading="Most watched"
          media_type="movie"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>

      {/* Enhanced Trending TV Section */}
      <section className="my-12 sm:my-16 lg:my-20">
        <HorizontalScrollCard
          data={trendingTV || []}
          heading="Trending TV Shows"
          subheading="Popular series"
          media_type="tv"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>

      {/* Enhanced Popular TV Shows Section */}
      <section className="my-12 sm:my-16 lg:my-20">
        <HorizontalScrollCard
          data={popularTV || []}
          heading="Popular TV Shows"
          subheading="Most watched series"
          media_type="tv"
          customCardComponent={UnifiedMovieCard}
          cardWidth={225}
          gap={16}
        />
      </section>

      {/* Enhanced Genre Sections */}
      <section className="my-12 sm:my-16 lg:my-20">

        {/* Action Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={actionMovies || []}
            heading="Action Movies"
            subheading="High-octane adventures"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

        <section className="my-12 sm:my-16 lg:my-20">
        <div className="w-full px-3 sm:px-4">
          <motion.div 
            className={`text-center rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-16 border backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gradient-to-r from-red-600/10 via-purple-600/10 to-blue-600/10 border-white/10'
                : 'bg-gradient-to-r from-red-50 via-purple-50 to-blue-50 border-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
              <CrownIcon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-4 sm:mb-6 ${
              isDarkMode 
                ? 'from-white to-gray-300'
                : 'from-gray-900 to-gray-600'
            }`}>
              Ready to Start Watching?
            </h3>
            <p className={`text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 max-w-3xl mx-auto px-4 ${
              isDarkMode ? 'text-white/80' : 'text-gray-700'
            }`}>
              Join millions of users discovering amazing content every day. 
              Create your account and start your cinematic journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-2xl"
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                  Get Started
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg border backdrop-blur-sm ${
                  isDarkMode
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <Info className="w-5 h-5 sm:w-6 sm:h-6" />
                  Learn More
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Comedy Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={comedyMovies || []}
            heading="Comedy Movies"
            subheading="Laugh out loud"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

        {/* Drama Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={dramaMovies || []}
            heading="Drama Movies"
            subheading="Emotional stories"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

        {/* Horror Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={horrorMovies || []}
            heading="Horror Movies"
            subheading="Spine-chilling"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

         <section className="my-12 sm:my-16 lg:my-20">
        <div className="w-full px-3 sm:px-4">
          <motion.div 
            className={`backdrop-blur-md rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 border ${
              isDarkMode 
                ? 'bg-white/5 border-white/10'
                : 'bg-gray-50 border-gray-200'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-red-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-3 sm:mb-4 ${
                isDarkMode 
                  ? 'from-white to-gray-300'
                  : 'from-gray-900 to-gray-600'
              }`}>
                Stay Updated
              </h3>
              <p className={`text-base sm:text-lg mb-6 sm:mb-8 px-4 ${
                isDarkMode ? 'text-white/60' : 'text-gray-600'
              }`}>
                Get notified about new releases, exclusive content, and special offers. 
                Never miss the latest from your favorite movies and TV shows.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto px-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className={`flex-1 border rounded-xl px-4 sm:px-6 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-red-500 text-base sm:text-lg ${
                    isDarkMode
                      ? 'bg-white/10 border-white/20 text-white placeholder-white/50'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-xl text-base sm:text-lg"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

        {/* Romance Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={romanceMovies || []}
            heading="Romance Movies"
            subheading="Love stories"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

        {/* Sci-Fi Movies */}
        <div className="mb-16">
          <HorizontalScrollCard
            data={sciFiMovies || []}
            heading="Sci-Fi Movies"
            subheading="Future worlds"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>

        {/* Animation Movies */}
        <div className="mb-8 sm:mb-12 lg:mb-16">
          <HorizontalScrollCard
            data={animationMovies || []}
            heading="Animation Movies"
            subheading="Animated magic"
            media_type="movie"
            customCardComponent={UnifiedMovieCard}
            cardWidth={225}
            gap={16}
          />
        </div>
      </section>

      {/* Enhanced Statistics Section */}
      

      {/* Enhanced Call to Action Section - Responsive */}
     

      {/* Enhanced Newsletter Section - Responsive */}
     
      <HorizontalScrollCard />
    </div>
  );
};

export default Home;