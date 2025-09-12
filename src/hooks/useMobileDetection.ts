import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the user is on a mobile device
 * Returns true if device is considered mobile, false otherwise
 */
export function useMobileDetection(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      // Check user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Check for touch capability
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check screen size (768px is common tablet/mobile breakpoint)
      const isSmallScreen = window.innerWidth <= 768;
      
      // Device is considered mobile if it has a mobile user agent OR if it's both touch-enabled and has a small screen
      return isMobileUserAgent || (isTouchDevice && isSmallScreen);
    };

    const updateMobileStatus = () => {
      setIsMobile(checkIfMobile());
    };

    // Initial check
    updateMobileStatus();

    // Listen for resize events to handle orientation changes
    window.addEventListener('resize', updateMobileStatus);

    return () => {
      window.removeEventListener('resize', updateMobileStatus);
    };
  }, []);

  return isMobile;
}
