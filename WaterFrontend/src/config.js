// Central configuration for API

// For local development on the same computer: use localhost
// For mobile/other device testing: use your computer's IP address (e.g., http://192.168.1.100:8000/api/)
// The API_BASE_URL should be the IP address of the computer running Django

// Option 1: Use localhost (works only on same machine)
// export const API_BASE_URL = "http://localhost:8000/api/";
export const API_BASE_URL = "https://api-dhamotharan.naziyahcreed.com/api/";

// Option 2: Uncomment below and replace with your computer's IP for mobile testing
// export const API_BASE_URL = "http://YOUR_IP_ADDRESS:8000/api/";

// To find your IP on Windows: open cmd and run `ipconfig`
// Look for IPv4 Address under your active network adapter
