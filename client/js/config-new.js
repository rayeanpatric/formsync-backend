// Configuration for API endpoints and Socket.IO connection
const CONFIG = {
  // Server configuration - Updated for Railway deployment
  SERVER_URL: (() => {
    // Check if we're on localhost
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      console.log("Running in local development mode");
      return "http://localhost:3000"; // Development server
    }

    // For production, use Railway URL
    console.log("Environment check:", {
      hostname: window.location.hostname,
      location: window.location.href,
    });

    // Use the production Railway URL
    const railwayUrl = "https://proactively-backend-production.up.railway.app";
    console.log("Using Railway URL:", railwayUrl);
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
  DEBUG:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1",
};

// Debug logging
console.log("CONFIG loaded:");
console.log("   SERVER_URL:", CONFIG.SERVER_URL);
console.log("   DEBUG mode:", CONFIG.DEBUG);

// Make CONFIG available globally
window.CONFIG = CONFIG;
