import { useState, useEffect } from 'react';

/**
 * useIsMobile Hook
 *
 * detects if the current screen size is mobile.
 * Uses Tailwind's lg breakpoint (1024px) as the threshold.
 *
 * @returns {boolean} - True if screen width is <= 1023px, false otherwise
 *
 * @example
 * const isMobile = useIsMobile();
 *
 * // Use in conditional rendering
 * {isMobile ? <MobileLayout /> : <DesktopLayout />}
 *
 * @description
 * - Responsive to window resize events
 */
const MOBILE_MAX_WIDTH = 1023; // Tailwind's lg breakpoint is 1024px

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_MAX_WIDTH : false
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= MOBILE_MAX_WIDTH);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

export default useIsMobile;
