import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Star, Bookmark, Heart, Share2, Eye, X, CheckCircle, EyeOff, Clock, Settings,
  ArrowLeft, ArrowRight, Calendar, Users2, Award, Video, Tv, Film, Plus, Minus, Download, Upload, Info, ChevronDown, RotateCcw
} from 'lucide-react';
import { apiRequest } from '../utils/apiUtils';
import { getBestPoster, getBestBackdrop, saveCustomPoster, saveCustomBackdrop, removeCustomPoster, removeCustomBackdrop } from '../utils/imageUtils';
import { isAnimeContent, getMediaType } from '../utils/mediaTypeUtils';
import { useWatchlist, WATCHLIST_STATUS } from '../contexts/WatchlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import ReactPlayer from 'react-player';
import Skeleton from 'react-loading-skeleton';
import '../components/skeleton.css';
import useFetchDetails from '../hooks/useFetchDetails';
import UnifiedMovieCard from '../components/UnifiedMovieCard';
import WatchlistModal from '../components/WatchlistModal';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const DetailsPage = () => {
  const { isDarkMode } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { imageURL } = useSelector((state) => state.movieoData);
  
  // Get mediaType from the URL path
  const mediaType = window.location.pathname.includes('/tv/') ? 'tv' : 'movie';
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageType, setImageType] = useState('poster');
  const [customImage, setCustomImage] = useState('');
  const { addToWatchlist, removeFromWatchlist, isInWatchlist, getWatchlistStatus, updateWatchlistStatus, getEpisodeCount, toggleSeriesCompletion, toggleFavourite, isFavourite } = useWatchlist();

  // Determine the actual media type using centralized function
  const watchlistMediaType = useMemo(() => {
    if (!data) return mediaType;
    
    // Use centralized getMediaType function
    const calculatedType = getMediaType(data);
    
    // Debug logging for media type detection
    console.log('DetailsPage Media Type Debug:', {
      originalMediaType: mediaType,
      dataId: data?.id,
      dataTitle: data?.title || data?.name,
      dataGenres: data?.genres,
      dataGenreIds: data?.genre_ids,
      calculatedType: calculatedType,
      isAnime: isAnimeContent(data)
    });
    
    return calculatedType;
  }, [data, mediaType]);

  const [animeData, setAnimeData] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [expandedOverview, setExpandedOverview] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [videoKey, setVideoKey] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const contentRef = useRef(null);
  
  // Fetch main content data
  const { data: fetchedData, loading: detailsLoading, error: detailsError } = useFetchDetails(`/${mediaType}/${id}`);
  
  // Update local data state when fetched data changes
  useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
      setLoading(false);
    }
  }, [fetchedData]);
  
  // Handle loading state
  useEffect(() => {
    setLoading(detailsLoading);
  }, [detailsLoading]);
  
  // Handle error state
  useEffect(() => {
    if (detailsError) {
      setError(detailsError);
      setLoading(false);
    }
  }, [detailsError]);

  // Additional content states
  const [cast, setCast] = useState([]);
  const [videos, setVideos] = useState([]);
  const [similarContent, setSimilarContent] = useState([]);
  const [franchiseMovies, setFranchiseMovies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [selectedBackdrop, setSelectedBackdrop] = useState(null);
  const [imageEditorLoading, setImageEditorLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedPosterPath, setSelectedPosterPath] = useState(null);
  const [selectedBackdropPath, setSelectedBackdropPath] = useState(null);
  const [editorStep, setEditorStep] = useState('choose'); // 'choose', 'poster', 'backdrop'
  const [displayedPosters, setDisplayedPosters] = useState(12);
  const [displayedBackdrops, setDisplayedBackdrops] = useState(6);
  
  // Derived data
  const title = data?.title || data?.name || 'Untitled';
  const releaseDate = data?.release_date || data?.first_air_date;
  const rating = data?.vote_average ? Number(data.vote_average).toFixed(1) : 'N/A';
  
  // Use Redux imageURL if available, otherwise fallback to hardcoded URLs
  // The Redux imageURL is already the full base URL, so we need to construct properly
  const baseImageURL = imageURL || 'https://image.tmdb.org/t/p/';
  
  // Check for content-specific custom images in localStorage (applies to this content across all pages)
  const contentPosterPath = localStorage.getItem(`content_poster_${id}_${watchlistMediaType}`);
  const contentBackdropPath = localStorage.getItem(`content_backdrop_${id}_${watchlistMediaType}`);
  
  // Check for page-specific custom images in localStorage (fallback)
  const customPosterPath = localStorage.getItem(`custom_poster_${id}`);
  const customBackdropPath = localStorage.getItem(`custom_backdrop_${id}`);
  
  // Memoize path calculations to prevent infinite re-renders
  const backdropPath = React.useMemo(() => {
    return contentBackdropPath || customBackdropPath || getBestBackdrop(data?.id, data?.backdrop_path, 'https://image.tmdb.org/t/p/', watchlistMediaType) || 
      `https://picsum.photos/seed/${data?.id || 'default'}/1920/1080`;
  }, [contentBackdropPath, customBackdropPath, data?.backdrop_path, data?.id, watchlistMediaType]);
  
  const posterPath = React.useMemo(() => {
    return contentPosterPath || customPosterPath || getBestPoster(data?.id, data?.poster_path, 'https://image.tmdb.org/t/p/', watchlistMediaType) || 
      `https://picsum.photos/seed/${data?.id || 'default'}/400/600`;
  }, [contentPosterPath, customPosterPath, data?.poster_path, data?.id, watchlistMediaType]);
  
  const overview = data?.overview || 'No description available.';
  
  // Debug data loading
  useEffect(() => {
    if (data) {
      console.log('Data loaded:', data);
      console.log('Backdrop path:', data.backdrop_path);
      console.log('Poster path:', data.poster_path);
      console.log('Constructed backdrop URL:', backdropPath);
      console.log('Constructed poster URL:', posterPath);
    }
  }, [data]);



  // Watchlist status
  const currentWatchlistStatus = getWatchlistStatus(data?.id, watchlistMediaType);
  const isUserFavourite = isFavourite(data?.id, watchlistMediaType);



  

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchAdditionalData = async () => {
    try {
      const endpoints = [
        `/${mediaType}/${id}/credits`,
        `/${mediaType}/${id}/videos`,
        `/${mediaType}/${id}/similar`,
        `/${mediaType}/${id}/recommendations`
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => 
          apiRequest(endpoint).then(response => response.data)
      ));

      setCast(responses[0]?.cast?.slice(0, 12) || []);
      setVideos(responses[1]?.results || []);
      setSimilarContent(responses[2]?.results?.slice(0, 6) || []);
      setRecommendations(responses[3]?.results?.slice(0, 6) || []);

      console.log('Videos response:', responses[1]?.results);
      
      // Find the first official trailer or any trailer
      const trailer = responses[1]?.results?.find(
        video => video.type === 'Trailer' && video.site === 'YouTube'
      ) || responses[1]?.results?.find(
        video => video.type === 'Trailer'
      ) || responses[1]?.results?.find(
        video => video.site === 'YouTube'
      ) || responses[1]?.results?.[0];
      
      if (trailer?.key) {
        setVideoKey(trailer.key);
        console.log('Set video key:', trailer.key);
      } else {
        setVideoKey(null);
        console.log('No video key found');
      }

      // Fetch seasons for TV shows
      if (mediaType === 'tv') {
        const seasonsResponse = await apiRequest(`/tv/${id}`);
        setSeasons(seasonsResponse.data?.seasons || []);
        
        // Store series data in localStorage for episode counting
        localStorage.setItem(`series_${id}_data`, JSON.stringify(seasonsResponse.data));
      }
    } catch (error) {
      console.error('Error fetching additional data:', error);
      toast.error('Failed to load some content');
    }
  };

  const fetchFranchiseMovies = async () => {
    try {
      if (!data?.title && !data?.name) return;

      const movieTitle = data.title || data.name;
      const isCurrentMovieAnime = isAnimeContent(data);
      console.log('Searching for franchise movies for:', movieTitle, 'Is anime:', isCurrentMovieAnime);

      // Extract the main title/keywords for franchise search
      const searchTerms = extractFranchiseSearchTerms(movieTitle);
      const franchiseMovies = [];

      for (const searchTerm of searchTerms) {
        try {
          const searchResponse = await apiRequest(`/search/movie?query=${encodeURIComponent(searchTerm)}&include_adult=false`);
          const searchResults = searchResponse.data?.results || [];

          // Filter and add movies that belong to the same franchise
          const filteredMovies = searchResults.filter(movie => {
            const movieTitleLower = movie.title.toLowerCase();
            const searchTermLower = searchTerm.toLowerCase();
            
            // Check if the movie title contains the search term or vice versa
            const isSameFranchise = movieTitleLower.includes(searchTermLower) || 
                   searchTermLower.includes(movieTitleLower) ||
                   movieTitleLower.includes(searchTermLower.replace(/\s+/g, '')) ||
                   searchTermLower.replace(/\s+/g, '').includes(movieTitleLower.replace(/\s+/g, ''));

            // If current movie is anime, only include anime movies
            if (isCurrentMovieAnime) {
              return isSameFranchise && isAnimeContent(movie);
            }

            // If current movie is not anime, exclude anime movies
            return isSameFranchise && !isAnimeContent(movie);
          });

          franchiseMovies.push(...filteredMovies);
        } catch (error) {
          console.error(`Error searching for term "${searchTerm}":`, error);
        }
      }

      // Remove duplicates and current movie
      const uniqueMovies = franchiseMovies.filter((movie, index, self) => 
        movie.id !== data.id && 
        self.findIndex(m => m.id === movie.id) === index
      );

      // Sort by release date (oldest first)
      const sortedMovies = uniqueMovies.sort((a, b) => {
        const dateA = new Date(a.release_date || '9999-12-31');
        const dateB = new Date(b.release_date || '9999-12-31');
        return dateA - dateB;
      });

      // Limit to 12 movies
      setFranchiseMovies(sortedMovies.slice(0, 12));
      console.log('Franchise movies found:', sortedMovies.length, 'Is anime filter applied:', isCurrentMovieAnime);

    } catch (error) {
      console.error('Error fetching franchise movies:', error);
    }
  };

  const extractFranchiseSearchTerms = (title) => {
    const searchTerms = [];
    
    // Common franchise patterns
    const franchisePatterns = [
      // John Wick series
      { pattern: /john\s+wick/i, terms: ['john wick', 'john wick chapter', 'john wick: chapter'] },
      // Marvel series
      { pattern: /avengers/i, terms: ['avengers', 'the avengers'] },
      { pattern: /iron\s+man/i, terms: ['iron man'] },
      { pattern: /captain\s+america/i, terms: ['captain america', 'captain america:'] },
      { pattern: /thor/i, terms: ['thor'] },
      { pattern: /spider-man/i, terms: ['spider-man', 'spider man', 'the amazing spider-man'] },
      { pattern: /black\s+widow/i, terms: ['black widow'] },
      { pattern: /guardians\s+of\s+the\s+galaxy/i, terms: ['guardians of the galaxy'] },
      // DC series
      { pattern: /batman/i, terms: ['batman', 'the batman', 'batman begins', 'the dark knight'] },
      { pattern: /superman/i, terms: ['superman', 'man of steel'] },
      { pattern: /wonder\s+woman/i, terms: ['wonder woman'] },
      { pattern: /justice\s+league/i, terms: ['justice league'] },
      // Star Wars series
      { pattern: /star\s+wars/i, terms: ['star wars', 'star wars:'] },
      // Mission Impossible series
      { pattern: /mission:\s*impossible/i, terms: ['mission: impossible', 'mission impossible'] },
      // Fast & Furious series
      { pattern: /fast\s*&\s*furious/i, terms: ['fast & furious', 'fast and furious', 'the fast and the furious'] },
      // Transformers series
      { pattern: /transformers/i, terms: ['transformers'] },
      // Jurassic Park/World series
      { pattern: /jurassic/i, terms: ['jurassic park', 'jurassic world'] },
      // Indiana Jones series
      { pattern: /indiana\s+jones/i, terms: ['indiana jones'] },
      // Die Hard series
      { pattern: /die\s+hard/i, terms: ['die hard'] },
      // Terminator series
      { pattern: /terminator/i, terms: ['terminator', 'the terminator'] },
      // Alien series
      { pattern: /alien/i, terms: ['alien', 'aliens'] },
      // Predator series
      { pattern: /predator/i, terms: ['predator'] },
      // Rocky series
      { pattern: /rocky/i, terms: ['rocky'] },
      // Rambo series
      { pattern: /rambo/i, terms: ['rambo'] },
      // Mad Max series
      { pattern: /mad\s+max/i, terms: ['mad max'] },
      // Blade series
      { pattern: /blade/i, terms: ['blade'] },
      // Underworld series
      { pattern: /underworld/i, terms: ['underworld'] },
      // Resident Evil series
      { pattern: /resident\s+evil/i, terms: ['resident evil'] },
      // Pirates of the Caribbean series
      { pattern: /pirates\s+of\s+the\s+caribbean/i, terms: ['pirates of the caribbean'] },
      // Harry Potter series
      { pattern: /harry\s+potter/i, terms: ['harry potter'] },
      // Lord of the Rings series
      { pattern: /lord\s+of\s+the\s+rings/i, terms: ['lord of the rings', 'the lord of the rings'] },
      // The Hobbit series
      { pattern: /hobbit/i, terms: ['hobbit', 'the hobbit'] },
      // Hunger Games series
      { pattern: /hunger\s+games/i, terms: ['hunger games', 'the hunger games'] },
      // Divergent series
      { pattern: /divergent/i, terms: ['divergent'] },
      // Maze Runner series
      { pattern: /maze\s+runner/i, terms: ['maze runner', 'the maze runner'] },
      // Twilight series
      { pattern: /twilight/i, terms: ['twilight'] },
      // Fifty Shades series
      { pattern: /fifty\s+shades/i, terms: ['fifty shades', 'fifty shades of grey'] },
      // Taken series
      { pattern: /taken/i, terms: ['taken'] },
      // The Expendables series
      { pattern: /expendables/i, terms: ['expendables', 'the expendables'] },
      // The Conjuring series
      { pattern: /conjuring/i, terms: ['conjuring', 'the conjuring'] },
      // Insidious series
      { pattern: /insidious/i, terms: ['insidious'] },
      // Annabelle series
      { pattern: /annabelle/i, terms: ['annabelle'] },
      // The Nun series
      { pattern: /nun/i, terms: ['nun', 'the nun'] },
      // Saw series
      { pattern: /saw/i, terms: ['saw'] },
      // Final Destination series
      { pattern: /final\s+destination/i, terms: ['final destination'] },
      // Scream series
      { pattern: /scream/i, terms: ['scream'] },
      // Halloween series
      { pattern: /halloween/i, terms: ['halloween'] },
      // Friday the 13th series
      { pattern: /friday\s+the\s+13th/i, terms: ['friday the 13th'] },
      // Nightmare on Elm Street series
      { pattern: /nightmare\s+on\s+elm\s+street/i, terms: ['nightmare on elm street', 'a nightmare on elm street'] },
      // Child's Play series
      { pattern: /child's\s+play/i, terms: ['child\'s play', 'chucky'] },
      // The Purge series
      { pattern: /purge/i, terms: ['purge', 'the purge'] },
      // Paranormal Activity series
      { pattern: /paranormal\s+activity/i, terms: ['paranormal activity'] },
      // Insidious series
      { pattern: /insidious/i, terms: ['insidious'] },
      // Sinister series
      { pattern: /sinister/i, terms: ['sinister'] },
      // The Ring series
      { pattern: /ring/i, terms: ['ring', 'the ring'] },
      // Grudge series
      { pattern: /grudge/i, terms: ['grudge', 'the grudge'] },
      // Blair Witch series
      { pattern: /blair\s+witch/i, terms: ['blair witch', 'the blair witch project'] },
      // Cube series
      { pattern: /cube/i, terms: ['cube'] },
      // Saw series
      { pattern: /saw/i, terms: ['saw'] },
      // Hostel series
      { pattern: /hostel/i, terms: ['hostel'] },
      // Wrong Turn series
      { pattern: /wrong\s+turn/i, terms: ['wrong turn'] },
      // Jeepers Creepers series
      { pattern: /jeepers\s+creepers/i, terms: ['jeepers creepers'] },
      // Leprechaun series
      { pattern: /leprechaun/i, terms: ['leprechaun'] },
      // Child's Play series
      { pattern: /child's\s+play/i, terms: ['child\'s play'] },
      // Hellraiser series
      { pattern: /hellraiser/i, terms: ['hellraiser'] },
      // Phantasm series
      { pattern: /phantasm/i, terms: ['phantasm'] },
      // Puppet Master series
      { pattern: /puppet\s+master/i, terms: ['puppet master'] },
      // Wishmaster series
      { pattern: /wishmaster/i, terms: ['wishmaster'] },
      // Leprechaun series
      { pattern: /leprechaun/i, terms: ['leprechaun'] },
      // Hellraiser series
      { pattern: /hellraiser/i, terms: ['hellraiser'] },
      // Phantasm series
      { pattern: /phantasm/i, terms: ['phantasm'] },
      // Puppet Master series
      { pattern: /puppet\s+master/i, terms: ['puppet master'] },
      // Wishmaster series
      { pattern: /wishmaster/i, terms: ['wishmaster'] },
      // Leprechaun series
      { pattern: /leprechaun/i, terms: ['leprechaun'] },
      // Hellraiser series
      { pattern: /hellraiser/i, terms: ['hellraiser'] },
      // Phantasm series
      { pattern: /phantasm/i, terms: ['phantasm'] },
      // Puppet Master series
      { pattern: /puppet\s+master/i, terms: ['puppet master'] },
      // Wishmaster series
      { pattern: /wishmaster/i, terms: ['wishmaster'] }
    ];

    // Check if title matches any franchise pattern
    for (const franchise of franchisePatterns) {
      if (franchise.pattern.test(title)) {
        searchTerms.push(...franchise.terms);
        break;
      }
    }

    // If no specific franchise pattern found, try generic search
    if (searchTerms.length === 0) {
      // Extract key words from title (remove common words)
      const words = title.toLowerCase().split(/\s+/);
      const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
      const keyWords = words.filter(word => 
        word.length > 2 && !commonWords.includes(word) && !/^\d+$/.test(word)
      );
      
      if (keyWords.length > 0) {
        searchTerms.push(keyWords[0]); // Use the first key word
      }
    }

    return searchTerms;
  };

  useEffect(() => {
    if (data?.id) {
      fetchAdditionalData();
    }
  }, [data?.id, mediaType]);

  // Fetch franchise movies when data changes (only for movies)
  useEffect(() => {
    if ((data?.title || data?.name) && mediaType === 'movie') {
      fetchFranchiseMovies();
    }
  }, [data?.title, data?.name, mediaType]);



  const handleWatchlistToggle = () => {
    console.log('Watchlist Toggle Debug:', {
      dataId: data?.id,
      watchlistMediaType: watchlistMediaType,
      isInWatchlist: isInWatchlist(data?.id, watchlistMediaType),
      dataTitle: data?.title || data?.name,
      dataMediaType: data?.media_type,
      calculatedMediaType: watchlistMediaType
    });
    
    if (isInWatchlist(data?.id, watchlistMediaType)) {
      // If already in watchlist, remove it
      removeFromWatchlist(data?.id, watchlistMediaType);
      toast.success('Removed from watchlist');
    } else {
      // If not in watchlist, show modal to add it
      setShowWatchlistModal(true);
    }
  };

  const handleWatchlistStatus = (status) => {
    try {
      if (isInWatchlist(data?.id, watchlistMediaType)) {
        removeFromWatchlist(data.id, watchlistMediaType);
      }
      
      // Ensure the data object has the correct media_type for watchlist
      const watchlistData = {
        ...data,
        media_type: watchlistMediaType
      };
      
      addToWatchlist(watchlistData, status);
      setShowWatchlistModal(false);
      toast.success(`Added to ${getStatusLabel(status)}`);
    } catch (error) {
      console.error('Error updating watchlist status:', error);
      toast.error('Failed to update watchlist');
    }
  };

  const handleSeriesCompletionToggle = () => {
    try {
      toggleSeriesCompletion(data?.id, watchlistMediaType);
      setShowWatchlistModal(false);
      const currentStatus = getWatchlistStatus(data?.id, watchlistMediaType);
      if (currentStatus === WATCHLIST_STATUS.COMPLETED) {
        toast.success('Series marked as unwatched');
      } else {
        toast.success('All episodes marked as watched');
      }
    } catch (error) {
      console.error('Error toggling series completion:', error);
      toast.error('Failed to update series status');
    }
  };

  const handleFavouriteToggle = () => {
    try {
      toggleFavourite(data?.id, watchlistMediaType);
      if (isUserFavourite) {
        toast.success('Removed from favourites');
      } else {
        toast.success('Added to favourites');
      }
    } catch (error) {
      console.error('Error toggling favourite:', error);
      toast.error('Failed to update favourites');
    }
  };

  const getStatusLabel = (status) => {
    const statusConfig = {
      [WATCHLIST_STATUS.PLAN_TO_WATCH]: 'Plan to Watch',
      [WATCHLIST_STATUS.WATCHING]: 'Watching',
      [WATCHLIST_STATUS.COMPLETED]: 'Completed',
      [WATCHLIST_STATUS.DROPPED]: 'Dropped'
    };
    return statusConfig[status] || status;
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const toggleAutoPlay = () => setAutoPlay(!autoPlay);

  const fetchAvailableImages = async () => {
    try {
      setImageEditorLoading(true);
      setEditorStep('choose');
      setDisplayedPosters(12);
      setDisplayedBackdrops(6);
      const response = await apiRequest(`/${mediaType}/${id}/images`);
      const images = response.data;
      setAvailableImages(images);
      console.log('Available images:', images);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load available images');
    } finally {
      setImageEditorLoading(false);
    }
  };

  const handleImageChange = (type, imagePath) => {
    if (type === 'poster') {
      setSelectedPosterPath(imagePath);
      setSelectedPoster(`https://image.tmdb.org/t/p/original${imagePath}`);
      toast.success('Poster selected! Click Apply to save changes for this content.');
    } else if (type === 'backdrop') {
      setSelectedBackdropPath(imagePath);
      setSelectedBackdrop(`https://image.tmdb.org/t/p/w1280${imagePath}`);
      toast.success('Background image selected! Click Apply to save changes for this content.');
    }
  };

  const applyImageChanges = () => {
    if (selectedPosterPath) {
      // Apply poster to this specific content across all pages
              localStorage.setItem(`content_poster_${id}_${watchlistMediaType}`, `https://image.tmdb.org/t/p/original${selectedPosterPath}`);
      toast.success('Poster updated! Changes will apply to this content across all pages.');
    }
    if (selectedBackdropPath) {
      // Apply backdrop to this specific content across all pages
              localStorage.setItem(`content_backdrop_${id}_${watchlistMediaType}`, `https://image.tmdb.org/t/p/w1280${selectedBackdropPath}`);
      toast.success('Background image updated! Changes will apply to this content across all pages.');
    }
    setShowImageEditor(false);
    setSelectedPosterPath(null);
    setSelectedBackdropPath(null);
    setSelectedPoster(null);
    setSelectedBackdrop(null);
    setPreviewMode(false);
  };

  const resetImageChanges = () => {
    // Remove content-specific custom images
            localStorage.removeItem(`content_poster_${id}_${watchlistMediaType}`);
          localStorage.removeItem(`content_backdrop_${id}_${watchlistMediaType}`);
    setSelectedPosterPath(null);
    setSelectedBackdropPath(null);
    setSelectedPoster(null);
    setSelectedBackdrop(null);
    setPreviewMode(false);
    toast.info('Changes reset for this content');
  };

  const handleStepChange = (step) => {
    setEditorStep(step);
  };

  const loadMorePosters = () => {
    setDisplayedPosters(prev => Math.min(prev + 12, availableImages.posters?.length || 0));
  };

  const loadMoreBackdrops = () => {
    setDisplayedBackdrops(prev => Math.min(prev + 6, availableImages.backdrops?.length || 0));
  };

  if (detailsLoading) {
    return (
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className={`h-screen w-full animate-pulse ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-200'
        }`}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton height={40} width={300} className="mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => (
              <Skeleton height={150} key={i} />
            ))}
          </div>
          <Skeleton height={40} width={300} className="mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton height={300} key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-all duration-500 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="text-6xl mb-6">🎬</div>
          <h2 className={`text-3xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Content Not Found</h2>
          <p className={`mb-8 max-w-md mx-auto ${
            isDarkMode ? 'text-white/60' : 'text-gray-600'
          }`}>
            The content you're looking for doesn't exist or may have been removed.
          </p>
          <NavLink 
            to="/" 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-md font-bold transition-all duration-300 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </NavLink>
        </div>
      </div>
    );
  }





  return (
    <div className={`min-h-screen w-full overflow-x-hidden transition-all duration-500 ${
      isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Hero Section with Background Video/Image */}
      <div className="relative h-screen w-full overflow-hidden" style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
                {/* Background Video/Image */}
        {videoKey && autoPlay ? (
          <div className="absolute inset-0 w-full h-full">
            {console.log('Rendering background video with key:', videoKey, 'autoplay:', autoPlay)}
            <iframe
              key={videoKey}
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=0&modestbranding=1&showinfo=0&rel=0&mute=0&loop=1&playlist=${videoKey}`}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                minWidth: '100%',
                minHeight: '100%',
                objectFit: 'cover',
                zIndex: 1
              }}
              onLoad={() => {
                console.log('Background iframe video loaded');
              }}
              onError={(error) => {
                console.error('Background iframe error:', error);
                setAutoPlay(false);
              }}
            />
            <div className={`absolute inset-0 z-10 ${
              isDarkMode 
                ? 'bg-gradient-to-t from-black via-black/30 to-transparent'
                : 'bg-gradient-to-t from-black via-black/30 to-transparent'
            }`} />
            <div className={`absolute inset-0 z-10 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-black/80 via-black/30 to-transparent'
                : 'bg-gradient-to-r from-black/80 via-black/30 to-transparent'
            }`} />
          </div>
                        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={backdropPath}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Backdrop image failed to load:', backdropPath);
                e.target.src = `https://picsum.photos/seed/${data?.id || 'default'}/1920/1080`;
              }}
              onLoad={() => {
                console.log('Backdrop image loaded successfully:', backdropPath);
              }}
            />
            <div className={`absolute inset-0 ${
              isDarkMode 
                ? 'bg-gradient-to-t from-black via-black/50 to-transparent'
                : 'bg-gradient-to-t  from-black via-black/50 to-transparent'
            }`} />
            <div className={`absolute inset-0 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-black/80 via-black/30 to-transparent'
                : 'bg-gradient-to-r from-black/80 via-black/30 to-transparent'
            }`} />
          </div>
        )}

        {/* Floating Controls - Moved down with content */}
        {videoKey && (
          <div className="absolute bottom-8 right-8 z-20 flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('Autoplay button clicked. Current autoplay state:', autoPlay);
                toggleAutoPlay();
                console.log('New autoplay state:', !autoPlay);
              }}
              className={`p-2 rounded-full ${autoPlay ? 'bg-red-600' : 'bg-white/20'} backdrop-blur-sm`}
              title={autoPlay ? 'Disable autoplay' : 'Enable autoplay'}
            >
              {autoPlay ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              )}
            </motion.button>
          </div>
        )}

        {/* Sticky Navigation */}
       

                         {/* Hero Content */}
        <div className="relative z-10 h-full flex items-end lg:items-center">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-6xl mx-auto lg:mx-0 lg:ml-8">
              <div className="flex flex-col md:flex-col lg:flex-row gap-6 sm:gap-8 items-center md:items-center lg:items-start">
                {/* Poster Section - Mobile Optimized */}
                <div className="flex-shrink-0 mx-auto md:mx-auto lg:mx-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative overflow-hidden rounded-lg shadow-2xl"
                  >
                    <img
                      src={posterPath}
                      alt={title}
                      className="w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 object-cover"
                      onError={(e) => {
                        console.error('Poster image failed to load:', posterPath);
                        e.target.src = `https://picsum.photos/seed/${data?.id || 'default'}/400/600`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </motion.div>
                </div>

                {/* Content Section - Mobile Optimized */}
                <div className="flex-1 space-y-4 sm:space-y-6 text-center md:text-center lg:text-left">
                  <motion.h1 
                    className={`text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-black leading-tight drop-shadow-2xl ${
                      isDarkMode ? 'text-white' : 'text-white'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    {title}
                  </motion.h1>

                  <motion.div
                    className="flex flex-wrap items-center justify-center md:justify-center lg:justify-start gap-2 sm:gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <div className={`flex items-center gap-2 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border shadow-lg ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/30' 
                        : 'bg-white/80 border-gray-300'
                    }`}>
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                      <span className={`font-bold text-sm sm:text-base ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{rating}/10</span>
                    </div>
                    {releaseDate && (
                      <span className={`backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border shadow-lg text-sm sm:text-base ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/30 text-white' 
                          : 'bg-white/80 border-gray-300 text-gray-900'
                      }`}>
                        {new Date(releaseDate).getFullYear()}
                      </span>
                    )}
                    <span className={`backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border shadow-lg capitalize text-sm sm:text-base ${
                      isDarkMode 
                        ? 'bg-black/60 border-white/30 text-white' 
                        : 'bg-white/80 border-gray-300 text-gray-900'
                    }`}>
                      {mediaType}
                    </span>
                    {data?.runtime && data.runtime > 0 && mediaType === 'movie' && (
                      <span className={`backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border shadow-lg text-sm sm:text-base ${
                        isDarkMode 
                          ? 'bg-black/60 border-white/30 text-white' 
                          : 'bg-white/80 border-gray-300 text-gray-900'
                      }`}>
                        {Math.floor(data.runtime / 60) > 0 ? `${Math.floor(data.runtime / 60)}h ` : ''}{data.runtime % 60}m
                      </span>
                    )}
                  </motion.div>

                  <motion.div
                    className="flex flex-wrap justify-center md:justify-center lg:justify-start gap-3 sm:gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        console.log('Trailer button clicked. videoKey:', videoKey);
                        if (videoKey) {
                          setShowVideoPlayer(true);
                          console.log('Opening video player with key:', videoKey);
                        } else {
                          toast.error('No trailer available for this content');
                          console.log('No video key available');
                        }
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-base shadow-lg backdrop-blur-sm"
                    >
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      {videoKey ? 'Play Trailer' : 'No Trailer'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWatchlistToggle}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-base border backdrop-blur-sm shadow-lg ${
                        isInWatchlist(data?.id, watchlistMediaType) 
                          ? isDarkMode 
                            ? 'bg-white/10 border-white/30 text-white' 
                            : 'bg-gray-100 border-gray-300 text-gray-900'
                          : isDarkMode 
                            ? 'bg-black/40 border-white/30 hover:bg-white/10 text-white'
                            : 'bg-white/80 border-gray-300 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      {isInWatchlist(data?.id, watchlistMediaType) ? (
                        <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      ) : (
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                      {isInWatchlist(data?.id, watchlistMediaType) ? 'In List' : 'My List'}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        fetchAvailableImages();
                        setShowImageEditor(true);
                      }}
                      className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-base border backdrop-blur-sm shadow-lg ${
                        isDarkMode 
                          ? 'border-white/30 bg-black/40 hover:bg-white/10 text-white'
                          : 'border-gray-300 bg-white/80 hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                      Edit Images
                    </motion.button>
                  </motion.div>

                  {data?.genres && (
                    <motion.div
                      className="flex flex-wrap justify-center lg:justify-start gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      {data.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="bg-red-900/40 backdrop-blur-sm text-red-300 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border border-red-800/50 shadow-sm"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections - Mobile Optimized */}
      <div className={`relative z-10 w-full ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`} ref={contentRef}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
          
          {/* Description Section - Mobile Optimized */}
          {overview && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className={`border-t border-b py-8 sm:py-12 ${
                isDarkMode 
                  ? 'bg-black border-white/10' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 rounded-full flex items-center justify-center">
                      <Info className={`w-3 h-3 sm:w-4 sm:h-4 ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`} />
                    </div>
                    <h2 className={`text-xl sm:text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>Synopsis</h2>
                  </div>
                  <div className="relative">
                    <p className={`text-base sm:text-lg leading-relaxed max-w-4xl ${!expandedOverview ? 'overflow-hidden' : ''} ${
                      isDarkMode ? 'text-white/90' : 'text-gray-700'
                    }`} style={{ 
                      display: !expandedOverview ? '-webkit-box' : 'block',
                      WebkitLineClamp: !expandedOverview ? '3' : 'none',
                      WebkitBoxOrient: !expandedOverview ? 'vertical' : 'horizontal',
                      lineHeight: !expandedOverview ? '1.5em' : '1.6em',
                      maxHeight: !expandedOverview ? '4.5em' : 'none'
                    }}>
                      {overview}
                    </p>
                    {overview.length > 200 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedOverview(!expandedOverview)}
                        className="mt-4 sm:mt-6 text-red-400 hover:text-red-300 font-medium flex items-center gap-2 transition-colors text-sm sm:text-base"
                      >
                        {expandedOverview ? 'Show Less' : 'Read More'}
                        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${expandedOverview ? 'rotate-180' : ''}`} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Cast Section - Mobile Optimized */}
          {cast.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Cast</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-2 sm:gap-3">
                {cast.map((person) => (
                  <motion.div
                    key={person.id}
                    whileHover={{ scale: 1.05 }}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/person/${person.id}`)}
                  >
                    <div className="relative overflow-hidden rounded-lg aspect-[2/3] mb-2">
                      <LazyLoadImage
                        src={person.profile_path 
                          ? `https://image.tmdb.org/t/p/w200${person.profile_path}` 
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=333&color=fff&size=200`}
                        alt={person.name}
                        effect="blur"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          console.error('Cast image failed to load:', person.profile_path);
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=333&color=fff&size=200`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                        <div>
                          <h4 className={`font-bold text-xs ${
                            isDarkMode ? 'text-white' : 'text-white'
                          }`}>{person.name}</h4>
                          <p className={`text-xs ${
                            isDarkMode ? 'text-white/80' : 'text-white/80'
                          }`}>{person.character}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Key Details & Seasons - Mobile Optimized */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Details Section - Mobile Optimized */}
            <div className={`backdrop-blur-sm rounded-2xl p-4 sm:p-8 border ${
              isDarkMode 
                ? 'bg-gradient-to-r from-gray-900/30 to-gray-800/30 border-white/10'
                : 'bg-gradient-to-r from-gray-100/50 to-gray-200/50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Info className={`w-3 h-3 sm:w-4 sm:h-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-700'
                  }`} />
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  isDarkMode 
                    ? 'bg-black/20 border-white/10'
                    : 'bg-white/50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>Release Date</span>
                  </div>
                  <span className={`font-semibold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {releaseDate ? new Date(releaseDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                {data?.runtime && data.runtime > 0 && mediaType === 'movie' && (
                  <div className={`rounded-lg p-3 sm:p-4 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-white/10'
                      : 'bg-white/50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                      <span className={`text-xs sm:text-sm font-medium ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Runtime</span>
                    </div>
                    <span className={`font-semibold text-sm sm:text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Math.floor(data.runtime / 60) > 0 ? `${Math.floor(data.runtime / 60)}h ` : ''}{data.runtime % 60}m
                    </span>
                  </div>
                )}
                
                {data?.budget && data.budget > 0 && (
                  <div className={`rounded-lg p-3 sm:p-4 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-white/10'
                      : 'bg-white/50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-black text-xs font-bold">$</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Budget</span>
                    </div>
                    <span className={`font-semibold text-sm sm:text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${(data.budget / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
                
                {data?.revenue && data.revenue > 0 && (
                  <div className={`rounded-lg p-3 sm:p-4 border ${
                    isDarkMode 
                      ? 'bg-black/20 border-white/10'
                      : 'bg-white/50 border-gray-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-black text-xs font-bold">$</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-medium ${
                        isDarkMode ? 'text-white/70' : 'text-gray-600'
                      }`}>Revenue</span>
                    </div>
                    <span className={`font-semibold text-sm sm:text-base ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      ${(data.revenue / 1000000).toFixed(1)}M
                    </span>
                  </div>
                )}
                
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  isDarkMode 
                    ? 'bg-black/20 border-white/10'
                    : 'bg-white/50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-500 rounded-full flex items-center justify-center">
                      <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>Rating</span>
                  </div>
                  <span className={`font-semibold text-sm sm:text-base ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {rating}/10
                  </span>
                </div>
                
                <div className={`rounded-lg p-3 sm:p-4 border ${
                  isDarkMode 
                    ? 'bg-black/20 border-white/10'
                    : 'bg-white/50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full flex items-center justify-center">
                      <Film className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <span className={`text-xs sm:text-sm font-medium ${
                      isDarkMode ? 'text-white/70' : 'text-gray-600'
                    }`}>Type</span>
                  </div>
                  <span className={`font-semibold text-sm sm:text-base capitalize ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {mediaType}
                  </span>
                </div>
              </div>
            </div>

            {/* Seasons Section - Enhanced Mobile Responsive */}
            {mediaType === 'tv' && seasons.length > 0 && (
              <div className={`backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 border ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-gray-900/30 to-gray-800/30 border-white/10'
                  : 'bg-gradient-to-r from-gray-100/50 to-gray-200/50 border-gray-200'
              }`}>
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Tv className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-700'
                    }`} />
                  </div>
                  <h2 className={`text-lg sm:text-xl lg:text-2xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Seasons</h2>
                </div>
                
                {/* Mobile Layout - Single Column */}
                <div className="block sm:hidden space-y-3">
                  {seasons.map((season) => (
                    <motion.div
                      key={season.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/tv/${id}/season/${season.season_number}`)}
                      className="bg-black/20 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-16 h-24 bg-white/10 rounded-lg overflow-hidden">
                          {season.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                              alt={season.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Season poster failed to load:', season.poster_path);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold mb-2 text-base ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>{season.name}</h4>
                          <div className="flex flex-col gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <Play className="w-4 h-4 text-green-400" />
                              <span className={`text-sm ${
                                isDarkMode ? 'text-white/70' : 'text-gray-600'
                              }`}>
                                {season.episode_count} episodes
                              </span>
                            </div>
                            {season.air_date && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-400" />
                                <span className={`text-sm ${
                                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                                }`}>
                                  {new Date(season.air_date).getFullYear()}
                                </span>
                              </div>
                            )}
                          </div>
                          {season.overview && (
                            <p className={`text-sm line-clamp-3 leading-relaxed ${
                              isDarkMode ? 'text-white/80' : 'text-gray-700'
                            }`}>
                              {season.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tablet Layout - Two Columns */}
                <div className="hidden sm:block lg:hidden grid grid-cols-2 gap-4">
                  {seasons.map((season) => (
                    <motion.div
                      key={season.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/tv/${id}/season/${season.season_number}`)}
                      className="bg-black/20 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-14 h-20 bg-white/10 rounded-lg overflow-hidden">
                          {season.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                              alt={season.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Season poster failed to load:', season.poster_path);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-5 h-5 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white mb-2 text-sm">{season.name}</h4>
                          <div className="flex flex-col gap-1 mb-2">
                            <div className="flex items-center gap-1">
                              <Play className="w-3 h-3 text-green-400" />
                              <span className="text-white/70 text-xs">
                                {season.episode_count} episodes
                              </span>
                            </div>
                            {season.air_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                <span className="text-white/70 text-xs">
                                  {new Date(season.air_date).getFullYear()}
                                </span>
                              </div>
                            )}
                          </div>
                          {season.overview && (
                            <p className="text-white/80 text-xs line-clamp-2">
                              {season.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop Layout - Three Columns */}
                <div className="hidden lg:grid grid-cols-3 gap-6">
                  {seasons.map((season) => (
                    <motion.div
                      key={season.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/tv/${id}/season/${season.season_number}`)}
                      className="bg-black/20 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer"
                    >
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-16 h-24 bg-white/10 rounded-lg overflow-hidden">
                          {season.poster_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w200${season.poster_path}`}
                              alt={season.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Season poster failed to load:', season.poster_path);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-6 h-6 text-white/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white mb-2 text-base">{season.name}</h4>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Play className="w-3 h-3 text-green-400" />
                              <span className="text-white/70 text-xs sm:text-sm">
                                {season.episode_count} episodes
                              </span>
                            </div>
                            {season.air_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-blue-400" />
                                <span className="text-white/70 text-xs sm:text-sm">
                                  {new Date(season.air_date).getFullYear()}
                                </span>
                              </div>
                            )}
                          </div>
                          {season.overview && (
                            <p className="text-white/80 text-xs line-clamp-2">
                              {season.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>

          {/* Similar Content - Mobile Optimized */}
          {similarContent.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>More Like This</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {similarContent.map((item) => (
                  <UnifiedMovieCard key={item.id} movie={item} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Franchise Movies - Only for Movies */}
          {mediaType === 'movie' && franchiseMovies.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{isAnimeContent(data) ? 'Anime Series' : 'Franchise Movies'}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {franchiseMovies.map((item) => (
                  <UnifiedMovieCard key={item.id} movie={item} />
                ))}
              </div>
            </motion.section>
          )}

          {/* Recommendations - Only for TV Shows */}
          {mediaType === 'tv' && recommendations.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Recommended For You</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                {recommendations.map((item) => (
                  <UnifiedMovieCard key={item.id} movie={item} />
                ))}
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Video Player Modal - Mobile Optimized */}
      <AnimatePresence>
        {showVideoPlayer && videoKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl"
            >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowVideoPlayer(false)}
                  className="absolute -bottom-12 sm:-bottom-16 right-0 text-white z-10 hover:text-red-400 transition-colors bg-black/50 backdrop-blur-sm rounded-full p-2"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8" />
                </motion.button>
              
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  key={videoKey}
                  src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&controls=1&modestbranding=1&showinfo=0&rel=0`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={(error) => {
                    console.error('Iframe video error:', error);
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Watchlist Modal */}
      <WatchlistModal
        isOpen={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
        movie={data}
      />

      {/* Image Editor Modal */}
      <AnimatePresence>
        {showImageEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageEditor(false)}
          >
                      <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-black rounded-3xl p-8 max-w-5xl w-full border border-red-600/30 max-h-[95vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className={`text-3xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Customize Images
                  </h3>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>Personalize this content's appearance across all pages</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowImageEditor(false)}
                className="w-10 h-10 bg-red-600/20 hover:bg-red-600/40 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-150"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

              {/* Enhanced Loading State */}
              {imageEditorLoading && (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-white/20 rounded-full mx-auto mb-6"></div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
                  </div>
                  <h4 className={`text-xl font-semibold mb-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Loading Images</h4>
                  <p className={`${
                    isDarkMode ? 'text-white/60' : 'text-gray-600'
                  }`}>Fetching available posters and backgrounds...</p>
                </div>
              )}

              {/* Content */}
              {!imageEditorLoading && (
                <div className="space-y-6">
                  {/* Step 1: Choose what to change */}
                  {editorStep === 'choose' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Film className="w-8 h-8 text-white" />
                        </div>
                        <h4 className={`text-2xl font-bold mb-3 ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>Choose What to Customize</h4>
                        <p className={`text-lg ${
                          isDarkMode ? 'text-white/60' : 'text-gray-600'
                        }`}>Select what you'd like to personalize for this content</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStepChange('poster')}
                          className="group bg-black border border-red-600/30 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-150"
                        >
                          <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <Film className="w-10 h-10 text-white" />
                            </div>
                            <div>
                              <h5 className="text-white font-bold text-xl mb-2">Poster Image</h5>
                              <p className="text-white/70 text-sm leading-relaxed">Change the poster that appears on cards and details pages across the entire app</p>
                            </div>
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                              <span>Select Poster</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStepChange('backdrop')}
                          className="group bg-black border border-red-600/30 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-150"
                        >
                          <div className="flex flex-col items-center text-center gap-6">
                            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                              <Video className="w-10 h-10 text-white" />
                            </div>
                            <div>
                              <h5 className="text-white font-bold text-xl mb-2">Background Image</h5>
                              <p className="text-white/70 text-sm leading-relaxed">Change the background image that appears on detail pages and banners</p>
                            </div>
                            <div className="flex items-center gap-2 text-red-400 text-sm">
                              <span>Select Background</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Poster Selection */}
                  {editorStep === 'poster' && availableImages.posters && availableImages.posters.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleStepChange('choose')}
                            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <ArrowLeft className="w-5 h-5 text-white" />
                          </motion.button>
                          <div>
                            <h4 className="text-2xl font-bold text-white">Choose Poster Image</h4>
                            <p className="text-white/60 text-sm">Select a new poster that will appear across all pages</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {availableImages.posters.slice(0, displayedPosters).map((poster, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-150 relative group ${
                              selectedPosterPath === poster.file_path 
                                ? 'border-red-500 shadow-2xl shadow-red-500/40' 
                                : 'border-white/20 hover:border-red-500/50 hover:shadow-xl'
                            }`}
                            onClick={() => handleImageChange('poster', poster.file_path)}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w300${poster.file_path}`}
                              alt={`Poster ${index + 1}`}
                              className="w-full h-auto object-cover transition-transform duration-150 group-hover:scale-105"
                            />
                            {selectedPosterPath === poster.file_path && (
                              <div className="absolute inset-0 bg-gradient-to-t from-red-600/80 via-red-600/40 to-transparent flex items-end justify-center pointer-events-none">
                                <div className="mb-2 p-2 bg-red-600 rounded-full">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                <Eye className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {availableImages.posters.length > displayedPosters && (
                        <div className="text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadMorePosters}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-150 shadow-lg"
                          >
                            Load More Posters
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Background Selection */}
                  {editorStep === 'backdrop' && availableImages.backdrops && availableImages.backdrops.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleStepChange('choose')}
                            className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
                          >
                            <ArrowLeft className="w-5 h-5 text-white" />
                          </motion.button>
                          <div>
                            <h4 className="text-2xl font-bold text-white">Choose Background Image</h4>
                            <p className="text-white/60 text-sm">Select a new background that will appear on detail pages</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {availableImages.backdrops.slice(0, displayedBackdrops).map((backdrop, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-150 relative group ${
                              selectedBackdropPath === backdrop.file_path 
                                ? 'border-red-500 shadow-2xl shadow-red-500/40' 
                                : 'border-white/20 hover:border-red-500/50 hover:shadow-xl'
                            }`}
                            onClick={() => handleImageChange('backdrop', backdrop.file_path)}
                          >
                            <img
                              src={`https://image.tmdb.org/t/p/w500${backdrop.file_path}`}
                              alt={`Background ${index + 1}`}
                              className="w-full h-auto object-cover transition-transform duration-150 group-hover:scale-105"
                            />
                            {selectedBackdropPath === backdrop.file_path && (
                              <div className="absolute inset-0 bg-gradient-to-t from-red-600/80 via-red-600/40 to-transparent flex items-end justify-center pointer-events-none">
                                <div className="mb-2 p-2 bg-red-600 rounded-full">
                                  <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                              <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                <Eye className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      {availableImages.backdrops.length > displayedBackdrops && (
                        <div className="text-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={loadMoreBackdrops}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-150 shadow-lg"
                          >
                            Load More Backgrounds
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Enhanced No Images Available */}
                  {(!availableImages.posters || availableImages.posters.length === 0) && 
                   (!availableImages.backdrops || availableImages.backdrops.length === 0) && (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Film className="w-12 h-12 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-3">No Additional Images</h4>
                      <p className="text-white/60 text-lg mb-6">No additional images are available for this content.</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowImageEditor(false)}
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-150 shadow-lg"
                      >
                        Close Editor
                      </motion.button>
                    </div>
                  )}

                  {/* Enhanced Action Buttons */}
                  {(selectedPosterPath || selectedBackdropPath) && (
                    <div className="flex flex-col sm:flex-row gap-6 pt-8 border-t border-red-600/30">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={applyImageChanges}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-8 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all duration-150"
                      >
                        <CheckCircle className="w-6 h-6" />
                        Apply Changes
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={resetImageChanges}
                        className="flex-1 bg-black border border-red-600/30 hover:border-red-500/50 text-white px-8 py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all duration-150"
                      >
                        <RotateCcw className="w-6 h-6" />
                        Reset Changes
                      </motion.button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DetailsPage;