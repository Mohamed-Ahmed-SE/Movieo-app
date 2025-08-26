import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaStar, FaStop } from 'react-icons/fa';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { MdHighQuality } from 'react-icons/md';
import { getBestBackdrop, getCustomBackdrop, getOptimizedImageURL } from '../utils/imageUtils';
import Loader from './Loader';
import useBannerPreloader from '../hooks/useBannerPreloader';

const BannerHome = () => {
  const navigate = useNavigate();
  const bannerData = useSelector(state => state.movieoData.bannerData) || [];
  const imageURL = useSelector(state => state.movieoData.imageURL);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [backdropLoading, setBackdropLoading] = useState(true);
  const [backdropError, setBackdropError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoRotateTimer, setAutoRotateTimer] = useState(null);
  const [videoStartedByClick, setVideoStartedByClick] = useState(false);
  const imageRef = useRef(null);

  // Use the preloader hook
  const { getPreloadedData, isPreloading } = useBannerPreloader(bannerData, currentBanner);

  // Only show banners with a valid image
  const validBannerData = bannerData.filter(item => item.backdrop_path);
  const main = validBannerData[currentBanner] || {};

  // Check if next/previous items are preloaded
  const nextIndex = (currentBanner + 1) % validBannerData.length;
  const prevIndex = (currentBanner - 1 + validBannerData.length) % validBannerData.length;
  const nextPreloaded = getPreloadedData(nextIndex);
  const prevPreloaded = getPreloadedData(prevIndex);

  // Auto-rotation effect - resumes when not hovering and video is not playing from button click
  useEffect(() => {
    if (validBannerData.length > 1 && !isHovered && !videoStartedByClick) {
      const interval = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % validBannerData.length);
      }, 8000);
      
      setAutoRotateTimer(interval);
      
      return () => {
        clearInterval(interval);
        setAutoRotateTimer(null);
      };
    } else {
      if (autoRotateTimer) {
        clearInterval(autoRotateTimer);
        setAutoRotateTimer(null);
      }
    }
  }, [validBannerData.length, isHovered, videoStartedByClick]);

  // Function to restart auto-rotation timer
  const restartAutoRotateTimer = () => {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
    }
    
    if (validBannerData.length > 1 && !isHovered && !videoStartedByClick) {
      const interval = setInterval(() => {
        setCurrentBanner(prev => (prev + 1) % validBannerData.length);
      }, 8000);
      
      setAutoRotateTimer(interval);
    }
  };

  // Manual navigation functions
  const goToNext = () => {
    const nextIndex = (currentBanner + 1) % validBannerData.length;
    setCurrentBanner(nextIndex);
    setShowVideoPreview(false);
    setIsVideoPlaying(false);
    setVideoStartedByClick(false); // Reset video started by click state
    if (nextPreloaded?.videoData) {
      setVideoData(nextPreloaded.videoData);
      setLoadingVideo(false);
    } else {
      setLoadingVideo(true);
      setVideoData(null);
      if (validBannerData[nextIndex]) {
        console.warn('Preloaded data missing for next banner:', validBannerData[nextIndex]?.title || validBannerData[nextIndex]?.name);
      }
    }
    // Restart the auto-rotation timer
    restartAutoRotateTimer();
  };

  const goToPrevious = () => {
    const prevIndex = (currentBanner - 1 + validBannerData.length) % validBannerData.length;
    setCurrentBanner(prevIndex);
    setShowVideoPreview(false);
    setIsVideoPlaying(false);
    setVideoStartedByClick(false); // Reset video started by click state
    if (prevPreloaded?.videoData) {
      setVideoData(prevPreloaded.videoData);
      setLoadingVideo(false);
    } else {
      setLoadingVideo(true);
      setVideoData(null);
      if (validBannerData[prevIndex]) {
        console.warn('Preloaded data missing for previous banner:', validBannerData[prevIndex]?.title || validBannerData[prevIndex]?.name);
      }
    }
    // Restart the auto-rotation timer
    restartAutoRotateTimer();
  };

  // Retry logic
  const retryBackdrop = () => {
    setBackdropError(false);
    setBackdropLoading(true);
  };

  // Button click handlers
  const handlePlayClick = () => {
    if (videoData?.key) {
      // Play the trailer in background immediately (show video preview)
      setShowVideoPreview(true);
      setIsVideoPlaying(true);
      setIsHovered(true);
      setVideoStartedByClick(true); // Mark that video was started by button click
      setCountdown(0); // Skip countdown and play immediately
    } else {
      // If no video available, show a message or navigate to details
      console.log('No video available for this banner');
    }
  };

  const handleInfoClick = () => {
    const mediaType = main.media_type || 'movie';
    navigate(`/${mediaType}/${main.id}`);
  };

  const handleStopVideo = () => {
    setShowVideoPreview(false);
    setIsVideoPlaying(false);
    setVideoStartedByClick(false);
    setIsHovered(false);
    // Restart auto-rotation timer when video is stopped
    restartAutoRotateTimer();
  };

  // Fetch video data for current banner
  useEffect(() => {
    const fetchVideoData = async () => {
      if (!main?.id) return;
      
      // Check if we have preloaded data for current banner
      const preloadedData = getPreloadedData(currentBanner);
      if (preloadedData?.videoData) {
        console.log('Using preloaded video data for:', main?.title || main?.name);
        setVideoData(preloadedData.videoData);
        setLoadingVideo(false);
        return;
      }
      
      setLoadingVideo(true);
      try {
        const mediaType = main.media_type || 'movie';
        const { apiRequest } = await import('../utils/apiUtils');
        const response = await apiRequest(`/${mediaType}/${main.id}/videos`);
        const data = response.data;
        
        // Get the first official trailer or teaser
        const trailer = data.results?.find(video => 
          video.type === 'Trailer' && video.site === 'YouTube'
        ) || data.results?.[0];
        
        setVideoData(trailer);
        console.log('Video data fetched for:', main?.title || main?.name, trailer?.key || 'no video');
      } catch (error) {
        console.error('Error fetching video data:', error);
        setVideoData(null);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchVideoData();
  }, [main?.id, main?.media_type, currentBanner, getPreloadedData]);

  // Handle hover to show video preview
  const handleMouseEnter = () => {
    // Only start hover countdown if video is not already playing from button click
    if (!showVideoPreview) {
      setIsHovered(true);
      setCountdown(2); // Start countdown from 2
      
      if (videoData?.key) {
        // Add 2-second delay before showing video
        const timer = setTimeout(() => {
          if (isHovered && !showVideoPreview) { // Only show if still hovering and not already playing
            setShowVideoPreview(true);
            setIsVideoPlaying(true);
            setCountdown(0);
          }
        }, 2000);
        
        // Countdown timer
        const countdownTimer = setInterval(() => {
          setCountdown(prev => {
            if (prev > 1) {
              return prev - 1;
            } else {
              clearInterval(countdownTimer);
              return 0;
            }
          });
        }, 1000);
        
        return () => {
          clearTimeout(timer);
          clearInterval(countdownTimer);
        };
      } else {
        // If videoData is not ready, show loader and wait for it
        setLoadingVideo(true);
        // When videoData is set by the effect, show the preview with delay
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Only stop video if it wasn't started by button click
    if (!videoStartedByClick) {
      setShowVideoPreview(false);
      setIsVideoPlaying(false);
    }
    setCountdown(0);
  };

  // Show video preview after 3 seconds of hovering when videoData is available
  useEffect(() => {
    if (isHovered && videoData?.key && !showVideoPreview) {
      const timer = setTimeout(() => {
        if (isHovered && !showVideoPreview) { // Only show if still hovering and not already playing
          setShowVideoPreview(true);
          setIsVideoPlaying(true);
          setLoadingVideo(false);
          setCountdown(0);
        }
      }, 2000);
      
      return () => clearTimeout(timer); // Cleanup timer if component unmounts or hover changes
    }
  }, [isHovered, videoData, showVideoPreview]);

  // Check if both image and video are loaded
  const isFullyLoaded = imageLoaded && (!loadingVideo || videoData);

  // Helper: check if image is already loaded (for cache)
  const checkImageLoaded = () => {
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth !== 0) {
      setBackdropLoading(false);
      setImageLoaded(true);
    }
  };

  // Reset image loaded state when banner changes, but only if not already loaded
  useEffect(() => {
    setBackdropError(false);
    setShowVideoPreview(false);
    setIsVideoPlaying(false);
    setIsHovered(false);
    setVideoStartedByClick(false); // Reset video started by click state when banner changes
    setLoadingVideo(false);
    // Do NOT reset videoData to null here; let the effect update it as soon as available
    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth !== 0) {
      setBackdropLoading(false);
      setImageLoaded(true);
    } else {
      setImageLoaded(false);
      setBackdropLoading(true);
    }
  }, [currentBanner, getPreloadedData]);

  const hasVideo = videoData?.key;
  const mediaType = main.media_type || 'movie';
  const backdropPath = getBestBackdrop(main.id, main.backdrop_path, 'https://image.tmdb.org/t/p/', mediaType) || 
    `https://picsum.photos/seed/${main?.id || 'default'}/1920/1080`;

  // Debug logging - only when data changes
  useEffect(() => {
    if (main?.id && imageURL) {
      console.log('BannerHome Debug:');
      console.log('  ID:', main?.id);
      console.log('  Title:', main?.title || main?.name);
      console.log('  Has Video:', !!videoData?.key);
      console.log('  Video Key:', videoData?.key || 'none');
      console.log('  Is Hovered:', isHovered);
      console.log('  Show Video Preview:', showVideoPreview);
      console.log('  Next Preloaded:', !!nextPreloaded);
      console.log('  Prev Preloaded:', !!prevPreloaded);
      console.log('  Is Preloading:', isPreloading);
    }
  }, [main?.id, imageURL, videoData?.key, isHovered, showVideoPreview, nextPreloaded, prevPreloaded, isPreloading]);

  const isLoadingImages = backdropLoading;
  const imageError = backdropError;

  return (
    <section 
      className="w-full h-[60vh] md:h-[70vh] lg:h-[85vh] xl:h-[90vh] relative overflow-hidden bg-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background media */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentBanner}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image (always visible) */}
          <img
            ref={imageRef}
            src={backdropPath}
            alt={main.title || main.name}
            className="w-full h-full object-cover object-center"
            loading="eager"
            onLoad={() => { 
              setBackdropLoading(false);
              setImageLoaded(true);
            }}
            onError={() => { setBackdropError(true); }}
          />
          
          {/* Preload next image in background */}
          {validBannerData.length > 1 && nextPreloaded?.item?.backdrop_path && (
            <img
              src={getOptimizedImageURL(nextPreloaded.item.backdrop_path, 'https://image.tmdb.org/t/p/', 'backdrop')}
              alt=""
              className="hidden"
              loading="lazy"
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Video Preview Overlay (shows on hover) */}
      <AnimatePresence>
        {showVideoPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 w-full h-full"
          >
            <div className="w-full h-full relative">
              {/* YouTube Video with Sound - Full Screen */}
              {hasVideo && (
                <iframe
                  src={`https://www.youtube.com/embed/${videoData.key}?autoplay=1&mute=0&controls=0&loop=1&playlist=${videoData.key}&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&fs=0&wmode=transparent&enablejsapi=1&disablekb=1&color=white&theme=dark&autohide=1&playsinline=1&origin=${window.location.origin}&widget_referrer=${window.location.origin}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={() => { 
                    console.log('Video preview loaded successfully'); 
                    setIsVideoPlaying(true);
                  }}
                  onError={() => { console.log('Video preview failed to load'); }}
                  style={{
                    pointerEvents: 'none' // Disable all interactions with YouTube UI
                  }}
                />
              )}
              
              {/* Video Loading State */}
              {loadingVideo && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-sm">Loading video preview...</p>
                  </div>
                </div>
              )}
              
              {/* Countdown Indicator */}
              {isHovered && countdown > 0 && !showVideoPreview && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">⏱️</div>
                    <p className="text-lg font-bold mb-2">Video starts in</p>
                    <div className="text-4xl font-bold text-red-400">{countdown}</div>
                    <p className="text-sm mt-2">Keep hovering to watch</p>
                  </div>
                </div>
              )}
              
              {/* No Video Available State */}
              {!hasVideo && !loadingVideo && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-30">
                  <div className="text-white text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <p className="text-sm">No video preview available</p>
                  </div>
                </div>
              )}
              
              {/* Content Overlay on Video */}
              <div className="absolute inset-0 z-20 flex flex-col justify-center h-full px-4 md:px-8 lg:px-16 pb-4 md:pb-8 max-w-xs md:max-w-lg lg:max-w-xl">
                <motion.h1 
                  className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <span className="text-white font-extrabold drop-shadow-lg">{(main.title || main.name || '').split(' ')[0]}</span>{' '}
                  <span className="text-white/90 font-bold">{(main.title || main.name || '').split(' ').slice(1).join(' ')}</span>
                </motion.h1>

                {/* Description (Netflix style, ellipsis, small) */}
                {main.overview && (
                  <motion.p
                    className="text-neutral-200 text-xs md:text-sm lg:text-base font-normal mb-3 line-clamp-2 max-w-md md:max-w-lg lg:max-w-xl"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.7 }}
                  >
                    {main.overview}
                  </motion.p>
                )}

                <motion.div 
                  className="flex flex-wrap items-center gap-2 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.8 }}
                >
                  <span className="bg-yellow-500/20 text-yellow-400 font-medium px-2 py-0.5 rounded text-[10px] md:text-xs flex items-center">
                    <FaStar className="mr-1" /> {Number(main.vote_average).toFixed(1)}
                  </span>
                  <span className="text-white/70 font-medium text-[10px] md:text-xs">{main.release_date?.split('-')[0] || ''}</span>
                  {main.runtime && (
                    <span className="text-white/70 font-medium text-[10px] md:text-xs">
                      {Math.floor(main.runtime / 60)}h {main.runtime % 60}m
                    </span>
                  )}
                  <span className="text-white/70 font-medium text-[10px] md:text-xs border border-white/20 px-1.5 py-0.5 rounded">
                    {main.adult ? '18+' : 'PG-13'}
                  </span>
                  {hasVideo && (
                    <span className="text-white/70 font-medium text-[10px] md:text-xs flex items-center">
                      <MdHighQuality className="mr-1 text-blue-400" /> HD
                    </span>
                  )}
                </motion.div>

                <motion.div 
                  className="flex gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.8 }}
                >
                  {!showVideoPreview ? (
                    <motion.button 
                      className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-4 py-2 rounded text-sm shadow transition"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePlayClick}
                    >
                      <FaPlay size={12} /> Play
                    </motion.button>
                  ) : (
                    <motion.button 
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded text-sm shadow transition"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStopVideo}
                    >
                      <FaStop size={12} /> Stop
                    </motion.button>
                  )}
                  <motion.button 
                    className="flex items-center gap-2 bg-neutral-600/70 hover:bg-neutral-600/90 text-white font-semibold px-4 py-2 rounded text-sm shadow transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInfoClick}
                  >
                    <IoMdInformationCircleOutline size={14} /> Info
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
      
      {/* Content */}
      <motion.div 
        className="relative z-20 flex flex-col justify-center  h-full px-4 md:px-8 lg:px-16 pb-4 md:pb-8 max-w-xs md:max-w-lg lg:max-w-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <motion.h1 
          className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-lg tracking-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          <span className="text-white font-extrabold drop-shadow-lg">{(main.title || main.name || '').split(' ')[0]}</span>{' '}
          <span className="text-white/90 font-bold">{(main.title || main.name || '').split(' ').slice(1).join(' ')}</span>
        </motion.h1>

        {/* Description (Netflix style, ellipsis, small) */}
        {main.overview && (
          <motion.p
            className="text-neutral-200 text-xs md:text-sm lg:text-base font-normal mb-3 line-clamp-2 max-w-md md:max-w-lg lg:max-w-xl"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            {main.overview}
          </motion.p>
        )}

        <motion.div 
          className="flex flex-wrap items-center gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
        >
          <span className="bg-yellow-500/20 text-yellow-400 font-medium px-2 py-0.5 rounded text-[10px] md:text-xs flex items-center">
            <FaStar className="mr-1" /> {Number(main.vote_average).toFixed(1)}
          </span>
          <span className="text-white/70 font-medium text-[10px] md:text-xs">{main.release_date?.split('-')[0] || ''}</span>
          {main.runtime && (
            <span className="text-white/70 font-medium text-[10px] md:text-xs">
              {Math.floor(main.runtime / 60)}h {main.runtime % 60}m
            </span>
          )}
          <span className="text-white/70 font-medium text-[10px] md:text-xs border border-white/20 px-1.5 py-0.5 rounded">
            {main.adult ? '18+' : 'PG-13'}
          </span>
          {hasVideo && (
            <span className="text-white/70 font-medium text-[10px] md:text-xs flex items-center">
              <MdHighQuality className="mr-1 text-blue-400" /> HD
            </span>
          )}
        </motion.div>

        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          {!showVideoPreview ? (
            <motion.button 
              className="flex items-center gap-2 bg-white hover:bg-white/90 text-black font-semibold px-4 py-2 rounded text-sm shadow transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayClick}
            >
              <FaPlay size={12} /> Play
            </motion.button>
          ) : (
            <motion.button 
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded text-sm shadow transition"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopVideo}
            >
              <FaStop size={12} /> Stop
            </motion.button>
          )}
          <motion.button 
            className="flex items-center gap-2 bg-neutral-600/70 hover:bg-neutral-600/90 text-white font-semibold px-4 py-2 rounded text-sm shadow transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleInfoClick}
          >
            <IoMdInformationCircleOutline size={14} /> Info
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Left/Right navigation arrows */}
      {validBannerData.length > 1 && (
        <>
          <button
            className={`absolute left-2 top-1/2 z-50 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition shadow-lg ${prevPreloaded ? 'ring-2 ' : ''}`}
            onClick={goToPrevious}
            aria-label="Previous banner"
            title={prevPreloaded ? 'Preloaded - instant navigation' : 'Loading...'}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button
            className={`absolute right-2 top-1/2 z-50 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition shadow-lg ${nextPreloaded ? 'ring-2 ' : ''}`}
            onClick={goToNext}
            aria-label="Next banner"
            title={nextPreloaded ? 'Preloaded - instant navigation' : 'Loading...'}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </>
      )}

      {/* Loader for backdrop image */}
      {(backdropLoading || backdropError) && !showVideoPreview && (
        <div className="absolute inset-0 z-20">
          <Loader
            isLoadingImages={backdropLoading}
            imageError={backdropError}
            onRetry={backdropError ? retryBackdrop : undefined}
          />
        </div>
      )}

      {/* Preloading indicator */}
      {isPreloading && validBannerData.length > 1 && (
        <div className="absolute top-4 right-4 z-50 bg-black/60 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Preloading next video...
        </div>
      )}
    </section>
  );
};

export default BannerHome;