/**
 * Utility function to extract a consistent string ID from any data object
 * This handles different MongoDB ID formats that might come from different databases
 * 
 * @param {Object} item - The data object that may contain an ID
 * @param {string} fallback - Optional fallback value if no ID is found
 * @returns {string} - A consistent string ID
 */
export const getId = (item, fallback = '') => {
  if (!item) return fallback;
  
  // Try item.id (most common)
  if (item.id !== undefined && item.id !== null) {
    if (typeof item.id === 'string') return item.id;
    if (item.id.$oid) return item.id.$oid; // MongoDB ObjectId format
    if (typeof item.id.toString === 'function') return item.id.toString();
  }
  
  // Try item._id (alternative MongoDB field)
  if (item._id !== undefined && item._id !== null) {
    if (typeof item._id === 'string') return item._id;
    if (item._id.$oid) return item._id.$oid; // MongoDB ObjectId format
    if (typeof item._id.toString === 'function') return item._id.toString();
  }
  
  // Return fallback or empty string
  return fallback;
};

/**
 * Check if an item/object exists and has valid data
 * This helps handle cases where database might return empty or null data
 * 
 * @param {any} item - The item to check
 * @returns {boolean} - True if item has valid data
 */
export const isValidItem = (item) => {
  if (!item) return false;
  if (typeof item === 'string' && !item.trim()) return false;
  if (Array.isArray(item) && item.length === 0) return false;
  if (typeof item === 'object' && Object.keys(item).length === 0) return false;
  return true;
};

/**
 * Safely get nested property from object
 * 
 * @param {Object} obj - The object to access
 * @param {string} path - Dot-notation path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path doesn't exist
 * @returns {any} - The value at path or defaultValue
 */
export const getNestedValue = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) return defaultValue;
    result = result[key];
  }
  
  return result !== undefined && result !== null ? result : defaultValue;
};
