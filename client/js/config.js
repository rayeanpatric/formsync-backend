// Configuration for API endpoints and Socket.IO connection
const CONFIG = {
  // Server configuration - Updated for Railway deployment
  SERVER_URL: (() => {
    // Check if we're on localhost
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3000"; // Development server
    }
      // For production, try to get from environment variable or use fallback
    // Note: Replace this URL with your actual Railway URL
    return window.VITE_RAILWAY_URL || "https://web-production-XXXX.up.railway.app";
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
    FORMS: "/api/forms",    RESPONSES: "/api/responses",
  },

  // Debug info
  DEBUG: window.location.hostname === "localhost"
};

// Debug logging
console.log("🔧 CONFIG loaded:");
console.log("Environment:", window.location.hostname === "localhost" ? "Development" : "Production");
console.log("Server URL:", CONFIG.SERVER_URL);
console.log("Full API URLs:");
console.log("- Users:", `${CONFIG.SERVER_URL}${CONFIG.API.USERS}`);
console.log("- Forms:", `${CONFIG.SERVER_URL}${CONFIG.API.FORMS}`);
console.log("- Responses:", `${CONFIG.SERVER_URL}${CONFIG.API.RESPONSES}`);

// Make config globally available
window.CONFIG = CONFIG;
