/**
 * Scroll utilities for navigation
 */

/**
 * Scroll to top of the page with smooth animation
 * @param {string} behavior - Scroll behavior ('smooth' or 'auto')
 */
export const scrollToTop = (behavior = 'smooth') => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: behavior
  });
};

/**
 * Scroll to top with instant behavior (no animation)
 */
export const scrollToTopInstant = () => {
  scrollToTop('auto');
};

/**
 * Scroll to top with smooth animation
 */
export const scrollToTopSmooth = () => {
  scrollToTop('smooth');
};

/**
 * Check if user is at the top of the page
 * @returns {boolean} - True if at top
 */
export const isAtTop = () => {
  return window.scrollY === 0;
};

/**
 * Get current scroll position
 * @returns {number} - Current scroll Y position
 */
export const getScrollPosition = () => {
  return window.scrollY;
};

/**
 * Scroll to a specific element
 * @param {string} selector - CSS selector for the element
 * @param {string} behavior - Scroll behavior
 */
export const scrollToElement = (selector, behavior = 'smooth') => {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({
      behavior: behavior,
      block: 'start'
    });
  }
};

/**
 * Scroll to a specific Y position
 * @param {number} y - Y position to scroll to
 * @param {string} behavior - Scroll behavior
 */
export const scrollToPosition = (y, behavior = 'smooth') => {
  window.scrollTo({
    top: y,
    left: 0,
    behavior: behavior
  });
}; 