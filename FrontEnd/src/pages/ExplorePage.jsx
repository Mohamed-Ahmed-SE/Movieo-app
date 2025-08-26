import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { toast } from 'react-hot-toast'
import { 
  Search, Grid3X3, List, Play, Heart, Bookmark, Star
} from 'lucide-react'
import UnifiedMovieCard from '../components/UnifiedMovieCard'
import { CustomSkeletonLoader } from '../components/EnhancedLoader'
import Breadcrumb from '../components/Breadcrumb'
import Loader from '../components/Loader'
import { useTheme } from '../contexts/ThemeContext'
import { apiRequest } from '../utils/apiUtils'
import { getOptimizedImageURL } from '../utils/imageUtils'

const CATEGORY_MAP = {
  // ===== Language =====
  language: { type: 'both', with_original_language: 'en' },
  english: { type: 'both', with_original_language: 'en' },
  spanish: { type: 'both', with_original_language: 'es' },
  french: { type: 'both', with_original_language: 'fr' },
  german: { type: 'both', with_original_language: 'de' },
  italian: { type: 'both', with_original_language: 'it' },
  portuguese: { type: 'both', with_original_language: 'pt' },
  russian: { type: 'both', with_original_language: 'ru' },
  japanese: { type: 'both', with_original_language: 'ja' },
  korean: { type: 'both', with_original_language: 'ko' },
  chinese: { type: 'both', with_original_language: 'zh' },
  hindi: { type: 'both', with_original_language: 'hi' },
  arabic: { type: 'both', with_original_language: 'ar' },

  // ===== Genre (Movies) =====
  'movie/genre/action': { type: 'movie', with_genres: '28' },
  'movie/genre/adventure': { type: 'movie', with_genres: '12' },
  'movie/genre/comedy': { type: 'movie', with_genres: '35' },
  'movie/genre/crime': { type: 'movie', with_genres: '80' },
  'movie/genre/documentary': { type: 'movie', with_genres: '99' },
  'movie/genre/drama': { type: 'movie', with_genres: '18' },
  'movie/genre/family': { type: 'movie', with_genres: '10751' },
  'movie/genre/fantasy': { type: 'movie', with_genres: '14' },
  'movie/genre/horror': { type: 'movie', with_genres: '27' },
  'movie/genre/mystery': { type: 'movie', with_genres: '9648' },
  'movie/genre/romance': { type: 'movie', with_genres: '10749' },
  'movie/genre/sci-fi': { type: 'movie', with_genres: '878' },
  'movie/genre/thriller': { type: 'movie', with_genres: '53' },
  'movie/genre/war': { type: 'movie', with_genres: '10752' },
  'movie/genre/western': { type: 'movie', with_genres: '37' },
  'movie/genre/animation': { type: 'movie', with_genres: '16' },

  // ===== Genre (TV) =====
  'tv/genre/action': { type: 'tv', with_genres: '10759' },
  'tv/genre/adventure': { type: 'tv', with_genres: '10759' },
  'tv/genre/comedy': { type: 'tv', with_genres: '35' },
  'tv/genre/crime': { type: 'tv', with_genres: '80' },
  'tv/genre/documentary': { type: 'tv', with_genres: '99' },
  'tv/genre/drama': { type: 'tv', with_genres: '18' },
  'tv/genre/family': { type: 'tv', with_genres: '10751' },
  'tv/genre/fantasy': { type: 'tv', with_genres: '10765' },
  'tv/genre/romance': { type: 'tv', with_genres: '10749' },
  'tv/genre/sci-fi': { type: 'tv', with_genres: '10765' },
  'tv/genre/thriller': { type: 'tv', with_genres: '53' },
  'tv/genre/animation': { type: 'tv', with_genres: '16' },

  // ===== Anime Categories =====
  // Anime Movies - Dynamic genre mapping
  'movie/anime/action': { type: 'movie', with_original_language: 'ja', with_genres: '16,28', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/adventure': { type: 'movie', with_original_language: 'ja', with_genres: '16,12', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/comedy': { type: 'movie', with_original_language: 'ja', with_genres: '16,35', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/drama': { type: 'movie', with_original_language: 'ja', with_genres: '16,18', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/fantasy': { type: 'movie', with_original_language: 'ja', with_genres: '16,14', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/horror': { type: 'movie', with_original_language: 'ja', with_genres: '16,27', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/mystery': { type: 'movie', with_original_language: 'ja', with_genres: '16,9648', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/romance': { type: 'movie', with_original_language: 'ja', with_genres: '16,10749', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/romance': { type: 'tv', special: 'anime_romance_series' },
  'movie/anime/sci-fi': { type: 'movie', with_original_language: 'ja', with_genres: '16,878', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/science-fiction': { type: 'movie', with_original_language: 'ja', with_genres: '16,878', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/sports': { type: 'movie', with_original_language: 'ja', with_genres: '16,10751', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/supernatural': { type: 'movie', with_original_language: 'ja', with_genres: '16,14', with_origin_country: 'JP', with_keywords: '210024' },
  'movie/anime/thriller': { type: 'movie', with_original_language: 'ja', with_genres: '16,53', with_origin_country: 'JP', with_keywords: '210024' },

  // General Anime Categories (when no specific genre is selected)
  'movie/anime': { type: 'movie', with_original_language: 'ja', with_genres: '16', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime': { type: 'tv', with_genres: '16', with_origin_country: 'JP', with_keywords: '210024' },

  // Animation Cartoons Movies (direct categories without subcategories)
  'movie/animation': { type: 'movie', with_genres: '16' },

  // Animation Cartoons TV Shows (direct categories without subcategories)
  'tv/animation': { type: 'tv', with_genres: '16' },

  // Animation Cartoons Movies
  'movie/animation/action': { type: 'movie', with_genres: '16,28' },
  'movie/animation/adventure': { type: 'movie', with_genres: '16,12' },
  'movie/animation/comedy': { type: 'movie', with_genres: '16,35' },
  'movie/animation/drama': { type: 'movie', with_genres: '16,18' },
  'movie/animation/fantasy': { type: 'movie', with_genres: '16,14' },
  'movie/animation/horror': { type: 'movie', with_genres: '16,27' },
  'movie/animation/mystery': { type: 'movie', with_genres: '16,9648' },
  'movie/animation/romance': { type: 'movie', with_genres: '16,10749' },
  'movie/animation/sci-fi': { type: 'movie', with_genres: '16,878' },
  'movie/animation/sports': { type: 'movie', with_genres: '16,10751' },
  'movie/animation/supernatural': { type: 'movie', with_genres: '16,14' },
  'movie/animation/thriller': { type: 'movie', with_genres: '16,53' },

  // Anime TV Shows - Dynamic genre mapping
  'tv/anime/action': { type: 'tv', with_genres: '16,28', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/adventure': { type: 'tv', with_genres: '16,12', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/comedy': { type: 'tv', with_genres: '16,35', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/drama': { type: 'tv', with_genres: '16,18', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/fantasy': { type: 'tv', with_genres: '16,14', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/horror': { type: 'tv', with_genres: '16,27', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/mystery': { type: 'tv', with_genres: '16,9648', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/sci-fi': { type: 'tv', with_genres: '16,878', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/science-fiction': { type: 'tv', with_genres: '16,878', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/sports': { type: 'tv', with_genres: '16,10751', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/supernatural': { type: 'tv', with_genres: '16,14', with_origin_country: 'JP', with_keywords: '210024' },
  'tv/anime/thriller': { type: 'tv', with_genres: '16,53', with_origin_country: 'JP', with_keywords: '210024' },

  // Animation Cartoons TV Shows
  'tv/animation/action': { type: 'tv', with_genres: '16,28' },
  'tv/animation/adventure': { type: 'tv', with_genres: '16,12' },
  'tv/animation/comedy': { type: 'tv', with_genres: '16,35' },
  'tv/animation/drama': { type: 'tv', with_genres: '16,18' },
  'tv/animation/fantasy': { type: 'tv', with_genres: '16,14' },
  'tv/animation/horror': { type: 'tv', with_genres: '16,27' },
  'tv/animation/mystery': { type: 'tv', with_genres: '16,9648' },
  'tv/animation/romance': { type: 'tv', with_genres: '16,10749' },
  'tv/animation/sci-fi': { type: 'tv', with_genres: '16,878' },
  'tv/animation/sports': { type: 'tv', with_genres: '16,10751' },
  'tv/animation/supernatural': { type: 'tv', with_genres: '16,14' },
  'tv/animation/thriller': { type: 'tv', with_genres: '16,53' },

  // ===== Year =====
  // ===== Year (Movies) =====
'2024': { type: 'movie', primary_release_year: '2024' },
'2023': { type: 'movie', primary_release_year: '2023' },
'2022': { type: 'movie', primary_release_year: '2022' },
'2021': { type: 'movie', primary_release_year: '2021' },
'2020': { type: 'movie', primary_release_year: '2020' },
'2019': { type: 'movie', primary_release_year: '2019' },
'2018': { type: 'movie', primary_release_year: '2018' },
'2017': { type: 'movie', primary_release_year: '2017' },
'2016': { type: 'movie', primary_release_year: '2016' },
'2015': { type: 'movie', primary_release_year: '2015' },
'2014': { type: 'movie', primary_release_year: '2014' },
'2013': { type: 'movie', primary_release_year: '2013' },
'2012': { type: 'movie', primary_release_year: '2012' },
'2011': { type: 'movie', primary_release_year: '2011' },
'2010': { type: 'movie', primary_release_year: '2010' },
'2009': { type: 'movie', primary_release_year: '2009' },
'2008': { type: 'movie', primary_release_year: '2008' },
'2007': { type: 'movie', primary_release_year: '2007' },
'2006': { type: 'movie', primary_release_year: '2006' },
'2005': { type: 'movie', primary_release_year: '2005' },
'2004': { type: 'movie', primary_release_year: '2004' },
'2003': { type: 'movie', primary_release_year: '2003' },
'2002': { type: 'movie', primary_release_year: '2002' },
'2001': { type: 'movie', primary_release_year: '2001' },
'2000': { type: 'movie', primary_release_year: '2000' },

// ===== Year (TV Shows) =====
'tv-2024': { type: 'tv', first_air_date_year: '2024' },
'tv-2023': { type: 'tv', first_air_date_year: '2023' },
'tv-2022': { type: 'tv', first_air_date_year: '2022' },
'tv-2021': { type: 'tv', first_air_date_year: '2021' },
'tv-2020': { type: 'tv', first_air_date_year: '2020' },
'tv-2019': { type: 'tv', first_air_date_year: '2019' },
'tv-2018': { type: 'tv', first_air_date_year: '2018' },
'tv-2017': { type: 'tv', first_air_date_year: '2017' },
'tv-2016': { type: 'tv', first_air_date_year: '2016' },
'tv-2015': { type: 'tv', first_air_date_year: '2015' },
'tv-2014': { type: 'tv', first_air_date_year: '2014' },
'tv-2013': { type: 'tv', first_air_date_year: '2013' },
'tv-2012': { type: 'tv', first_air_date_year: '2012' },
'tv-2011': { type: 'tv', first_air_date_year: '2011' },
'tv-2010': { type: 'tv', first_air_date_year: '2010' },
'tv-2009': { type: 'tv', first_air_date_year: '2009' },
'tv-2008': { type: 'tv', first_air_date_year: '2008' },
'tv-2007': { type: 'tv', first_air_date_year: '2007' },
'tv-2006': { type: 'tv', first_air_date_year: '2006' },
'tv-2005': { type: 'tv', first_air_date_year: '2005' },
'tv-2004': { type: 'tv', first_air_date_year: '2004' },
'tv-2003': { type: 'tv', first_air_date_year: '2003' },
'tv-2002': { type: 'tv', first_air_date_year: '2002' },
'tv-2001': { type: 'tv', first_air_date_year: '2001' },
'tv-2000': { type: 'tv', first_air_date_year: '2000' },


  // ===== Ratings =====
  'rating-9': { type: 'both', vote_average_gte: 9, vote_count_gte: 100 },
  'rating-8': { type: 'both', vote_average_gte: 8, vote_count_gte: 100 },
  'rating-7': { type: 'both', vote_average_gte: 7, vote_count_gte: 100 },
  'rating-6': { type: 'both', vote_average_gte: 6, vote_count_gte: 100 },

  // ===== Awards/Special Tags =====
  oscar: { type: 'movie', with_keywords: '180547' },
  'golden-globe': { type: 'movie', with_keywords: '180547' },
  marvel: { type: 'both', with_keywords: '180547' },
  dc: { type: 'both', with_keywords: '849' },
  pixar: { type: 'movie', with_keywords: '612' },
  ghibli: { type: 'movie', with_keywords: '14643' },

  // ===== Sorting Categories =====
  trending: { type: 'both', sort_by: 'popularity.desc' },
  'top-rated': { type: 'both', sort_by: 'vote_average.desc', vote_count_gte: 100 },
  upcoming: { type: 'movie', sort_by: 'primary_release_date.desc' }
};

const MAX_ANIME_RESULTS = 100;
const ANIME_PAGE_SIZE = 20;

// Helper: TMDB genre IDs for anime subcategories
const ANIME_GENRE_MAP = {
  action: '28',
  adventure: '12',
  comedy: '35',
  drama: '18',
  fantasy: '14',
  horror: '27',
  mystery: '9648',
  romance: '10749',
  'sci-fi': '878',
  sports: '10751', // closest: Family
  supernatural: '14', // closest: Fantasy
  thriller: '53',
};

// List of 120 popular romance anime titles
const ROMANCE_ANIME_TITLES = [
  "My Dress-Up Darling",
  "Kimi ni Todoke",
  "Toradora!",
  "Your Lie in April",
  "Orange",
  "Fruits Basket",
  "Clannad",
  "Anohana: The Flower We Saw That Day",
  "Nisekoi",
  "Golden Time",
  "Sakurasou no Pet na Kanojo",
  "Oregairu",
  "Kokoro Connect",
  "White Album 2",
  "Amagami SS",
  "School Days",
  "Kamisama Kiss",
  "Maid Sama!",
  "Kaichou wa Maid-sama!",
  "Special A",
  "Lovely Complex",
  "Itazura na Kiss",
  "Say I Love You",
  "Blue Spring Ride",
  "Wolf Girl and Black Prince",
  "My Little Monster",
  "Honey and Clover",
  "Nodame Cantabile",
  "True Tears",
  "Kimi ni Todoke: From Me to You",
  "Violet Evergarden",
"Erased",
"A Silent Voice",
"The Garden of Words",
"Your Name",
"Weathering With You",
"The Wind Rises",
"Spirited Away",
"Howl’s Moving Castle",
"My Neighbor Totoro",
"Princess Mononoke",
"5 Centimeters per Second",
"Anohana",
"Clannad: After Story",
"ReLIFE",
"March Comes in Like a Lion",
"Barakamon",
"Hyouka",
"Natsume’s Book of Friends",
"The Pet Girl of Sakurasou",
"Angel Beats!",
"Rascal Does Not Dream of Bunny Girl Senpai",
"Plastic Memories",
"Charlotte",
"Iroduku: The World in Colors",
"Tsuki ga Kirei",
"Bloom Into You",
"Horimiya",
"Ao Haru Ride",
"Say 'I Love You'",
"Wolf Children",
"The Girl Who Leapt Through Time",
"Tamako Love Story",
"Whisper of the Heart",
"When Marnie Was There",
"The Anthem of the Heart",
"Ride Your Wave",
"Belle",
"Josee, the Tiger and the Fish",
"Summer Wars",
"Children Who Chase Lost Voices",
"I Want to Eat Your Pancreas",
"The Place Promised in Our Early Days",
"The Tale of the Princess Kaguya",
"A Whisker Away",
"Hello World",
"Flavors of Youth",
"Fireworks",
"The Night Is Short, Walk on Girl",
"Words Bubble Up Like Soda Pop",
"Colorful",
"The Tatami Galaxy",
"Little Busters!",
"Kanon",
"Air",
"One Week Friends",
"The World of Narue",
"Myself; Yourself",
"Waiting in the Summer",
"Just Because!",
"Sora yori mo Tooi Basho",
"Tsurezure Children",
"Kimi no Suizou wo Tabetai",
"K-On!",
"Love, Chunibyo & Other Delusions",
"Beyond the Boundary",
"Sound! Euphonium",
"Haruhi Suzumiya",
"Tsuritama",
"Tari Tari",
"Lovely★Complex",
"The World God Only Knows",
"Skip Beat!",
"Ouran High School Host Club",
"Nagi no Asukara",
"Zutto Mae Kara Suki Deshita",
"Nana",
"Paradise Kiss",
"Hachimitsu to Clover",
"Kare Kano",
"Bokura ga Ita",
"Kimi ni Iro",
"Romeo x Juliet",
"My Love Story!!",
"Tonari no Kaibutsu-kun",
"Love and Lies",
"Orange: Mirai",
"She and Her Cat",
"Shelter",
"Omoide Poroporo",
"Oniisama e...",
"Dear Brother",
"Yagate Kimi ni Naru",
"Hanasaku Iroha",
"Shigatsu wa Kimi no Uso",
"Glasslip",
"Hatsukoi Limited",
"Gekkan Shoujo Nozaki-kun",
"Watashi ni Tenshi ga Maiorita!",
"Seiren",
"Kuzu no Honkai",
"Senryuu Shoujo",
"Kimi to, Nami ni Noretara",
"Ojisan to Marshmallow",
"Kimi no Koe wo Todoketai",
"Happy Sugar Life",
"Given",
"Sasaki and Miyano",
"Doukyuusei: Classmates",
"Yuri!!! on Ice",
"Cherry Magic! Thirty Years of Being a Virgin Can Make You a Wizard?!",
"Love Stage!!",
"Junjou Romantica",
"Sekaiichi Hatsukoi",
"Hitorijime My Hero",
"Twittering Birds Never Fly ~ The Clouds Gather",
"The Stranger by the Shore",
"Super Lovers",
"The Titan's Bride",
"Tadaima, Okaeri",
"Maiden Rose",
"The Night Beyond the Tricornered Window",
"No.6",
"Mignon",
"Antidote",
"Mo Dao Zu Shi (The Master of Diabolism)",
"Gakuen Heaven",
"RH Plus",
"Hybrid Child",
"Vassalord",
"Bronze: Zetsuai Since 1989",
"Semantic Error",
"Sasaki to Miyano: Hirano & Kagiura",
"Cherry Magic! Special",
"Honey and Clover BL? (fan work)",
"Third Party Cross Over",
"(Minor) Dakaichi: I'm Being Harassed by the Sexiest Man of the Year",




];

  // Helper to fetch anime data by title from TMDB
async function fetchAnimeByTitles(titles, startIndex = 0, count = 18) {
  const results = [];
  const seenTitles = new Set(); // Track seen titles to prevent duplicates
  
  // Get only the requested slice of titles
  const titlesToFetch = titles.slice(startIndex, startIndex + count);
  
  // Process titles in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < titlesToFetch.length; i += batchSize) {
    const batch = titlesToFetch.slice(i, i + batchSize);
    const batchPromises = batch.map(title =>
      apiRequest('/search/tv', { params: { query: title, language: 'en-US' } })
        .then(res => res.data.results[0]) // Take the first result for each title
        .catch(() => null)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Filter out duplicates and null results
    const uniqueResults = batchResults.filter(item => {
      if (!item) return false; // Remove null results
      
      const titleKey = `${item.title || item.name}-${item.media_type}`;
      if (seenTitles.has(titleKey)) return false; // Remove duplicates
      
      seenTitles.add(titleKey);
      return true;
    });
    
    results.push(...uniqueResults);
    
    // Add delay between batches to avoid rate limiting
    if (i + batchSize < titlesToFetch.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    }
  }
  
  return results;
}

// Helper to normalize keys
function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '-');
}

const ExplorePage = () => {
  const { isDarkMode } = useTheme();
  const params = useParams();
  const type = params.type;
  const category = params.category;
  const subcategory = params.subcategory;
  const explore = params.explore;
  const actualExplore = type || explore;
  const navigate = useNavigate();
  
  // Combine category and subcategory if both exist
  const fullCategory = subcategory ? `${category}/${subcategory}` : category;
  
  // Normalize category and subcategory keys
  const normCategory = normalizeKey(category);
  const normSubcategory = normalizeKey(subcategory);
  // Fix year category lookup for TV and handle anime categories
  const normFullCategory = category === 'year' && type === 'tv'
    ? `tv-${normSubcategory}`
    : category === 'anime'
    ? normSubcategory ? `${type}/${normCategory}/${normSubcategory}` : `${type}/${normCategory}`
    : normSubcategory ? `${type}/${normCategory}/${normSubcategory}` : `${type}/${normCategory}`;
  
  // Add debug logging for received params
  console.log('ExplorePage received params:', { type, category, subcategory, normFullCategory });
  
  const [pageNo, setPageNo] = useState(1)
  const [data, setData] = useState([])
  const [totalPageNo, setTotalPageNo] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'


  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const containerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Separate initial data from load more data to prevent re-renders
  const [initialData, setInitialData] = useState([]);
  const [loadMoreData, setLoadMoreData] = useState([]);
  
  // Sort function - always sort by popularity descending (most popular first)
  const sortResults = (results) => {
    return [...results].sort((a, b) => {
      const aValue = a.popularity || 0;
      const bValue = b.popularity || 0;
      return aValue < bValue ? 1 : -1; // Most popular first
    });
  };
  
  // Combine data for display and sort ALL data by popularity
  const resultsToShow = useMemo(() => {
    const allData = [...initialData, ...loadMoreData];
    
    if (allData.length === 0) return [];
    
    // For anime romance series, preserve order (new items at bottom)
    // For other categories, sort by popularity
    const isAnimeRomanceSeries = normFullCategory === 'tv/anime/romance';
    
    if (isAnimeRomanceSeries) {
      // Keep original order for anime romance series (new items at bottom)
      return allData;
    } else {
      // Sort by popularity for other categories
      return sortResults(allData);
    }
  }, [initialData, loadMoreData, normFullCategory]);

  // Memoized fetch function
  const fetchData = useCallback(async () => {
    if (!hasMore) return;
    
    // Only set loading to true for initial loads, not for load more
    if (pageNo === 1) {
      setLoading(true);
    }
    setError(null)
    
    try {
      let results = [];
      let totalPages = 0;
      let cat = null; // Declare cat variable at function scope
      
      if (category === 'anime' && searchQuery) {
        // TMDB search for anime
        const response = await apiRequest('/search/multi', {
          params: {
            query: searchQuery,
            page: pageNo,
            include_adult: false,
            include_video: false,
            language: 'en-US',
            region: 'US'
          }
        });
        results = response.data.results || [];
        totalPages = response.data.total_pages;
      } else if (type && fullCategory) {
        // Check for the full category first (e.g., 'anime/action')
        cat = CATEGORY_MAP[normFullCategory];
        
        // Debug the exact lookup
        console.log('CATEGORY_MAP lookup:', { 
          normFullCategory, 
          found: !!cat, 
          availableKeys: Object.keys(CATEGORY_MAP).filter(key => key.includes('anime'))
        });
        
        // If not found, try the base category
        if (!cat) {
          cat = CATEGORY_MAP[normCategory];
        }
        
        // For year categories, also try the subcategory directly
        if (!cat && category === 'year' && subcategory) {
          cat = CATEGORY_MAP[normSubcategory];
        }
        
        // Debug logging
                    console.log('Category lookup:', { fullCategory, normFullCategory, category, subcategory, cat, type });
            console.log('URL params:', { type, category, subcategory, fullCategory });
            
            // Debug anime series specifically
            if (fullCategory?.includes('anime') && type === 'tv') {
              console.log('Anime series detected:', { fullCategory, cat, params });
            }
        
        if (cat) {
          console.log('Found category config:', cat);
          console.log('Checking for special case:', cat.special);
          if (cat.special === 'trending') {
            const trendingType = type === 'movie' ? 'movie' : 'tv';
            const response = await apiRequest(`/trending/${trendingType}/day`, {
              params: { page: pageNo }
            });
            results = response.data.results || [];
            totalPages = response.data.total_pages;
          } else if (cat.special === 'top_rated') {
            const topRatedType = type === 'movie' ? 'movie' : 'tv';
            const response = await apiRequest(`/${topRatedType}/top_rated`, {
              params: { page: pageNo }
            });
            results = response.data.results || [];
            totalPages = response.data.total_pages;
          } else if (cat.special === 'upcoming') {
            const response = await apiRequest('/movie/upcoming', {
              params: { page: pageNo }
            });
            results = response.data.results || [];
            totalPages = response.data.total_pages;
          } else if (cat.special === 'anime_romance_series') {
            // Fetch anime data by titles from TMDB API with pagination
            console.log('Fetching anime romance series from API');
            console.log('ROMANCE_ANIME_TITLES length:', ROMANCE_ANIME_TITLES.length);
            
            try {
              // Calculate pagination
              const itemsPerPage = 18;
              const currentStartIndex = (pageNo - 1) * itemsPerPage;
              
              const fetchedResults = await fetchAnimeByTitles(ROMANCE_ANIME_TITLES, currentStartIndex, itemsPerPage);
              
              // Add unique keys to prevent duplicate key warnings
              const resultsWithUniqueKeys = fetchedResults.map((item, index) => ({
                ...item,
                uniqueKey: `${item.id}-${currentStartIndex + index}` // Combine ID with global index for uniqueness
              }));
              
              results = resultsWithUniqueKeys;
              totalPages = Math.ceil(ROMANCE_ANIME_TITLES.length / itemsPerPage); // Calculate total pages
              console.log('Fetched anime results:', fetchedResults.length, 'Page:', pageNo, 'of', totalPages, 'Items per page:', itemsPerPage);
            } catch (error) {
              console.error('Error fetching anime data:', error);
              results = [];
              totalPages = 0;
            }
          } else {
            // Handle genre-based categories
            let endpoint = type === 'movie' ? 'discover/movie' : 'discover/tv';
            const params = {
              page: pageNo,
              sort_by: 'popularity.desc',
              include_adult: false,
              include_video: false
            };

            if (cat.with_genres) {
              // For genre categories, use the subcategory as the genre
              if (category === 'genre' && subcategory) {
                // Different genre IDs for movies vs TV shows
                const movieGenreMap = {
                  action: '28',
                  adventure: '12',
                  animation: '16',
                  comedy: '35',
                  crime: '80',
                  documentary: '99',
                  drama: '18',
                  family: '10751',
                  fantasy: '14',
                  history: '36',
                  horror: '27',
                  music: '10402',
                  mystery: '9648',
                  romance: '10749',
                  'sci-fi': '878',
                  thriller: '53',
                  war: '10752',
                  western: '37'
                };
                
                const tvGenreMap = {
                  action: '10759',
                  adventure: '10759',
                  animation: '16',
                  comedy: '35',
                  crime: '80',
                  documentary: '99',
                  drama: '18',
                  family: '10751',
                  fantasy: '10765',
                  history: '36',
                  horror: '27',
                  music: '10402',
                  mystery: '9648',
                  romance: '10749',
                  'sci-fi': '10765',
                  thriller: '53',
                  war: '10752',
                  western: '37'
                };
                
                const genreMap = type === 'movie' ? movieGenreMap : tvGenreMap;
                params.with_genres = genreMap[subcategory] || cat.with_genres;
                console.log('Genre mapping:', { subcategory, type, genreMap: genreMap[subcategory], finalGenre: params.with_genres });
              } else {
                params.with_genres = cat.with_genres;
              }
            }

            if (cat.with_original_language) {
              // For language categories, use the subcategory as the language code
              if (category === 'language' && subcategory) {
                const languageMap = {
                  english: 'en',
                  spanish: 'es',
                  french: 'fr',
                  german: 'de',
                  italian: 'it',
                  portuguese: 'pt',
                  russian: 'ru',
                  japanese: 'ja',
                  korean: 'ko',
                  chinese: 'zh',
                  hindi: 'hi',
                  arabic: 'ar'
                };
                params.with_original_language = languageMap[subcategory] || cat.with_original_language;
                console.log('Language mapping:', { subcategory, language: languageMap[subcategory], finalLanguage: params.with_original_language });
              } else {
                params.with_original_language = cat.with_original_language;
              }
            }

            if (cat.with_keywords) {
              params.with_keywords = cat.with_keywords;
            }

            if (cat.with_origin_country) {
              params.with_origin_country = cat.with_origin_country;
            }

            if (cat.region) {
              params.region = cat.region;
            }

            // Handle year categories - FIXED FOR CORRECT TYPE
            if (category === 'year' && subcategory) {
              const yearMap = {
                '2024': '2024',
                '2023': '2023',
                '2022': '2022',
                '2021': '2021',
                '2020': '2020',
                '2019': '2019',
                '2018': '2018',
                '2017': '2017',
                '2016': '2016',
                '2015': '2015',
                '2014': '2014',
                '2013': '2013',
                '2012': '2012',
                '2011': '2011',
                '2010': '2010',
                '2009': '2009',
                '2008': '2008',
                '2007': '2007',
                '2006': '2006',
                '2005': '2005',
                '2004': '2004',
                '2003': '2003',
                '2002': '2002',
                '2001': '2001',
                '2000': '2000',
                'classic': '1900-1969'
              };
              const yearValue = yearMap[subcategory];
              console.log('Year mapping:', { subcategory, yearValue, type });
              
              if (yearValue) {
                if (yearValue.includes('-')) {
                  const [startYear, endYear] = yearValue.split('-');
                  if (type === 'movie') {
                    params.primary_release_date_gte = `${startYear}-01-01`;
                    params.primary_release_date_lte = `${endYear}-12-31`;
                  } else {
                    params.first_air_date_gte = `${startYear}-01-01`;
                    params.first_air_date_lte = `${endYear}-12-31`;
                  }
                } else {
                  // FIXED: Use correct field based on type
                  if (type === 'movie') {
                    params.primary_release_year = yearValue;
                  } else {
                    params.first_air_date_year = yearValue;
                  }
                }
                console.log('Year params set:', params);
              }
            } else if (cat.year) {
              // FIXED: Use correct field based on type
              if (type === 'movie') {
                params.primary_release_year = cat.year;
              } else {
                params.first_air_date_year = cat.year;
              }
            } else if (cat.primary_release_year) {
              const [startYear, endYear] = cat.primary_release_year.split('-');
              if (type === 'movie') {
                params.primary_release_date_gte = `${startYear}-01-01`;
                params.primary_release_date_lte = `${endYear}-12-31`;
              } else {
                params.first_air_date_gte = `${startYear}-01-01`;
                params.first_air_date_lte = `${endYear}-12-31`;
              }
            }

            // Handle sort parameters
            if (cat.sort_by) {
              params.sort_by = cat.sort_by;
            }

            console.log('API Request params:', params);
            // Add debug logging for final API request
            console.log('Final TMDB API request:', { endpoint, params });
            const response = await apiRequest(`/${endpoint}`, {
              params
            });
            console.log('API Response:', response.data);
            
            // Enhanced fallback for anime categories
            if (!response || !response.data || !response.data.results || response.data.results.length === 0) {
              console.log('No results found, trying anime-specific fallback');
              
              // For anime categories, try a more specific fallback
              if (category === 'anime' || fullCategory?.includes('anime')) {
                const animeFallbackParams = {
                  page: pageNo,
                  sort_by: 'popularity.desc',
                  include_adult: false,
                  include_video: false,
                  with_genres: '16', // Animation genre
                  with_original_language: 'ja', // Japanese language
                  with_origin_country: 'JP' // Japanese origin
                };
                
                console.log('Trying anime fallback with params:', animeFallbackParams);
                const animeFallbackResponse = await apiRequest(`/${endpoint}`, {
                  params: animeFallbackParams
                });
                
                if (animeFallbackResponse.data.results && animeFallbackResponse.data.results.length > 0) {
                  console.log('Anime fallback successful');
                  results = animeFallbackResponse.data.results || [];
                  totalPages = animeFallbackResponse.data.total_pages;
                } else {
                  console.log('Anime fallback failed, using general popular content');
                  const fallbackEndpoint = type === 'movie' ? 'movie/popular' : 'tv/popular';
                  const fallbackResponse = await apiRequest(`/${fallbackEndpoint}`, {
                    params: { page: pageNo }
                  });
                  results = fallbackResponse.data.results || [];
                  totalPages = fallbackResponse.data.total_pages;
                }
              } else {
                console.log('No results found, using popular content as fallback');
                const fallbackEndpoint = type === 'movie' ? 'movie/popular' : 'tv/popular';
                const fallbackResponse = await apiRequest(`/${fallbackEndpoint}`, {
                  params: { page: pageNo }
                });
                results = fallbackResponse.data.results || [];
                totalPages = fallbackResponse.data.total_pages;
              }
            } else {
              results = response.data.results || [];
              totalPages = response.data.total_pages;
            }
          }
        } else {
          // Fallback: if category not found, get popular content
          console.log('Category not found, using popular content as fallback');
          const endpoint = type === 'movie' ? 'movie/popular' : 'tv/popular';
          const response = await apiRequest(`/${endpoint}`, {
            params: { page: pageNo }
          });
          results = response.data.results || [];
          totalPages = response.data.total_pages;
        }
      } else if (actualExplore && category !== 'anime') {
        // Handle single explore type (movie/tv)
        const endpoint = actualExplore === 'movie' ? 'movie/popular' : 'tv/popular';
        const response = await apiRequest(`/${endpoint}`, {
          params: { page: pageNo }
        });
        results = response.data.results || [];
        totalPages = response.data.total_pages;
      }

      // Process all data to add correct media_type based on Animation genre
      const processedResults = results.map(item => {
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
        
        // Keep original media_type for non-anime content
        return item;
      });
      
      // Transform anime content if needed
      const isAnimeCategory = category === 'anime' || fullCategory?.includes('anime');
      const transformedResults = transformAnimeContent(processedResults, isAnimeCategory);
      
      // Sort results by popularity (most popular first)
      const sortedResults = sortResults(transformedResults);
      
      // Debug anime series sorting
      if (fullCategory?.includes('anime') && type === 'tv') {
        console.log('Anime series sorting debug:', {
          originalCount: results.length,
          processedCount: processedResults.length,
          transformedCount: transformedResults.length,
          sortedCount: sortedResults.length,
          firstFewSorted: sortedResults.slice(0, 5).map(r => ({ 
            title: r.title || r.name, 
            popularity: r.popularity,
            media_type: r.media_type 
          }))
        });
      }

      // Regular handling for all categories (including anime romance series)
      if (pageNo === 1) {
        setInitialData(sortedResults);
        setLoadMoreData([]); // Reset load more data on initial load
      } else {
        // For load more, add new data to loadMoreData (append to bottom)
        setLoadMoreData(prev => {
          // Prevent duplicates by using uniqueKey for anime romance series, id for others
          const existingKeys = cat?.special === 'anime_romance_series' 
            ? new Set([...initialData, ...prev].map(item => item.uniqueKey))
            : new Set([...initialData, ...prev].map(item => item.id));
          
          const newItems = cat?.special === 'anime_romance_series'
            ? sortedResults.filter(item => !existingKeys.has(item.uniqueKey))
            : transformedResults.filter(item => !existingKeys.has(item.id));
          
          // Additional duplicate prevention: check by title and media_type
          const existingTitles = new Set([...initialData, ...prev].map(item => 
            `${item.title || item.name}-${item.media_type}`
          ));
          
          const finalNewItems = newItems.filter(item => 
            !existingTitles.has(`${item.title || item.name}-${item.media_type}`)
          );
          
          // Append new items to the end (bottom) of the list
          return [...prev, ...finalNewItems];
        });
      }
      
      setTotalPageNo(totalPages);
      setHasMore(pageNo < totalPages);
      
      
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [pageNo, type, category, subcategory, fullCategory, actualExplore, searchQuery]);

  // Transform and filter anime content
  const transformAnimeContent = (results, isAnimeCategory = false) => {
    if (!isAnimeCategory) return results;
    
    return results.map(item => {
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
      
      // Keep original media_type for non-anime content
      return item;
    });
  };

  // Refactor anime Load More logic
  const loadMore = (e) => {
    if (e) { 
      e.preventDefault(); 
      e.stopPropagation(); 
    }
    if (!loading && hasMore && !isFetchingMore) {
      setIsFetchingMore(true);
      setPageNo(prev => prev + 1);
    }
  };



  // Initial fetch - only when category/subcategory changes
  useEffect(() => {
    setPageNo(1);
    setInitialData([]);
    setLoadMoreData([]);
    setHasMore(true);
    setIsFetchingMore(false);
    fetchData();
  }, [type, category, subcategory, fullCategory, actualExplore]);

  // Load more fetch - only when pageNo changes and it's > 1
  useEffect(() => {
    if (pageNo > 1) {
      // Store current scroll position before loading
      scrollPositionRef.current = window.scrollY;
      
      fetchData().finally(() => {
        setIsFetchingMore(false);
        
        // Restore scroll position after loading (only if not initial load)
        if (!isInitialLoadRef.current && scrollPositionRef.current > 0) {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPositionRef.current);
          });
        }
      });
    }
  }, [pageNo]);

  // Track initial load
  useEffect(() => {
    if (initialData.length > 0) {
      isInitialLoadRef.current = false;
    }
  }, [initialData.length]);

  // Spring animations
  const pageSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { tension: 300, friction: 20 }
  });

  const formatTitle = (exploreType) => {
    if (type && category) {
      const categoryName = category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      const typeName = type === 'movie' ? 'Movies' : 'TV Shows';
      return `${categoryName} ${typeName}`;
    }
    return exploreType === 'movie' ? 'Movies' : 'TV Shows';
  };

  const getMediaType = (item) => {
    if (item.media_type) return item.media_type;
    if (item.title) return 'movie';
    if (item.name) return 'tv';
    return 'movie'; // Default to movie if media_type is not available
  };


  if (loading && pageNo === 1) {
    return <CustomSkeletonLoader count={12} className="pt-32" />;
  }

  return (
    <animated.div style={pageSpring} className={`min-h-screen pt-20 transition-all duration-500 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`} ref={containerRef}>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
        <Breadcrumb />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mt-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`text-4xl md:text-5xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatTitle(actualExplore)}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-lg ${
                  isDarkMode ? 'text-white/70' : 'text-gray-600'
                }`}
              >
                Discover amazing content in this category
              </motion.p>
            </div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4"
            >
              {/* View Mode Toggle */}
              <div className={`flex items-center backdrop-blur-sm rounded-lg p-1 ${
                isDarkMode ? 'bg-white/10' : 'bg-gray-100'
              }`}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-red-600 text-white' 
                      : isDarkMode
                        ? 'text-white/70 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-red-600 text-white' 
                      : isDarkMode
                        ? 'text-white/70 hover:text-white'
                        : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-5 h-5" />
                </motion.button>
              </div>


            </motion.div>
          </div>
        </motion.div>



        {/* Content Grid */}
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-red-400 text-xl mb-4">Error loading content</div>
            <p className={`${
              isDarkMode ? 'text-white/70' : 'text-gray-600'
            }`}>{error}</p>
          </motion.div>
        ) : (
          <>
            {/* Skeleton Loader for Load More */}
            {isFetchingMore && (
              <div className="flex justify-center items-center py-8 mt-8">
                <Loader size="lg" />
              </div>
            )}
            {/* Grid View */}
            {!loading && viewMode === 'grid' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4"
              >
                {resultsToShow
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
                      key={item.uniqueKey || item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                    >
                      <UnifiedMovieCard movie={item} index={index} />
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {/* List View */}
            {!loading && viewMode === 'list' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {resultsToShow
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
                      key={item.uniqueKey || item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      whileHover={{ scale: 1.01, y: -1 }}
                      onClick={() => navigate(`/${item.media_type || 'movie'}/${item.id}`)}
                      className={`backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 cursor-pointer ${
                        isDarkMode 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10'
                          : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Mobile Layout */}
                      <div className="block lg:hidden">
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={(() => {
                                const mediaType = getMediaType(item);
                                const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                                if (contentPoster) return contentPoster;
                                return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                              })()}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-bold truncate ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {item.title || item.name}
                              </h3>
                            </div>
                            <p className={`text-xs mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                              </div>
                              <span className={`${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                              }`}>
                                {item.release_date || item.first_air_date ? 
                                  new Date(item.release_date || item.first_air_date).getFullYear() : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tablet Layout */}
                      <div className="hidden lg:block xl:hidden">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={(() => {
                                const mediaType = getMediaType(item);
                                const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                                if (contentPoster) return contentPoster;
                                return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                              })()}
                              alt={item.title || item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className={`text-base font-bold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {item.title || item.name}
                              </h3>
                            </div>
                            <p className={`text-sm mb-2 line-clamp-2 ${
                              isDarkMode ? 'text-white/60' : 'text-gray-600'
                            }`}>
                              {item.overview}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                              </div>
                              <span className={`${
                                isDarkMode ? 'text-white/50' : 'text-gray-500'
                              }`}>
                                {item.release_date || item.first_air_date ? 
                                  new Date(item.release_date || item.first_air_date).getFullYear() : 
                                  'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden xl:flex items-center gap-4">
                        <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={(() => {
                              const mediaType = getMediaType(item);
                              const contentPoster = localStorage.getItem(`content_poster_${item.id}_${mediaType}`);
                              if (contentPoster) return contentPoster;
                              return item.poster_path ? getOptimizedImageURL(item.poster_path, 'https://image.tmdb.org/t/p/', 'poster') : `https://picsum.photos/seed/${item.id}/200/300`;
                            })()}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className={`text-lg font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.title || item.name}
                            </h3>
                          </div>
                          <p className={`text-sm mb-2 line-clamp-1 ${
                            isDarkMode ? 'text-white/60' : 'text-gray-600'
                          }`}>
                            {item.overview}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-yellow-400">
                              <Star className="w-4 h-4 fill-current" />
                              <span>{typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A'}</span>
                            </div>
                            <span className={`${
                              isDarkMode ? 'text-white/50' : 'text-gray-500'
                            }`}>
                              {item.release_date || item.first_air_date ? 
                                new Date(item.release_date || item.first_air_date).getFullYear() : 
                                'N/A'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </motion.div>
            )}

            {/* Load More Button */}
            {!loading && hasMore && resultsToShow.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center py-8"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={loadMore}
                  disabled={isFetchingMore}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {isFetchingMore ? (
                    <>
                      <Loader size="sm" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Load More
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}

            {/* No Results */}
            {!loading && resultsToShow.length === 0 && (
              <div className="text-center py-20">
                <div className="text-white/60 text-xl mb-4">No content found</div>
                <p className="text-white/40">Try adjusting your filters or search criteria</p>
              </div>
            )}
          </>
        )}
      </div>
    </animated.div>
  );
};

export default ExplorePage;