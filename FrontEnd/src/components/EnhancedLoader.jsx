import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Film, Play, Star } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const EnhancedLoader = ({ size = 'default', text = 'Loading...' }) => {
  const { isDarkMode } = useTheme();
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      {/* Animated Icons */}
      <div className="relative mb-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className={`${sizeClasses[size]} relative`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 rounded-full opacity-20" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-2 bg-gradient-to-r from-red-500 to-red-700 rounded-full"
          />
          <div className="absolute inset-4 bg-black rounded-full flex items-center justify-center">
            <Film className="w-6 h-6 text-white" />
          </div>
        </motion.div>

        {/* Orbiting Elements */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-blue-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-400 rounded-full"
          />
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${textSizes[size]} font-medium ${
            isDarkMode ? 'text-white/80' : 'text-gray-700'
          }`}
        >
          {text}
        </motion.p>
        
        {/* Loading Dots */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ scale: [0.5, 1, 0.5] }}
              transition={{ 
                duration: 1, 
                repeat: Infinity, 
                delay: index * 0.2 
              }}
              className="w-2 h-2 bg-red-500 rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: 0
          }}
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-red-400 rounded-full"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: 1
          }}
          className="absolute top-3/4 right-1/4 w-2 h-2 bg-blue-400 rounded-full"
        />
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -100, 0],
            opacity: [0, 1, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity,
            delay: 2
          }}
          className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-green-400 rounded-full"
        />
      </div>
    </div>
  );
};

// Full Screen Loader
export const FullScreenLoader = ({ text = 'Loading Movieo...' }) => {
  const { isDarkMode } = useTheme();
  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-500 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-4">
            Movieo
          </h1>
        </motion.div>
        
        <EnhancedLoader size="xl" text={text} />
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className={`mt-8 ${
            isDarkMode ? 'text-white/60' : 'text-gray-600'
          }`}
        >
          <p className="text-sm">Powered by TMDB API</p>
        </motion.div>
      </div>
    </div>
  );
};

// Custom Loading Skeleton
export const CustomSkeletonLoader = ({ count = 6, className = "" }) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-3"
        >
          {/* Movie Card Skeleton */}
          <div className="relative overflow-hidden rounded-lg">
            {/* Poster Skeleton */}
            <div className="aspect-[2/3] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg relative overflow-hidden">
              {/* Shimmer Effect */}
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              
              {/* Play Button Skeleton */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-white/40 rounded-full"></div>
                </div>
              </div>
              
              {/* Rating Badge Skeleton */}
              <div className="absolute top-2 left-2 w-8 h-4 bg-yellow-500/30 rounded-full"></div>
              
              {/* Type Badge Skeleton */}
              <div className="absolute top-2 right-2 w-6 h-4 bg-red-500/30 rounded-full"></div>
            </div>
            
            {/* Title Skeleton */}
            <div className="mt-3 space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.1,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
              </div>
              
              {/* Year and Rating Skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.1 + 0.2,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                </div>
                <div className="w-12 h-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.1 + 0.4,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Horizontal Skeleton Loader
export const HorizontalSkeletonLoader = ({ count = 8, className = "" }) => {
  return (
    <div className={`flex gap-4 overflow-x-auto pb-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex-shrink-0 w-48 space-y-3"
        >
          {/* Movie Card Skeleton */}
          <div className="relative overflow-hidden rounded-lg">
            {/* Poster Skeleton */}
            <div className="aspect-[2/3] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-lg relative overflow-hidden">
              {/* Shimmer Effect */}
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              
              {/* Play Button Skeleton */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 bg-white/40 rounded-full"></div>
                </div>
              </div>
              
              {/* Rating Badge Skeleton */}
              <div className="absolute top-2 left-2 w-6 h-3 bg-yellow-500/30 rounded-full"></div>
              
              {/* Type Badge Skeleton */}
              <div className="absolute top-2 right-2 w-5 h-3 bg-red-500/30 rounded-full"></div>
            </div>
            
            {/* Title Skeleton */}
            <div className="mt-2 space-y-2">
              <div className="h-3 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                <motion.div
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.1,
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
              </div>
              
              {/* Year and Rating Skeleton */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.1 + 0.2,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                </div>
                <div className="w-8 h-2 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.1 + 0.4,
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Card Flip Loader
export const CardFlipLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <motion.div
        animate={{ rotateY: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative w-16 h-24 perspective-1000"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-2xl" />
        <div className="absolute inset-1 bg-black rounded-lg flex items-center justify-center">
          <Play className="w-8 h-8 text-white" />
        </div>
      </motion.div>
    </div>
  );
};

export default EnhancedLoader; 