import { useState, useEffect } from 'react';

/**
 * A React hook that returns the current screen orientation ('portrait' or 'landscape').
 * @returns {'portrait' | 'landscape'} The current orientation.
 */
export function useOrientation() {
  const [orientation, setOrientation] = useState(
    window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait'
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(orientation: landscape)');

    const handleOrientationChange = (e) => {
      setOrientation(e.matches ? 'landscape' : 'portrait');
    };

    // For modern browsers
    mediaQuery.addEventListener('change', handleOrientationChange);

    // Initial check in case of race condition
    handleOrientationChange(mediaQuery);

    // Cleanup listener on component unmount
    return () => {
      mediaQuery.removeEventListener('change', handleOrientationChange);
    };
  }, []);

  return orientation;
}
