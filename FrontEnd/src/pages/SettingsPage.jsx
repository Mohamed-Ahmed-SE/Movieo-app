import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Palette, Eye, Bell, Shield, Database, 
  Download, Upload, Trash2, Zap, Image, Bug, 
  Info, HelpCircle, Star, Users, FileText, 
  Moon, Sun, Type, Play, Filter, ChevronRight,
  ArrowLeft, Check, X, AlertTriangle, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useWatchlist } from '../contexts/WatchlistContext';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { 
    isDarkMode, 
    toggleTheme, 
    isThemeLoading,
    fontSize, 
    setFontSize, 
    animationsEnabled, 
    setAnimationsEnabled,
    imageQuality,
    setImageQuality,
    autoPlay,
    setAutoPlay,
    notifications,
    setNotifications,
    contentFilter,
    setContentFilter,
    debugMode,
    setDebugMode
  } = useTheme();

  const { exportWatchlist, importWatchlist, clearWatchlist } = useWatchlist();
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  // Apply font size to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px';
  }, [fontSize]);

  // Apply animation settings
  useEffect(() => {
    const root = document.documentElement;
    if (!animationsEnabled) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }
  }, [animationsEnabled]);

  // Apply debug mode
  useEffect(() => {
    if (debugMode) {
      console.log('Debug mode enabled');
      // Add debug logging
      window.debugMode = true;
    } else {
      window.debugMode = false;
    }
  }, [debugMode]);

  const handleExport = () => {
    try {
      exportWatchlist();
      toast.success('Watchlist exported successfully!');
    } catch (error) {
      toast.error('Failed to export watchlist');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      await importWatchlist(importFile);
      setShowImportModal(false);
      setImportFile(null);
      toast.success('Watchlist imported successfully!');
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import watchlist');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearWatchlist = () => {
    if (window.confirm('Are you sure you want to clear your watchlist? This action cannot be undone.')) {
      try {
        clearWatchlist();
        toast.success('Watchlist cleared successfully!');
      } catch (error) {
        console.error('Error clearing watchlist:', error);
        toast.error('Failed to clear watchlist');
      }
    }
  };

  const handleResetAllSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      try {
        // Reset theme settings
        localStorage.removeItem('theme');
        localStorage.removeItem('fontSize');
        localStorage.removeItem('animationsEnabled');
        localStorage.removeItem('imageQuality');
        localStorage.removeItem('autoPlay');
        localStorage.removeItem('notifications');
        localStorage.removeItem('contentFilter');
        localStorage.removeItem('debugMode');
        
        // Reset profile data
        localStorage.removeItem('profile_photo');
        localStorage.removeItem('profile_name');
        localStorage.removeItem('profile_email');
        
        window.location.reload();
        toast.success('Settings reset successfully!');
      } catch (error) {
        toast.error('Failed to reset settings');
      }
    }
  };

  const handleFontSizeChange = (newSize) => {
    setFontSize(newSize);
    toast.success(`Font size changed to ${newSize}`);
  };

  const handleAnimationToggle = () => {
    setAnimationsEnabled(!animationsEnabled);
    toast.success(`Animations ${!animationsEnabled ? 'enabled' : 'disabled'}`);
  };

  const handleImageQualityChange = (quality) => {
    setImageQuality(quality);
    toast.success(`Image quality set to ${quality}`);
  };

  const handleAutoPlayToggle = () => {
    setAutoPlay(!autoPlay);
    toast.success(`Auto-play ${!autoPlay ? 'enabled' : 'disabled'}`);
  };

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    toast.success(`Notifications ${!notifications ? 'enabled' : 'disabled'}`);
  };

  const handleContentFilterChange = (filter) => {
    setContentFilter(filter);
    toast.success(`Content filter set to ${filter}`);
  };

  const handleDebugModeToggle = () => {
    setDebugMode(!debugMode);
    toast.success(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
  };

  const handleThemeToggle = async () => {
    await toggleTheme();
    toast.success(`Switched to ${!isDarkMode ? 'dark' : 'light'} mode`);
  };

  const handleHelpSupport = () => {
    toast.info('Help & Support coming soon!', {
      duration: 3000,
      icon: '📧',
    });
  };

  const handleCredits = () => {
    toast.info('Credits coming soon!', {
      duration: 3000,
      icon: '👥',
    });
  };

  const handleCacheClear = () => {
    if (window.confirm('Are you sure you want to clear the cache? This will improve performance but may cause temporary loading delays.')) {
      try {
        // Clear browser cache for images
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
        toast.success('Cache cleared successfully!');
      } catch (error) {
        toast.error('Failed to clear cache');
      }
    }
  };

  const settingsSections = [
    {
      title: 'Appearance',
      icon: <Palette className="w-5 h-5" />,
      color: 'from-red-500 to-red-600',
      items: [
        {
          title: 'Theme',
          description: 'Choose between dark and light mode',
          type: 'toggle',
          value: isDarkMode,
          onChange: handleThemeToggle,
          icon: isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />
        },
        {
          title: 'Font Size',
          description: 'Adjust text size for better readability',
          type: 'select',
          value: fontSize,
          onChange: handleFontSizeChange,
          options: [
            { value: 'small', label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large', label: 'Large' }
          ]
        },
        {
          title: 'Animations',
          description: 'Enable or disable smooth animations',
          type: 'toggle',
          value: animationsEnabled,
          onChange: handleAnimationToggle
        }
      ]
    },
    {
      title: 'Content & Privacy',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-blue-500 to-blue-600',
      items: [
        {
          title: 'Content Filter',
          description: 'Filter content based on your preferences',
          type: 'select',
          value: contentFilter,
          onChange: handleContentFilterChange,
          options: [
            { value: 'all', label: 'All Content' },
            { value: 'family', label: 'Family Friendly' },
            { value: 'teen', label: 'Teen Appropriate' },
            { value: 'adult', label: 'Adult Content' }
          ]
        },
        {
          title: 'Auto-play',
          description: 'Automatically play trailers and previews',
          type: 'toggle',
          value: autoPlay,
          onChange: handleAutoPlayToggle
        },
        {
          title: 'Notifications',
          description: 'Receive notifications for updates',
          type: 'toggle',
          value: notifications,
          onChange: handleNotificationsToggle
        }
      ]
    },
    {
      title: 'Data Management',
      icon: <Database className="w-5 h-5" />,
      color: 'from-green-500 to-green-600',
      items: [
        {
          title: 'Export Watchlist',
          description: 'Download your watchlist data',
          type: 'action',
          action: handleExport,
          icon: <Download className="w-5 h-5" />
        },
        {
          title: 'Import Watchlist',
          description: 'Import watchlist from file',
          type: 'action',
          action: () => setShowImportModal(true),
          icon: <Upload className="w-5 h-5" />
        },
        {
          title: 'Clear Watchlist',
          description: 'Remove all items from watchlist',
          type: 'action',
          action: handleClearWatchlist,
          icon: <Trash2 className="w-5 h-5" />,
          danger: true
        },
        {
          title: 'Clear Cache',
          description: 'Clear cached data for better performance',
          type: 'action',
          action: handleCacheClear,
          icon: <Zap className="w-5 h-5" />
        }
      ]
    },
    {
      title: 'Performance',
      icon: <Zap className="w-5 h-5" />,
      color: 'from-purple-500 to-purple-600',
      items: [
        {
          title: 'Image Quality',
          description: 'Set image quality for better performance',
          type: 'select',
          value: imageQuality,
          onChange: handleImageQualityChange,
          options: [
            { value: 'low', label: 'Low (Faster)' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High (Slower)' }
          ]
        },
        {
          title: 'Debug Mode',
          description: 'Enable debug information and logging',
          type: 'toggle',
          value: debugMode,
          onChange: handleDebugModeToggle
        }
      ]
    },
    {
      title: 'About',
      icon: <Info className="w-5 h-5" />,
      color: 'from-orange-500 to-orange-600',
      items: [
        {
          title: 'App Version',
          description: 'Movieo v1.0.0',
          type: 'info'
        },
        {
          title: 'Help & Support',
          description: 'Get help and contact support',
          type: 'action',
          action: handleHelpSupport,
          icon: <HelpCircle className="w-5 h-5" />
        },
        {
          title: 'Credits',
          description: 'View app credits and contributors',
          type: 'action',
          action: handleCredits,
          icon: <Users className="w-5 h-5" />
        }
      ]
    }
  ];

  const renderSettingItem = (item, index) => {
    return (
      <motion.div
        key={item.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {item.icon && <span className="text-red-500">{item.icon}</span>}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {item.type === 'toggle' && (
              <button
                onClick={item.onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  item.value ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    item.value ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            )}
            
            {item.type === 'select' && (
              <select
                value={item.value}
                onChange={(e) => item.onChange(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              >
                {item.options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {item.type === 'action' && (
              <button
                onClick={item.action}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  item.danger 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400'
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">Action</span>
              </button>
            )}
            
            {item.type === 'info' && (
              <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {item.description}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:via-gray-900 dark:to-black pt-20 transition-all duration-500">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-red-600/5 to-red-700/5"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.1),transparent_50%)]"></div>
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(220,38,38,0.1),transparent_50%)]"></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 py-8">
          {/* Back Button */}
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-3 text-gray-700 dark:text-white/80 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 group"
          >
            <div className="p-2 rounded-full bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Back</span>
          </motion.button>

          {/* Settings Header */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-red-500 to-red-600">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Customize your Movieo experience
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleThemeToggle}
                className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300"
              >
                {isDarkMode ? <Sun className="w-6 h-6 text-yellow-500" /> : <Moon className="w-6 h-6 text-blue-500" />}
                <span className="font-medium text-gray-900 dark:text-white">
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300"
              >
                <Download className="w-6 h-6 text-green-500" />
                <span className="font-medium text-gray-900 dark:text-white">Export Data</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleResetAllSettings}
                className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300"
              >
                <Trash2 className="w-6 h-6 text-red-500" />
                <span className="font-medium text-gray-900 dark:text-white">Reset All</span>
              </motion.button>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="max-w-4xl mx-auto space-y-8">
            {settingsSections.map((section, sectionIndex) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: sectionIndex * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${section.color}`}>
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
                
                <div className="space-y-4">
                  {section.items.map((item, index) => renderSettingItem(item, index))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Import Watchlist</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300"
              />
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleImport}
                  disabled={!importFile || isImporting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-xl transition-all duration-300 font-semibold"
                >
                  {isImporting ? 'Importing...' : 'Import'}
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl transition-all duration-300 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage; 