// Main application script

// Global state
const appState = {
  currentUser: null,
  currentView: "home-view",
  socket: null,
  forms: [],
  users: [],
  activeUsers: new Map(), // Track active users to prevent duplicates
  formToDelete: null, // Track the form to be deleted
};

// DOM elements
const elements = {
  views: {
    home: document.getElementById("home-view"),
    formBuilder: document.getElementById("form-builder-view"),
    formView: document.getElementById("form-view"),
  },
  userInfo: document.getElementById("current-user"),
  loginButton: document.getElementById("login-button"),
  logoutButton: document.getElementById("logout-button"),
  formsList: document.getElementById("forms-list"),
  createFormButton: document.getElementById("create-form-button"),
  cancelFormButton: document.getElementById("cancel-form-button"),
  backToHomeButton: document.getElementById("back-to-home"),
  // Modal elements
  deleteModal: document.getElementById("deleteModal"),
  deleteFormTitle: document.getElementById("deleteFormTitle"),
  cancelDeleteBtn: document.getElementById("cancelDelete"),
  confirmDeleteBtn: document.getElementById("confirmDelete"),
  modalCloseBtn: document.querySelector("#deleteModal .close"),
};

// API endpoints
const API = {
  USERS: "/api/users",
  FORMS: "/api/forms",
  RESPONSES: "/api/responses",
};

// Initialize Socket.IO with optimized settings
function initializeSocket() {
  // 🚀 OPTIMIZED SOCKET.IO CLIENT CONFIGURATION
  appState.socket = io(CONFIG.SERVER_URL, {
    // 🔥 FORCE WEBSOCKET-ONLY (matches server config)
    transports: ["websocket"],
    // ⚡ OPTIMIZED TIMEOUTS FOR REAL-TIME RESPONSIVENESS
    timeout: 15000, // Reduced for faster connection detection
    // 🗜️ ENABLE COMPRESSION
    compression: true,
    // 🔄 OPTIMIZED RECONNECTION SETTINGS
    reconnection: true,
    reconnectionDelay: 500, // Faster reconnection
    reconnectionAttempts: 10, // More attempts
    maxReconnectionAttempts: 10,
    // ⚡ PERFORMANCE SETTINGS
    forceNew: false,
    upgrade: true,
    rememberUpgrade: true,
  });

  // 📊 SOCKET EVENT HANDLERS WITH PERFORMANCE MONITORING
  appState.socket.on("connect", () => {
    const transport = appState.socket.io.engine.transport.name;
    console.log(`🚀 Connected to server with ID: ${appState.socket.id}`);
    console.log(
      `🔌 Transport: ${transport} ${transport === "websocket" ? "✅" : "⚠️"}`
    );

    if (transport !== "websocket") {
      console.warn(
        "⚠️ Not using WebSocket! This may affect real-time performance."
      );
    }
  });

  appState.socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected from server:", reason);
    // Show user-friendly message for connection issues
    if (reason === "transport close" || reason === "transport error") {
      console.log("🔄 Attempting to reconnect...");
    }
  });

  appState.socket.on("reconnect", (attemptNumber) => {
    console.log(`🔄 Reconnected to server (attempt ${attemptNumber})`);
  });

  appState.socket.on("reconnect_error", (error) => {
    console.error("❌ Reconnection error:", error.message);
  });

  appState.socket.on("connect_error", (error) => {
    console.error("❌ Connection error:", error.message);
    // Fallback advice for WebSocket issues
    if (error.message.includes("websocket")) {
      console.log(
        "💡 If WebSocket connections fail, check your firewall/proxy settings"
      );
    }
  });
  appState.socket.on("user_joined", ({ users, newUser }) => {
    console.log("User joined:", newUser);
    updateActiveUsersList(users);
  });

  appState.socket.on("user_left", ({ users, leftUser }) => {
    console.log("User left:", leftUser);
    updateActiveUsersList(users);
  });

  // Listen for activity logs
  appState.socket.on("activity_log", (activity) => {
    addActivityLog(activity);
  });
}

// Update active users list in the form view
function updateActiveUsersList(users) {
  const activeUsersList = document.getElementById("active-users-list");

  if (!activeUsersList) return;

  // Clear the list first
  activeUsersList.innerHTML = "";

  // Clear the active users map
  appState.activeUsers.clear();

  // Add each unique user to the list and map
  users.forEach((user) => {
    // Use userId as key to prevent duplicates
    if (!appState.activeUsers.has(user.userId)) {
      appState.activeUsers.set(user.userId, user);

      const userElement = document.createElement("li");
      userElement.textContent = user.userName;
      userElement.setAttribute("data-user-id", user.userId);

      // Add role indicator for admin users
      if (user.role === "admin") {
        userElement.classList.add("admin");
        userElement.textContent += " (Admin)";
      }

      activeUsersList.appendChild(userElement);
    }  });
}

// Leave the current form when navigating away
function leaveCurrentForm() {
  if (appState.socket && appState.currentView === "form-view" && appState.currentUser) {
    // Try to get the current form ID from the form view
    const formIdElement = document.querySelector("[data-form-id]");
    const formId = formIdElement?.getAttribute("data-form-id") || window.formFiller?.currentForm?.id;
    
    if (formId) {
      console.log(`👋 Leaving form ${formId}`);
      appState.socket.emit("leave_form", {
        formId: formId,
        userId: appState.currentUser.id,
        userName: appState.currentUser.name,
      });
    }
  }
}

// Add activity log entry
function addActivityLog(activity) {
  const activityContainer = document.getElementById("activity-log-container");

  if (!activityContainer) return;

  const activityItem = document.createElement("div");
  activityItem.className = "activity-item";

  // Create a more detailed activity entry
  const timeString = new Date(activity.timestamp).toLocaleTimeString();

  activityItem.innerHTML = `
    <div class="activity-content">
      <div class="activity-header">
        <span class="activity-user">${activity.userName}</span>
        <span class="activity-time">${timeString}</span>
      </div>
      <div class="activity-message">${activity.message}</div>
      ${
        activity.fieldName
          ? `<div class="activity-field">Field: <strong>${activity.fieldName}</strong></div>`
          : ""
      }
    </div>
  `;

  // Add animation class
  activityItem.classList.add("activity-new");

  // Add to top of container
  activityContainer.insertBefore(activityItem, activityContainer.firstChild);

  // Remove animation class after animation completes
  setTimeout(() => {
    activityItem.classList.remove("activity-new");
  }, 500);

  // Keep only last 15 activities
  while (activityContainer.children.length > 15) {
    activityContainer.removeChild(activityContainer.lastChild);
  }
}

// Switch between views
function showView(viewId) {
  Object.values(elements.views).forEach((view) => {
    view.style.display = "none";
  });

  const view = document.getElementById(viewId);
  if (view) {
    view.style.display = "block";
    appState.currentView = viewId;
  }
}

// Fetch all users
async function fetchUsers() {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}${API.USERS}`);
    const result = await response.json();

    if (result.success) {
      appState.users = result.data;
      return result.data;
    } else {
      console.error("Failed to fetch users:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Fetch all forms
async function fetchForms() {
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}${API.FORMS}`);
    const result = await response.json();

    if (result.success) {
      appState.forms = result.data;
      return result.data;
    } else {
      console.error("Failed to fetch forms:", result.message);
      return [];
    }
  } catch (error) {
    console.error("Error fetching forms:", error);
    return [];
  }
}

// Logout user
function logoutUser() {
  // Clear user data
  localStorage.removeItem("currentUser");
  appState.currentUser = null;

  // Disconnect socket
  if (appState.socket) {
    appState.socket.disconnect();
  }

  // Redirect to login page
  window.location.href = "login.html";
}

// Render forms list in the home view
function renderFormsList(forms) {
  elements.formsList.innerHTML = "";

  const template = document.getElementById("form-item-template");

  forms.forEach((form) => {
    const formElement = template.content.cloneNode(true);
    formElement.querySelector(".form-title").textContent = form.title;
    formElement.querySelector(".creator-name").textContent =
      form.createdBy.name;
    formElement.querySelector(".field-count").textContent = form._count.fields;

    const editButton = formElement.querySelector(".edit-form");
    const fillButton = formElement.querySelector(".fill-form");
    const deleteButton = formElement.querySelector(".delete-form");
    const viewButton = formElement.querySelector(".view-form"); // Set up view button (available to all users) - opens form details page
    viewButton.addEventListener("click", () => {
      window.location.href = `form-details.html?id=${form.id}`;
    });
    viewButton.title = "View Form Details";
    // Only show edit button for admin users
    if (appState.currentUser && appState.currentUser.role === "admin") {
      editButton.addEventListener("click", () => {
        handleFormEdit(form.id);
      });

      // Show and setup delete button for admin users
      deleteButton.style.display = "flex";
      deleteButton.addEventListener("click", () => {
        showDeleteConfirmation(form);
      });
    } else {
      editButton.style.display = "none";
    }
    fillButton.addEventListener("click", () => {
      handleFormFill(form.id);
    });

    elements.formsList.appendChild(formElement);
  });
}

// Initialize the application
async function initApp() {
  console.log("🚀 Initializing app...");

  // Check if user is authenticated
  const savedUser = localStorage.getItem("currentUser");
  console.log("Saved user from localStorage:", savedUser);

  if (!savedUser) {
    console.log("No user found in localStorage, redirecting to login");
    // Redirect to login page using replace() to avoid browser history issues
    window.location.replace("login.html");
    return;
  }

  try {
    // Set current user - catch any JSON parse errors
    appState.currentUser = JSON.parse(savedUser);
    console.log("✅ Current user set:", appState.currentUser);
  } catch (error) {
    console.error("Error parsing user data:", error);
    // Clear invalid data and redirect to login
    localStorage.removeItem("currentUser");
    window.location.replace("login.html");
    return;
  }

  // Initialize Socket.IO connection
  console.log("🔌 Initializing Socket.IO...");
  initializeSocket();

  // Update UI with user info
  console.log("🎨 Updating user info...");
  updateUserInfo();

  // Set up event listeners
  console.log("🎯 Setting up event listeners...");
  setupEventListeners();

  // Load initial data
  console.log("📊 Loading initial data...");
  await loadInitialData();

  // Show home view
  console.log("🏠 Showing home view...");
  showView("home-view");

  console.log("✅ App initialization complete!");
}

// Update user info display
function updateUserInfo() {
  console.log("🎨 updateUserInfo called, currentUser:", appState.currentUser);
  console.log("🎨 DOM elements:", {
    userInfo: elements.userInfo,
    loginButton: elements.loginButton,
    logoutButton: elements.logoutButton,
  });

  if (appState.currentUser) {
    // Add user icon based on role
    const icon =
      appState.currentUser.role === "admin"
        ? '<i class="fas fa-user-shield"></i>'
        : '<i class="fas fa-user"></i>';

    if (elements.userInfo) {
      elements.userInfo.innerHTML = `${icon} ${appState.currentUser.name} <small>(${appState.currentUser.role})</small>`;
      console.log("✅ User info updated:", elements.userInfo.innerHTML);
    } else {
      console.error("❌ userInfo element not found");
    }

    if (elements.loginButton) {
      elements.loginButton.style.display = "none";
      console.log("✅ Login button hidden");
    } else {
      console.error("❌ loginButton element not found");
    }

    if (elements.logoutButton) {
      elements.logoutButton.style.display = "flex";
      console.log("✅ Logout button shown");
    } else {
      console.error("❌ logoutButton element not found");
    }

    // Show/hide create form button based on role
    if (elements.createFormButton) {
      elements.createFormButton.style.display =
        appState.currentUser.role === "admin" ? "inline-block" : "none";
      console.log(
        "✅ Create form button visibility set for role:",
        appState.currentUser.role
      );
    }
  } else {
    console.log("❌ No current user found");
  }
}

// Setup event listeners
function setupEventListeners() {
  elements.logoutButton.addEventListener("click", logoutUser);

  // Only add create form listener for admin users
  if (appState.currentUser.role === "admin" && elements.createFormButton) {
    elements.createFormButton.addEventListener("click", () => {
      window.formBuilder.newForm();
    });
  }

  elements.cancelFormButton.addEventListener("click", () => {
    showView("home-view");
  });
  elements.backToHomeButton.addEventListener("click", () => {
    // Leave the current form if we're in form view
    leaveCurrentForm();
    showView("home-view");
  });

  // Setup delete modal events
  if (elements.deleteModal) {
    // Close modal when clicking the X button
    if (elements.modalCloseBtn) {
      elements.modalCloseBtn.addEventListener("click", () => {
        elements.deleteModal.style.display = "none";
      });
    }

    // Close modal when clicking Cancel
    if (elements.cancelDeleteBtn) {
      elements.cancelDeleteBtn.addEventListener("click", () => {
        elements.deleteModal.style.display = "none";
      });
    }

    // Handle delete confirmation
    if (elements.confirmDeleteBtn) {
      elements.confirmDeleteBtn.addEventListener("click", () => {
        if (appState.formToDelete) {
          deleteForm(appState.formToDelete.id);
        }
      });
    }
  }
  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === elements.deleteModal) {
      elements.deleteModal.style.display = "none";
    }
  });

  // Handle page navigation away - clean up form connections
  window.addEventListener("beforeunload", () => {
    leaveCurrentForm();
  });

  // Handle visibility change (tab switching, minimizing)
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // User switched away from tab - optional: could implement timeout to leave form
      console.log("👁️ Tab hidden - user switched away");
    } else {
      console.log("👁️ Tab visible - user returned");
    }
  });
}

// Show delete confirmation modal
function showDeleteConfirmation(form) {
  if (!form || !elements.deleteModal) return;

  // Store the form to delete in app state
  appState.formToDelete = form;

  // Set the form title in the modal
  if (elements.deleteFormTitle) {
    elements.deleteFormTitle.textContent = form.title;
  }

  // Show the modal
  elements.deleteModal.style.display = "block";
}

// Delete a form
async function deleteForm(formId) {
  try {
    if (!formId) return;

    const response = await fetch(`${CONFIG.SERVER_URL}${API.FORMS}/${formId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      // Hide the modal
      elements.deleteModal.style.display = "none";

      // Remove the form from the forms list
      appState.forms = appState.forms.filter((form) => form.id !== formId);

      // Re-render the forms list
      renderFormsList(appState.forms); // Show success message
      showNotification("Form deleted successfully", "success");
    } else {
      console.error("Failed to delete form:", result.message);
      showNotification(`Failed to delete form: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    showNotification("An error occurred while deleting the form", "error");
  }
}

// Handle form fill transitions
function handleFormFill(formId) {
  // First, check if formFiller exists
  if (window.formFiller && typeof window.formFiller.loadForm === "function") {
    // Then call the loadForm method
    window.formFiller.loadForm(formId);
  } else {
    console.error("Form filler not initialized properly");
    showNotification(
      "Unable to fill form. Please refresh the page and try again.",
      "error"
    );
  }
}

// View form details - redirects to form details page
function viewFormDetails(formId) {
  // Redirect to form details page
  window.location.href = `form-details.html?id=${formId}`;
}

// Handle form edit transitions
function handleFormEdit(formId) {
  // First, check if formBuilder exists
  if (window.formBuilder && typeof window.formBuilder.loadForm === "function") {
    // Then call the loadForm method
    window.formBuilder.loadForm(formId);
  } else {
    console.error("Form builder not initialized properly");
    showNotification(
      "Unable to edit form. Please refresh the page and try again.",
      "error"
    );
  }
}

// Load initial data
async function loadInitialData() {
  const forms = await fetchForms();
  renderFormsList(forms);
}

// Logout user
function logoutUser() {
  // Clear user data
  localStorage.removeItem("currentUser");
  appState.currentUser = null;

  // Disconnect socket
  if (appState.socket) {
    appState.socket.disconnect();
  }

  // Redirect to login page
  window.location.href = "login.html";
}

// Global notification function
function showNotification(message, type = "info", duration = 3000) {
  // Remove any existing notification
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Add appropriate icon based on notification type
  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }

  notification.innerHTML = `${icon}${message}`;
  document.body.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove notification after duration
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.5s forwards";
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, duration);
}

// Initialize the app - handle both DOMContentLoaded and dynamic script loading
function startApp() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    // DOM is already ready, initialize immediately
    initApp();
  }
}

// Start the app
startApp();

// Make app functions available globally
window.app = {
  state: appState,
  showView,
  fetchForms,
  renderFormsList,
  deleteForm,
  viewFormDetails,
  handleFormEdit,
  handleFormFill,
  showNotification, // Expose showNotification function
};

// Leave the current form when navigating away
function leaveCurrentForm() {
  if (appState.socket && appState.currentView === "form-view" && appState.currentUser) {
    // Try to get the current form ID from the form view
    const formIdElement = document.querySelector("[data-form-id]");
    const formId = formIdElement?.getAttribute("data-form-id") || window.formFiller?.currentForm?.id;
    
    if (formId) {
      console.log(`👋 Leaving form ${formId}`);
      appState.socket.emit("leave_form", {
        formId: formId,
        userId: appState.currentUser.id,
        userName: appState.currentUser.name,
      });
    }
  }
}

// Add activity log to the form view
