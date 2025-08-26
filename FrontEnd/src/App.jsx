import { Outlet, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Footer from './components/Footer';
import MobileNavigation from './components/MobileNavigation';
import ScrollToTopButton from './components/ScrollToTopButton';
import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setBannerData, setImageURL } from './store/movieoSlice';
import { FullScreenLoader } from './components/EnhancedLoader';
import ErrorBoundary from './components/ErrorBoundary';
import { getTrending, getApiConfiguration, validateApiToken } from './utils/apiUtils';
import { scrollToTopSmooth } from './utils/scrollUtils';
import { useTheme } from './contexts/ThemeContext';

function App() {
  const dispatch = useDispatch()
  const location = useLocation();
  const { isDarkMode, isThemeLoading } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking', 'valid', 'invalid'
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showEnhancedLoader, setShowEnhancedLoader] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const initializedRef = useRef(false);
  const prevLocationRef = useRef(location.pathname);

  const fetchTrendingData = async () => {
    try {
      console.log('Fetching trending data...');
      const data = await getTrending('all', 'week');
      dispatch(setBannerData(data.results));
      return true;
    } catch (error) {
      console.error("Trending data error:", error);
      return false;
    }
  }

  const fetchConfiguration = async () => {
    try {
      console.log('Fetching configuration...');
      const config = await getApiConfiguration();
      console.log('Configuration received:', config);
      const imageURL = config.images.secure_base_url + "original";
      console.log('Setting imageURL:', imageURL);
      dispatch(setImageURL(imageURL));
      return true;
    } catch (error) {
      console.error("Configuration error:", error);
      return false;
    }
  }

  // Handle page transitions
  useEffect(() => {
    if (location.pathname !== prevLocationRef.current) {
      setIsPageTransitioning(true);
      setShowEnhancedLoader(true);
      
      // Hide EnhancedLoader after 2 seconds for page transitions
      setTimeout(() => {
        setShowEnhancedLoader(false);
        setIsPageTransitioning(false);
      }, 2000);
      
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      setDataLoaded(false);
      setShowEnhancedLoader(false);
      setIsPageTransitioning(false);
      
      // Check API token validity first
      const isValid = await validateApiToken();
      if (!isValid) {
        console.error('API token is invalid or expired');
        setApiStatus('invalid');
        setIsLoading(false);
        return;
      }

      // Fetch initial data
      const [trendingSuccess, configSuccess] = await Promise.all([
        fetchTrendingData(),
        fetchConfiguration()
      ]);
      
      if (trendingSuccess && configSuccess) {
        setApiStatus('valid');
        setDataLoaded(true);
        setIsLoading(false);
        
        // Show EnhancedLoader after page is loaded
        setTimeout(() => {
          setShowEnhancedLoader(true);
          // Hide EnhancedLoader after 2 seconds
          setTimeout(() => {
            setShowEnhancedLoader(false);
          }, 2000);
        }, 500);
      } else {
        setApiStatus('invalid');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [dispatch]); // Added dispatch to dependency array

  // Scroll to top on route change
  useEffect(() => {
    scrollToTopSmooth();
  }, [location.pathname]);

  // Show loading state
  if (isLoading || !dataLoaded || isThemeLoading) {
    return <FullScreenLoader text={isThemeLoading ? "Switching Theme..." : "Loading Movieo..."} />;
  }

  return (
    <ErrorBoundary>
      <div className={`min-h-screen transition-all duration-500 ${
        isDarkMode 
          ? 'bg-black text-white' 
          : 'bg-white text-gray-900'
      }`}>
        {showEnhancedLoader && <FullScreenLoader text="Loading..." />}
        <Header />
        <main className="relative">
          <Outlet />
        </main>
        {!isPageTransitioning && !showEnhancedLoader && (
          <>
            <Footer />
            <MobileNavigation />
            <ScrollToTopButton />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;

