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

  // Track if we've initialized to avoid duplicate listeners
  let isInitialized = false;
  /**
   * Initialize the form builder
   */
  function init() {
    console.log(
      "🚀 Form Builder initializing... (already initialized:",
      isInitialized,
      ")"
    );

    // Wait for DOM to be fully loaded if elements aren't available yet
    if (document.readyState !== "complete") {
      console.log("⏳ DOM not ready, waiting...");
      window.addEventListener("load", init);
      return;
    }

    // Re-query elements in case they weren't available during module load
    const addTextFieldBtn = document.getElementById("add-text-field");
    const addNumberFieldBtn = document.getElementById("add-number-field");
    const addDropdownFieldBtn = document.getElementById("add-dropdown-field");
    const formFieldsContainer = document.getElementById("form-fields");
    const fieldTemplate = document.getElementById("field-template");
    const optionTemplate = document.getElementById("option-template");
    const formBuilderForm = document.getElementById("form-builder-form");

    // Check if elements exist
    console.log("Checking form builder elements:");
    console.log("  - Add Text Field Button:", !!addTextFieldBtn);
    console.log("  - Add Number Field Button:", !!addNumberFieldBtn);
    console.log("  - Add Dropdown Field Button:", !!addDropdownFieldBtn);
    console.log("  - Form Fields Container:", !!formFieldsContainer);
    console.log("  - Field Template:", !!fieldTemplate);
    console.log("  - Option Template:", !!optionTemplate);
    console.log("  - Form Builder Form:", !!formBuilderForm);

    if (!addTextFieldBtn || !addNumberFieldBtn || !addDropdownFieldBtn) {
      console.error(
        "❌ Form builder buttons not found! Check if elements exist in DOM"
      );
      console.log(
        "Available elements with add- prefix:",
        Array.from(document.querySelectorAll('[id*="add-"]')).map((el) => el.id)
      );
      return;
    }

    if (!formFieldsContainer) {
      console.error("❌ Form fields container not found!");
      return;
    }

    if (!fieldTemplate || !optionTemplate) {
      console.error("❌ Templates not found!");
      return;
    }

    // Remove existing listeners if already initialized to avoid duplicates
    if (isInitialized) {
      console.log("🔄 Removing existing listeners...");
      addTextFieldBtn.replaceWith(addTextFieldBtn.cloneNode(true));
      addNumberFieldBtn.replaceWith(addNumberFieldBtn.cloneNode(true));
      addDropdownFieldBtn.replaceWith(addDropdownFieldBtn.cloneNode(true));
      // Re-query after replacement
      const newAddTextFieldBtn = document.getElementById("add-text-field");
      const newAddNumberFieldBtn = document.getElementById("add-number-field");
      const newAddDropdownFieldBtn =
        document.getElementById("add-dropdown-field");

      // Add event listeners for field buttons
      console.log("Adding fresh event listeners...");
      newAddTextFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("📝 Add Text Field clicked");
        addField("text");
      });
      newAddNumberFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("� Add Number Field clicked");
        addField("number");
      });
      newAddDropdownFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("📋 Add Dropdown Field clicked");
        addField("dropdown");
      });
    } else {
      // Add event listeners for field buttons
      console.log("Adding event listeners...");
      addTextFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("�📝 Add Text Field clicked");
        addField("text");
      });
      addNumberFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("🔢 Add Number Field clicked");
        addField("number");
      });
      addDropdownFieldBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("📋 Add Dropdown Field clicked");
        addField("dropdown");
      });
    }

    // Form submission
    if (formBuilderForm && !isInitialized) {
      formBuilderForm.addEventListener("submit", handleFormSubmit);
      console.log("✅ Form submission handler added");
    } else if (!formBuilderForm) {
      console.warn("⚠️ Form builder form not found");
    }

    isInitialized = true;
    console.log("✅ Form Builder initialized successfully");
  }
  /**
   * Add a new field to the form builder
   * @param {string} type - Field type (text, number, dropdown)
   */
  function addField(type) {
    console.log(`🔧 Adding field of type: ${type}`);

    try {
      // Query elements fresh each time to avoid stale references
      const fieldTemplate = document.getElementById("field-template");
      const optionTemplate = document.getElementById("option-template");
      const formFieldsContainer = document.getElementById("form-fields");

      // Clone field template
      if (!fieldTemplate) {
        console.error("❌ Field template not found!");
        return;
      }

      const fieldElement = fieldTemplate.content.cloneNode(true);
      const fieldItem = fieldElement.querySelector(".field-item");

      if (!fieldItem) {
        console.error("❌ Field item not found in template!");
        return;
      }

      // Set field attributes
      fieldItem.dataset.type = type;
      fieldItem.dataset.index = fieldCounter++;

      // Set field type display
      const fieldTypeElement = fieldItem.querySelector(".field-type");
      if (fieldTypeElement) {
        fieldTypeElement.textContent = capitalizeFirstLetter(type);
      } else {
        console.warn("⚠️ Field type element not found in template");
      }

      // Add remove field event listener
      const removeButton = fieldItem.querySelector(".remove-field");
      if (removeButton) {
        removeButton.addEventListener("click", function () {
          console.log("🗑️ Removing field");
          fieldItem.remove();
        });
      } else {
        console.warn("⚠️ Remove field button not found in template");
      }

      // Show options container for dropdown fields
      if (type === "dropdown") {
        console.log("📋 Setting up dropdown field...");
        const optionsContainer = fieldItem.querySelector(".options-container");
        if (optionsContainer) {
          optionsContainer.style.display = "block";

          // Add option button
          const addOptionButton = fieldItem.querySelector(".add-option");
          if (addOptionButton) {
            addOptionButton.addEventListener("click", function () {
              console.log("➕ Adding dropdown option");
              addOption(fieldItem.querySelector(".options-list"));
            });
          }

          // Add initial option
          addOption(fieldItem.querySelector(".options-list"));
        } else {
          console.warn("⚠️ Options container not found for dropdown");
        }
      }

      // Add field to container
      if (formFieldsContainer) {
        formFieldsContainer.appendChild(fieldItem);
        console.log(`✅ Field of type ${type} added successfully`);
      } else {
        console.error("❌ Form fields container not found!");
      }
    } catch (error) {
      console.error("❌ Error adding field:", error);
    }
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
  /**   * Start creating a new form
   */
  function newForm() {
    console.log("🆕 Starting new form creation...");

    // Check if user is logged in and is admin
    if (!window.app.state.currentUser) {
      showNotification("Please login first", "error");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      showNotification("Only admin users can create forms", "error");
      return;
    }

    console.log("✅ Admin user verified, resetting form...");
    resetForm();

    console.log("🔄 Switching to form builder view...");
    window.app.showView("form-builder-view");

    // Wait a moment for view to be shown, then re-check elements and re-initialize if needed
    setTimeout(() => {
      console.log("🔍 Post-view-switch element check:");
      const view = document.getElementById("form-builder-view");
      console.log("  - Form builder view found:", !!view);
      console.log("  - Form builder view display:", view?.style.display);

      // Re-check buttons after view switch
      const textBtn = document.getElementById("add-text-field");
      const numberBtn = document.getElementById("add-number-field");
      const dropdownBtn = document.getElementById("add-dropdown-field");

      console.log("  - Text button found:", !!textBtn);
      console.log("  - Number button found:", !!numberBtn);
      console.log("  - Dropdown button found:", !!dropdownBtn);

      if (textBtn) {
        console.log(
          "  - Text button visible:",
          textBtn.offsetWidth > 0 && textBtn.offsetHeight > 0
        );
      }

      // Force re-initialize if needed or if we haven't done it yet for this view
      console.log("🔄 Re-initializing form builder for this view session...");
      init();
    }, 200);
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

// Add this after the form builder module to test button clicks
window.testFormBuilderButtons = function () {
  console.log("🧪 Testing form builder buttons...");

  // Check if we're in the form builder view
  const formBuilderView = document.getElementById("form-builder-view");
  console.log("Form builder view:", !!formBuilderView);
  console.log(
    "Form builder view visible:",
    formBuilderView?.style.display !== "none"
  );

  // Test button clicks directly
  const addTextBtn = document.getElementById("add-text-field");
  const addNumberBtn = document.getElementById("add-number-field");
  const addDropdownBtn = document.getElementById("add-dropdown-field");

  console.log("Add Text Button:", !!addTextBtn);
  console.log("Add Number Button:", !!addNumberBtn);
  console.log("Add Dropdown Button:", !!addDropdownBtn);

  if (addTextBtn) {
    addTextBtn.click();
    console.log("✅ Clicked add text button");
  }
};

// Global debugging functions for immediate testing
window.debugFormBuilder = {
  // Test if form builder is accessible
  testModule: function () {
    console.log("🧪 Form Builder Module Test:");
    console.log("  - window.formBuilder exists:", !!window.formBuilder);
    console.log("  - init function exists:", !!window.formBuilder?.init);
    console.log(
      "  - addField function exists:",
      !!window.formBuilder?.addField
    );
    console.log("  - newForm function exists:", !!window.formBuilder?.newForm);
  },

  // Test button elements
  testButtons: function () {
    console.log("🧪 Button Elements Test:");
    const textBtn = document.getElementById("add-text-field");
    const numberBtn = document.getElementById("add-number-field");
    const dropdownBtn = document.getElementById("add-dropdown-field");

    console.log("  - Text button:", !!textBtn);
    console.log("  - Number button:", !!numberBtn);
    console.log("  - Dropdown button:", !!dropdownBtn);

    if (textBtn) {
      console.log(
        "  - Text button visible:",
        textBtn.offsetWidth > 0 && textBtn.offsetHeight > 0
      );
      console.log("  - Text button parent:", textBtn.parentElement?.id);
    }

    return { textBtn, numberBtn, dropdownBtn };
  },

  // Force reinitialize
  forceInit: function () {
    console.log("🧪 Force Re-initializing Form Builder...");
    if (window.formBuilder?.init) {
      window.formBuilder.init();
    } else {
      console.error("❌ Form builder init not available");
    }
  },

  // Manually add field
  testAddField: function (type = "text") {
    console.log(`🧪 Manually testing addField(${type})...`);
    if (window.formBuilder?.addField) {
      window.formBuilder.addField(type);
    } else {
      console.error("❌ Form builder addField not available");
    }
  },

  // Test view switching
  testViewSwitch: function () {
    console.log("🧪 Testing view switch to form builder...");
    const view = document.getElementById("form-builder-view");
    console.log("  - Form builder view exists:", !!view);

    if (view) {
      view.style.display = "block";
      console.log("  - Manually shown form builder view");

      // Test buttons after showing view
      setTimeout(() => {
        this.testButtons();
        this.forceInit();
      }, 100);
    }
  },
};
