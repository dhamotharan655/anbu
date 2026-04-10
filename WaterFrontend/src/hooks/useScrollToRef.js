import { useEffect, useRef } from 'react';

/**
 * Custom hook to automatically scroll a ref into view when a trigger becomes truthy.
 * @param {boolean} trigger - The boolean state that triggers the scroll (e.g., showPopup).
 * @param {number} delay - Optional delay in ms to ensure rendering is complete (default 100ms).
 * @returns {React.RefObject} - The ref to attach to the element that should be scrolled into view.
 */
export const useScrollToRef = (trigger, delay = 100) => {
  const ref = useRef(null);

  useEffect(() => {
    if (trigger && ref.current) {
      const scrollTimeout = setTimeout(() => {
        if (ref.current) {
          ref.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest' 
          });
        }
      }, delay);

      return () => clearTimeout(scrollTimeout);
    }
  }, [trigger, delay]);

  return ref;
};
