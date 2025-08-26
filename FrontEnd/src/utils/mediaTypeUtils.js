// Utility function to determine media type (movie, tv, anime)
export const getMediaType = (data) => {
  // For watchlist compatibility, always return the original media_type
  // Anime detection is handled separately by isAnimeContent()
  if (data.media_type === 'movie' || data.media_type === 'tv') return data.media_type;
  
  // Fallback logic for when media_type is not set
  if (data.title) return 'movie';
  if (data.name) return 'tv';
  
  // Default to movie if we can't determine
  return 'movie';
};

// Helper function to check if content is anime/animation
export const isAnimeContent = (item) => {
  // Check if it's explicitly marked as anime
  if (item.media_type === 'anime') {
    return true;
  }
  
  // Check ONLY for Animation genre
  const hasAnimationGenre = item.genres?.some(genre => 
    genre.name?.toLowerCase().includes('animation')
  );
  
  if (hasAnimationGenre) return true;
  
  // Also check genre_ids for animation (ID 16 is Animation)
  const hasAnimationGenreId = item.genre_ids?.includes(16);
  
  return hasAnimationGenreId;
}; 