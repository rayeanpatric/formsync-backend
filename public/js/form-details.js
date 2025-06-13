// Form details script

// Global state
const detailsState = {
  currentUser: null,
  formId: null,
  formData: null,
  responses: [],
};

// DOM elements
const elements = {
  formTitle: document.getElementById("form-details-title"),
  formCreator: document.getElementById("form-creator"),
  formCreatedDate: document.getElementById("form-created-date"),
  formIdEl: document.getElementById("form-id"),
  fieldsList: document.getElementById("form-fields-list"),
  responsesList: document.getElementById("form-responses-list"),
  backButton: document.getElementById("back-to-home"),
  adminActions: document.getElementById("admin-actions"),
  editFormBtn: document.getElementById("edit-form-btn"),
  deleteFormBtn: document.getElementById("delete-form-btn"),
  openPrismaBtn: document.getElementById("open-prisma-btn"),
  userInfo: document.getElementById("current-user"),
  loginButton: document.getElementById("login-button"),
  logoutButton: document.getElementById("logout-button"),
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

// Initialize the application
async function initApp() {
  // Check if user is authenticated
  const savedUser = localStorage.getItem("currentUser");
  if (!savedUser) {
    console.log("No user found in localStorage, redirecting to login");
    // Redirect to login page using replace() to avoid browser history issues
    window.location.replace("login.html");
    return;
  }

  try {
    // Set current user - catch any JSON parse errors
    detailsState.currentUser = JSON.parse(savedUser);
  } catch (error) {
    console.error("Error parsing user data:", error);
    // Clear invalid data and redirect to login
    localStorage.removeItem("currentUser");
    window.location.replace("login.html");
    return;
  }

  // Update UI with user info
  updateUserInfo();

  // Get form ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  detailsState.formId = urlParams.get("id");

  if (!detailsState.formId) {
    // No form ID specified, show error or redirect to home
    elements.formTitle.textContent = "No Form Selected";
    elements.fieldsList.innerHTML =
      '<div class="error-message">No form ID provided. Please go back and select a form.</div>';
    return;
  }

  // Set up event listeners
  setupEventListeners();

  // Load form data
  await loadFormData();

  // Load form responses
  await loadFormResponses();

  // Show admin actions if user is admin
  if (detailsState.currentUser && detailsState.currentUser.role === "admin") {
    elements.adminActions.style.display = "block";
  }
}

// Update user info display
function updateUserInfo() {
  if (detailsState.currentUser) {
    // Add user icon based on role
    const icon =
      detailsState.currentUser.role === "admin"
        ? '<i class="fas fa-user-shield"></i>'
        : '<i class="fas fa-user"></i>';

    elements.userInfo.innerHTML = `${icon} ${detailsState.currentUser.name} <small>(${detailsState.currentUser.role})</small>`;
    elements.loginButton.style.display = "none";
    elements.logoutButton.style.display = "flex";
  }
}

// Setup event listeners
function setupEventListeners() {
  // Back to home button
  elements.backButton.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Logout button
  elements.logoutButton.addEventListener("click", logoutUser);

  // Admin actions
  if (elements.editFormBtn) {
    elements.editFormBtn.addEventListener("click", () => {
      // Redirect to home page with edit form action
      window.location.href = `index.html?action=edit&formId=${detailsState.formId}`;
    });
  }

  if (elements.deleteFormBtn) {
    elements.deleteFormBtn.addEventListener("click", () => {
      showDeleteConfirmation();
    });
  }

  if (elements.openPrismaBtn) {
    elements.openPrismaBtn.addEventListener("click", () => {
      openFormInPrismaStudio();
    });
  }

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
        deleteForm();
      });
    }
  }

  // Close modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === elements.deleteModal) {
      elements.deleteModal.style.display = "none";
    }
  });
}

// Load form data
async function loadFormData() {
  try {
    const response = await fetch(`${API.FORMS}/${detailsState.formId}`);
    const result = await response.json();

    if (result.success && result.data) {
      detailsState.formData = result.data;

      // Update UI with form data
      elements.formTitle.textContent = detailsState.formData.title;
      elements.formCreator.textContent =
        detailsState.formData.createdBy?.name || "Unknown";
      elements.formIdEl.textContent = detailsState.formData.id;

      // Format date
      const createdDate = new Date(detailsState.formData.createdAt);
      elements.formCreatedDate.textContent = createdDate.toLocaleString();

      // Render fields
      renderFormFields();
    } else {
      console.error("Failed to load form:", result.message);
      elements.formTitle.textContent = "Error Loading Form";
      elements.fieldsList.innerHTML =
        '<div class="error-message">Failed to load form details. Form may have been deleted.</div>';
    }
  } catch (error) {
    console.error("Error loading form:", error);
    elements.formTitle.textContent = "Error";
    elements.fieldsList.innerHTML =
      '<div class="error-message">An error occurred while loading form details.</div>';
  }
}

// Load form responses
async function loadFormResponses() {
  try {
    const response = await fetch(
      `${API.FORMS}/${detailsState.formId}/responses`
    );
    const result = await response.json();

    if (result.success && result.data) {
      detailsState.responses = result.data;

      // Render responses
      renderFormResponses();
    } else {
      console.error("Failed to load responses:", result.message);
      elements.responsesList.innerHTML =
        '<div class="info-message">No responses found for this form.</div>';
    }
  } catch (error) {
    console.error("Error loading responses:", error);
    elements.responsesList.innerHTML =
      '<div class="error-message">An error occurred while loading responses.</div>';
  }
}

// Render form fields
function renderFormFields() {
  if (
    !detailsState.formData ||
    !detailsState.formData.fields ||
    detailsState.formData.fields.length === 0
  ) {
    elements.fieldsList.innerHTML =
      '<div class="info-message">This form has no fields.</div>';
    return;
  }

  elements.fieldsList.innerHTML = "";

  detailsState.formData.fields.forEach((field) => {
    const fieldElement = document.createElement("div");
    fieldElement.className = "field-item-preview";

    // Create type badge
    const typeBadge = document.createElement("span");
    typeBadge.className = "field-type-badge";
    typeBadge.textContent = field.type;

    // Create required badge if field is required
    let requiredBadge = "";
    if (field.required) {
      requiredBadge = document.createElement("span");
      requiredBadge.className = "field-required-badge";
      requiredBadge.textContent = "Required";
    }

    // Create field header
    const fieldHeader = document.createElement("div");
    fieldHeader.className = "field-header-preview";
    fieldHeader.innerHTML = `
            <h4>${field.label}</h4>
            <div class="field-badges">
                ${typeBadge.outerHTML}
                ${field.required ? requiredBadge.outerHTML : ""}
            </div>
        `;

    fieldElement.appendChild(fieldHeader);

    // Add options if dropdown field
    if (
      field.type === "dropdown" &&
      field.options &&
      field.options.length > 0
    ) {
      const optionsContainer = document.createElement("div");
      optionsContainer.className = "field-options";

      const optionsTitle = document.createElement("div");
      optionsTitle.className = "options-title";
      optionsTitle.textContent = "Options:";

      const optionsList = document.createElement("div");
      optionsList.className = "options-list";

      field.options.forEach((option) => {
        const optionBadge = document.createElement("span");
        optionBadge.className = "option-badge";
        optionBadge.textContent = option;
        optionsList.appendChild(optionBadge);
      });

      optionsContainer.appendChild(optionsTitle);
      optionsContainer.appendChild(optionsList);
      fieldElement.appendChild(optionsContainer);
    }

    elements.fieldsList.appendChild(fieldElement);
  });
}

// Render form responses
function renderFormResponses() {
  if (!detailsState.responses || detailsState.responses.length === 0) {
    elements.responsesList.innerHTML =
      '<div class="info-message">No responses submitted for this form yet.</div>';
    return;
  }

  elements.responsesList.innerHTML = "";

  detailsState.responses.forEach((response) => {
    const responseElement = document.createElement("div");
    responseElement.className = "response-item";

    // Format date
    const submittedDate = new Date(response.createdAt);
    const dateString = submittedDate.toLocaleString();

    // Get user name or default to Anonymous
    const userName = response.createdBy?.name || "Anonymous User";

    // Create response header
    const responseHeader = document.createElement("div");
    responseHeader.className = "response-header";
    responseHeader.innerHTML = `
            <div class="response-user">${userName}</div>
            <div class="response-date">${dateString}</div>
        `;

    responseElement.appendChild(responseHeader);

    // Add response fields
    if (response.data) {
      const fieldsContainer = document.createElement("div");
      fieldsContainer.className = "response-fields";

      // Parse JSON data if it's a string
      let responseData = response.data;
      if (typeof responseData === "string") {
        try {
          responseData = JSON.parse(responseData);
        } catch (e) {
          console.error("Error parsing response data:", e);
        }
      } // Create a field entry for each response field
      Object.entries(responseData).forEach(([key, value]) => {
        // The key should already be the field label since we modified the backend
        const fieldElement = document.createElement("div");
        fieldElement.className = "response-field";
        fieldElement.innerHTML = `
                    <div class="response-field-label">${key}:</div>
                    <div class="response-field-value">${value || "--"}</div>
                `;

        fieldsContainer.appendChild(fieldElement);
      });

      responseElement.appendChild(fieldsContainer);
    }

    elements.responsesList.appendChild(responseElement);
  });
}

// Show delete confirmation modal
function showDeleteConfirmation() {
  if (!detailsState.formData || !elements.deleteModal) return;

  // Set the form title in the modal
  if (elements.deleteFormTitle) {
    elements.deleteFormTitle.textContent = detailsState.formData.title;
  }

  // Show the modal
  elements.deleteModal.style.display = "block";
}

// Delete a form
async function deleteForm() {
  try {
    if (!detailsState.formId) return;

    const response = await fetch(`${API.FORMS}/${detailsState.formId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      // Hide the modal
      elements.deleteModal.style.display = "none"; // Show success message and redirect back to home
      showNotification("Form deleted successfully", "success");
      window.location.href = "index.html";
    } else {
      console.error("Failed to delete form:", result.message);
      showNotification(`Failed to delete form: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error deleting form:", error);
    showNotification("An error occurred while deleting the form", "error");
  }
}

// Open a form in Prisma Studio
function openFormInPrismaStudio() {
  if (!detailsState.formId) return;

  // Prisma Studio typically runs on port 5555
  const prismaStudioUrl = `http://localhost:5555`;

  // First, open Prisma Studio in a new tab
  const newTab = window.open(prismaStudioUrl, "_blank");
  // Alert the user with instructions on how to find the form
  setTimeout(() => {
    showNotification(
      `To view the form in Prisma Studio: 1. Click on the "Form" table in the left sidebar 2. Find the form with ID: ${detailsState.formId} 3. Click on it to view details`,
      "info",
      7000
    );
  }, 500);
}

// Logout user
function logoutUser() {
  // Clear user data
  localStorage.removeItem("currentUser");
  detailsState.currentUser = null;

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

// When DOM is fully loaded, initialize the app
document.addEventListener("DOMContentLoaded", initApp);
