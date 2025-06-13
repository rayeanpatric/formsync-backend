// Main application script

// Global state
const appState = {
  currentUser: null,
  currentView: "home-view",
  socket: null,
  forms: [],
  users: [],
  activeUsers: new Map(), // Track active users to prevent duplicates
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
};

// API endpoints
const API = {
  USERS: "/api/users",
  FORMS: "/api/forms",
  RESPONSES: "/api/responses",
};

// Initialize Socket.IO
function initializeSocket() {
  appState.socket = io();

  // Socket event handlers
  appState.socket.on("connect", () => {
    console.log("Connected to server with ID:", appState.socket.id);
  });

  appState.socket.on("disconnect", () => {
    console.log("Disconnected from server");
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
    }
  });
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
    const response = await fetch(API.USERS);
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
    const response = await fetch(API.FORMS);
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

    // Only show edit button for admin users
    if (appState.currentUser && appState.currentUser.role === "admin") {
      editButton.addEventListener("click", () => {
        window.formBuilder.loadForm(form.id);
      });
    } else {
      editButton.style.display = "none";
    }

    fillButton.addEventListener("click", () => {
      window.formFiller.loadForm(form.id);
    });

    elements.formsList.appendChild(formElement);
  });
}

// Initialize the application
async function initApp() {
  // Check if user is authenticated
  const savedUser = localStorage.getItem("currentUser");
  if (!savedUser) {
    // Redirect to login page
    window.location.href = "login.html";
    return;
  }

  // Set current user
  appState.currentUser = JSON.parse(savedUser);

  // Initialize Socket.IO connection
  initializeSocket();

  // Update UI with user info
  updateUserInfo();

  // Set up event listeners
  setupEventListeners();

  // Load initial data
  await loadInitialData();

  // Show home view
  showView("home-view");
}

// Update user info display
function updateUserInfo() {
  if (appState.currentUser) {
    // Add user icon based on role
    const icon =
      appState.currentUser.role === "admin"
        ? '<i class="fas fa-user-shield"></i>'
        : '<i class="fas fa-user"></i>';

    elements.userInfo.innerHTML = `${icon} ${appState.currentUser.name} <small>(${appState.currentUser.role})</small>`;
    elements.loginButton.style.display = "none";
    elements.logoutButton.style.display = "flex";

    // Show/hide create form button based on role
    if (elements.createFormButton) {
      elements.createFormButton.style.display =
        appState.currentUser.role === "admin" ? "inline-block" : "none";
    }
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
    showView("home-view");
  });
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

// When DOM is fully loaded, initialize the app
document.addEventListener("DOMContentLoaded", initApp);

// Make app functions available globally
window.app = {
  state: appState,
  showView,
  fetchForms,
  renderFormsList,
};
