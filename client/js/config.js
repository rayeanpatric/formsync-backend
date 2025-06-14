// Configuration for API endpoints and Socket.IO connection
const CONFIG = {
  // Server configuration - Updated for Railway deployment
  SERVER_URL: (() => {
    // Check if we're on localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:3000"; // Development server
    }    // For production, try to get from environment variable or use fallback
    // Debug: Log environment variables
    console.log('🔍 Environment check:', {
      hostname: window.location.hostname,
      VITE_RAILWAY_URL: import.meta?.env?.VITE_RAILWAY_URL,
      process_env: typeof process !== 'undefined' ? process.env?.VITE_RAILWAY_URL : 'not available',
      location: window.location.href
    });
      // Try multiple ways to get the environment variable
    const railwayUrl = 
      import.meta?.env?.VITE_RAILWAY_URL || 
      (typeof process !== 'undefined' ? process.env?.VITE_RAILWAY_URL : null) ||
      "https://proactively-backend-production.up.railway.app"; // Your actual Railway URL
    console.log('🚂 Using Railway URL:', railwayUrl);
    return railwayUrl;
  })(),

  // Socket.IO configuration
  SOCKET_CONFIG: {
    transports: ["websocket"],
    timeout: 15000,
    compression: true,
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionAttempts: 10,
    maxReconnectionAttempts: 10,
    forceNew: false,
    upgrade: true,
    rememberUpgrade: true,
  },

  // API endpoints
  API: {
    USERS: "/api/users",
    FORMS: "/api/forms",
    RESPONSES: "/api/responses",
  },

  // Debug info
  DEBUG: window.location.hostname === "localhost",
};

// Debug logging
console.log("🔧 CONFIG loaded:");
console.log(
  "Environment:",
  window.location.hostname === "localhost" ? "Development" : "Production"
);
console.log("Server URL:", CONFIG.SERVER_URL);
console.log("Full API URLs:");
console.log("- Users:", `${CONFIG.SERVER_URL}${CONFIG.API.USERS}`);
console.log("- Forms:", `${CONFIG.SERVER_URL}${CONFIG.API.FORMS}`);
console.log("- Responses:", `${CONFIG.SERVER_URL}${CONFIG.API.RESPONSES}`);

// Make config globally available
window.CONFIG = CONFIG;
