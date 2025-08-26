import { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '../utils/apiUtils';
import { getOptimizedImageURL } from '../utils/imageUtils';

const useBannerPreloader = (bannerData, currentIndex) => {
  const [preloadedData, setPreloadedData] = useState(new Map());
  const [isPreloading, setIsPreloading] = useState(false);
  const preloadedDataRef = useRef(new Map());

  // Keep ref in sync with state
  useEffect(() => {
    preloadedDataRef.current = preloadedData;
  }, [preloadedData]);

  // Preload video data for a specific banner item
  const preloadVideoData = useCallback(async (bannerItem) => {
    if (!bannerItem?.id) return null;

    try {
      const mediaType = bannerItem.media_type || 'movie';
      const response = await apiRequest(`/${mediaType}/${bannerItem.id}/videos`);
      const data = response.data;
      
      // Get the first official trailer or teaser
      const trailer = data.results?.find(video => 
        video.type === 'Trailer' && video.site === 'YouTube'
      ) || data.results?.[0];
      
      return trailer;
    } catch (error) {
      console.error('Error preloading video data:', error);
      return null;
    }
  }, []);

  // Preload image for a specific banner item
  const preloadImage = useCallback((imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = imageUrl;
    });
  }, []);

  // Preload data for next, previous, and next-next items
  const preloadAdjacentItems = useCallback(async () => {
    if (!bannerData || bannerData.length === 0) return;
    setIsPreloading(true);
    const newPreloadedData = new Map(preloadedDataRef.current);
    try {
      const itemsToPreload = [];
      // Add next item
      const nextIndex = (currentIndex + 1) % bannerData.length;
      if (nextIndex !== currentIndex) {
        itemsToPreload.push({ index: nextIndex, item: bannerData[nextIndex] });
      }
      // Add previous item
      const prevIndex = (currentIndex - 1 + bannerData.length) % bannerData.length;
      if (prevIndex !== currentIndex && prevIndex !== nextIndex) {
        itemsToPreload.push({ index: prevIndex, item: bannerData[prevIndex] });
      }
      // Add next-next item for smoother transitions
      const nextNextIndex = (currentIndex + 2) % bannerData.length;
      if (nextNextIndex !== currentIndex && nextNextIndex !== nextIndex && nextNextIndex !== prevIndex) {
        itemsToPreload.push({ index: nextNextIndex, item: bannerData[nextNextIndex] });
      }
      // Preload data for each item
      for (const { index, item } of itemsToPreload) {
        if (!newPreloadedData.has(index)) {
          const videoData = await preloadVideoData(item);
          newPreloadedData.set(index, { videoData, item });
          if (item.backdrop_path) {
            const imageUrl = getOptimizedImageURL(item.backdrop_path, 'https://image.tmdb.org/t/p/', 'backdrop');
            try {
              await preloadImage(imageUrl);
            } catch (error) {}
          }
        }
      }
      setPreloadedData(newPreloadedData);
    } catch (error) {
      console.error('Error preloading adjacent items:', error);
    } finally {
      setIsPreloading(false);
    }
  }, [bannerData, currentIndex, preloadVideoData, preloadImage]);

  // Preload data when current index changes
  useEffect(() => {
    if (bannerData && bannerData.length > 0) {
      // Only preload banners with a valid image
      const validBannerData = bannerData.filter(item => item.backdrop_path);
      // Also preload current item if not already preloaded
      const currentItem = bannerData[currentIndex];
      if (currentItem && !preloadedDataRef.current.has(currentIndex)) {
        preloadVideoData(currentItem).then(videoData => {
          const newPreloadedData = new Map(preloadedDataRef.current);
          newPreloadedData.set(currentIndex, { videoData, item: currentItem });
          setPreloadedData(newPreloadedData);
        });
      }
      
      preloadAdjacentItems();
    }
  }, [currentIndex, bannerData, preloadAdjacentItems, preloadVideoData]);

  // Get preloaded data for a specific index
  const getPreloadedData = useCallback((index) => {
    return preloadedData.get(index);
  }, [preloadedData]);

  // Clear preloaded data for memory management
  const clearPreloadedData = useCallback(() => {
    setPreloadedData(new Map());
  }, []);

  return {
    preloadedData,
    isPreloading,
    getPreloadedData,
    clearPreloadedData,
    preloadAdjacentItems
  };
};

export default useBannerPreloader; 