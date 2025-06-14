// Form Builder module
window.formBuilder = (() => {
  // DOM elements
  const formBuilderForm = document.getElementById("form-builder-form");
  const formFieldsContainer = document.getElementById("form-fields");
  const formTitleInput = document.getElementById("form-title");

  // Buttons for adding fields
  const addTextFieldBtn = document.getElementById("add-text-field");
  const addNumberFieldBtn = document.getElementById("add-number-field");
  const addDropdownFieldBtn = document.getElementById("add-dropdown-field");

  // Templates
  const fieldTemplate = document.getElementById("field-template");
  const optionTemplate = document.getElementById("option-template");

  // Field counter to track field order
  let fieldCounter = 0;

  // Current form being edited (null for new forms)
  let currentFormId = null;

  /**
   * Initialize the form builder
   */
  function init() {
    // Add event listeners for field buttons
    addTextFieldBtn.addEventListener("click", () => addField("text"));
    addNumberFieldBtn.addEventListener("click", () => addField("number"));
    addDropdownFieldBtn.addEventListener("click", () => addField("dropdown"));

    // Form submission
    formBuilderForm.addEventListener("submit", handleFormSubmit);
  }

  /**
   * Add a new field to the form builder
   * @param {string} type - Field type (text, number, dropdown)
   */
  function addField(type) {
    // Clone field template
    const fieldElement = fieldTemplate.content.cloneNode(true);
    const fieldItem = fieldElement.querySelector(".field-item");

    // Set field attributes
    fieldItem.dataset.type = type;
    fieldItem.dataset.index = fieldCounter++;

    // Set field type display
    fieldItem.querySelector(".field-type").textContent =
      capitalizeFirstLetter(type);

    // Add remove field event listener
    fieldItem
      .querySelector(".remove-field")
      .addEventListener("click", function () {
        fieldItem.remove();
      });

    // Show options container for dropdown fields
    if (type === "dropdown") {
      const optionsContainer = fieldItem.querySelector(".options-container");
      optionsContainer.style.display = "block";

      // Add option button
      fieldItem
        .querySelector(".add-option")
        .addEventListener("click", function () {
          addOption(fieldItem.querySelector(".options-list"));
        });

      // Add initial option
      addOption(fieldItem.querySelector(".options-list"));
    }

    // Add field to container
    formFieldsContainer.appendChild(fieldItem);
  }

  /**
   * Add a dropdown option to the options list
   * @param {HTMLElement} optionsListElement - The options list container
   */
  function addOption(optionsListElement) {
    const optionElement = optionTemplate.content.cloneNode(true);
    const optionItem = optionElement.querySelector(".option-item");

    // Add remove option event listener
    optionItem
      .querySelector(".remove-option")
      .addEventListener("click", function () {
        optionItem.remove();
      });

    optionsListElement.appendChild(optionItem);
  }
  /**
   * Handle form builder submission
   * @param {Event} event - Form submit event
   */
  async function handleFormSubmit(event) {
    event.preventDefault(); // Validate user authentication and role from localStorage
    let userJson = localStorage.getItem("currentUser");
    if (!userJson) {
      showNotification("Please login first", "error");
      window.app.showView("home-view");
      return;
    }

    try {
      const user = JSON.parse(userJson);
      if (!user || !user.id) {
        showNotification(
          "User session is invalid. Please log in again.",
          "error"
        );
        localStorage.removeItem("currentUser"); // Clear invalid session
        window.location.href = "login.html";
        return;
      }

      if (user.role !== "admin") {
        showNotification("Only admin users can create or edit forms", "error");
        window.app.showView("home-view");
        return;
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      showNotification("Authentication error. Please log in again.", "error");
      localStorage.removeItem("currentUser"); // Clear invalid session
      window.location.href = "login.html";
      return;
    }
    const title = formTitleInput.value.trim();
    if (!title) {
      showNotification("Please enter a form title", "error");
      return;
    }

    // Get field elements
    const fieldElements = formFieldsContainer.querySelectorAll(".field-item");
    if (fieldElements.length === 0) {
      showNotification("Please add at least one field to the form", "error");
      return;
    }

    // Build fields array
    const fields = [];

    for (const fieldElement of fieldElements) {
      const type = fieldElement.dataset.type;
      const label = fieldElement.querySelector(".field-label").value.trim();
      const required = fieldElement.querySelector(".field-required").checked;

      if (!label) {
        showNotification("All fields must have a label", "error");
        return;
      }

      const fieldData = { label, type, required };

      // Handle dropdown options
      if (type === "dropdown") {
        const optionInputs = fieldElement.querySelectorAll(".option-value");
        const options = Array.from(optionInputs).map((input) =>
          input.value.trim()
        );

        // Check if options are valid
        if (options.length === 0 || options.some((opt) => !opt)) {
          showNotification("All dropdown options must have a value", "error");
          return;
        }

        fieldData.options = options;
      }

      fields.push(fieldData);
    }

    // Prepare form data
    // Get current user from localStorage to ensure we have the most up-to-date data
    const currentUserJson = localStorage.getItem("currentUser");
    if (!currentUserJson) {
      showNotification("Authentication error. Please log in again.", "error");
      window.location.href = "login.html";
      return;
    }

    const currentUser = JSON.parse(currentUserJson);
    if (!currentUser || !currentUser.id) {
      showNotification(
        "User data is incomplete. Please log in again.",
        "error"
      );
      window.location.href = "login.html";
      return;
    }

    const formData = {
      title,
      createdById: currentUser.id,
      fields,
    };
    try {
      let response;

      if (currentFormId) {
        // Update existing form
        response = await fetch(
          `${CONFIG.SERVER_URL}/api/forms/${currentFormId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          }
        );
      } else {
        // Create new form
        response = await fetch(`${CONFIG.SERVER_URL}/api/forms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();
      if (result.success) {
        // Show success notification
        const action = currentFormId ? "updated" : "created";
        showNotification(`Form "${title}" successfully ${action}!`, "success");

        // Refresh forms list and go back to home
        const forms = await window.app.fetchForms();
        window.app.renderFormsList(forms);
        window.app.showView("home-view");
        resetForm();
      } else {
        showNotification(
          `Error: ${result.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving form:", error);

      // More detailed error information
      if (error.message && error.message.includes("createdById")) {
        showNotification(
          "Error: Invalid user ID. Please log out and log back in.",
          "error"
        );
      } else {
        showNotification(
          `Failed to save the form: ${error.message || "Please try again"}`,
          "error"
        );
      }
    }
  }
  /**
   * Load an existing form for editing
   * @param {string} formId - The form ID to load
   */ async function loadForm(formId) {
    // Check if user is logged in and is admin
    if (!window.app.state.currentUser) {
      showNotification("Please login first", "error");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      showNotification("Only admin users can edit forms", "error");
      return;
    }

    try {
      const response = await fetch(`${CONFIG.SERVER_URL}/api/forms/${formId}`);
      const result = await response.json();

      if (result.success) {
        const form = result.data;

        // Set current form ID
        currentFormId = form.id;

        // Set title
        formTitleInput.value = form.title;

        // Clear existing fields
        formFieldsContainer.innerHTML = "";
        fieldCounter = 0;

        // Add fields
        form.fields.forEach((field) => {
          addField(field.type);

          // Get the field element that was just added
          const fieldElement = formFieldsContainer.querySelector(
            `.field-item[data-index="${fieldCounter - 1}"]`
          );

          // Set field values
          fieldElement.querySelector(".field-label").value = field.label;
          fieldElement.querySelector(".field-required").checked =
            field.required;

          // Setup options for dropdown fields
          if (field.type === "dropdown" && field.options) {
            const optionsContainer =
              fieldElement.querySelector(".options-list");
            optionsContainer.innerHTML = "";

            field.options.forEach((option) => {
              addOption(optionsContainer);
              const lastOption = optionsContainer.lastElementChild;
              lastOption.querySelector(".option-value").value = option;
            });
          }
        });

        // Switch to form builder view
        window.app.showView("form-builder-view");
      } else {
        showNotification(`Error: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error loading form:", error);
      showNotification("Failed to load the form. Please try again.", "error");
    }
  }

  /**
   * Reset form builder form
   */
  function resetForm() {
    currentFormId = null;
    formTitleInput.value = "";
    formFieldsContainer.innerHTML = "";
    fieldCounter = 0;
  }
  /**
   * Start creating a new form
   */ function newForm() {
    // Check if user is logged in and is admin
    if (!window.app.state.currentUser) {
      showNotification("Please login first", "error");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      showNotification("Only admin users can create forms", "error");
      return;
    }

    resetForm();
    window.app.showView("form-builder-view");
  }
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  /**
   * Display a notification message
   * @param {string} message - The message to display
   * @param {string} type - The notification type (success, error, info)
   * @param {number} duration - How long to show the notification in ms
   */
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

  // Do not initialize here - script-init.js will call this safely
  // init();

  // Public API
  return {
    addField,
    loadForm,
    newForm,
    init,
  };
})();
