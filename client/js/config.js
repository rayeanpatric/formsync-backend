// Configuration for API endpoints and Socket.IO connection
const CONFIG = {
  // Server configuration
  SERVER_URL:
    window.location.hostname === "localhost"
      ? "http://localhost:3000" // Development server
      : "https://your-server-domain.com", // Production server (update this)

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
};

// Make config globally available
window.CONFIG = CONFIG;
