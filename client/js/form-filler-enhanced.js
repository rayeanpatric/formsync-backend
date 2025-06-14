// Form Filler module
window.formFiller = (() => {
  // DOM elements
  const formContainer = document.getElementById("form-fields-container");
  const formTitle = document.getElementById("form-view-title");
  const responseForm = document.getElementById("form-response-form");

  // Current form data
  let currentForm = null;

  /**
   * Load a form for filling
   * @param {string} formId - The form ID to load
   */
  async function loadForm(formId) {
    try {
      // Check if user is logged in
      if (!window.app.state.currentUser) {
        window.showNotification("Please login first", "error");
        return;
      }

      // Fetch the form structure
      const formResponse = await fetch(
        `${CONFIG.SERVER_URL}/api/forms/${formId}`
      );
      const formResult = await formResponse.json();
      if (!formResult.success) {
        window.showNotification(`Error: ${formResult.message}`, "error");
        return;
      }

      currentForm = formResult.data;

      // Fetch existing response data if any
      const responseResponse = await fetch(
        `${CONFIG.SERVER_URL}/api/responses/${formId}`
      );
      const responseResult = await responseResponse.json();

      let responseData = {};
      if (responseResult.success && responseResult.data) {
        responseData = responseResult.data.response || {};
      } // Render form UI
      renderForm(currentForm, responseData);

      // Store current form ID in app state for cleanup
      window.app.state.currentFormId = currentForm.id;

      // Join the form room in Socket.IO
      window.app.state.socket.emit("join_form", {
        formId: currentForm.id,
        userId: window.app.state.currentUser.id,
        userName: window.app.state.currentUser.name,
        role: window.app.state.currentUser.role,
      });

      // Listen for field updates from other users
      setupSocketListeners();

      // Switch to form view
      window.app.showView("form-view");
    } catch (error) {
      console.error("Error loading form:", error);
      window.showNotification(
        "Failed to load the form. Please try again.",
        "error"
      );
    }
  }

  /**
   * Render the form UI with fields and values
   * @param {Object} form - The form object with fields
   * @param {Object} responseData - The form response data
   */
  function renderForm(form, responseData) {
    // Set form title
    formTitle.textContent = form.title;

    // Clear the form container
    formContainer.innerHTML = "";

    // Create elements for each field
    form.fields.forEach((field) => {
      const fieldId = field.id;
      const fieldValue = responseData[fieldId] || "";

      const fieldContainer = document.createElement("div");
      fieldContainer.className = "form-group";

      // Create label
      const label = document.createElement("label");
      label.textContent = field.label;
      if (field.required) {
        label.innerHTML += ' <span style="color: red;">*</span>';
      }
      label.setAttribute("for", `field-${fieldId}`);
      fieldContainer.appendChild(label);

      // Create input based on field type
      let input;

      switch (field.type) {
        case "text":
          input = document.createElement("input");
          input.type = "text";
          input.value = fieldValue;
          break;

        case "number":
          input = document.createElement("input");
          input.type = "number";
          input.value = fieldValue;
          break;

        case "dropdown":
          input = document.createElement("select");

          // Add empty option
          const emptyOption = document.createElement("option");
          emptyOption.value = "";
          emptyOption.textContent = "-- Select --";
          input.appendChild(emptyOption);

          // Add options from field
          field.options.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.textContent = option;

            if (option === fieldValue) {
              optionElement.selected = true;
            }

            input.appendChild(optionElement);
          });
          break;

        default:
          input = document.createElement("input");
          input.type = "text";
          input.value = fieldValue;
      }

      // Set common input attributes
      input.id = `field-${fieldId}`;
      input.className = "form-field";
      input.dataset.fieldId = fieldId;

      // Add required attribute if needed
      if (field.required) {
        input.required = true;
      }

      // Add event listeners for collaborative features
      input.addEventListener("input", handleFieldChange);
      input.addEventListener("focus", handleFieldFocus);
      input.addEventListener("blur", handleFieldBlur);

      // Append input to field container
      fieldContainer.appendChild(input);

      // Append field to form
      formContainer.appendChild(fieldContainer);
    });

    // Add form submission handler (remove any existing listeners first)
    responseForm.removeEventListener("submit", handleFormSubmit);
    responseForm.addEventListener("submit", handleFormSubmit);
  }

  /**
   * Handle field focus (field locking)
   * @param {Event} event - Focus event
   */
  function handleFieldFocus(event) {
    const input = event.target;
    const fieldId = input.dataset.fieldId;

    // Emit field lock to Socket.IO
    window.app.state.socket.emit("field_lock", {
      formId: currentForm.id,
      fieldId: fieldId,
      userId: window.app.state.currentUser.id,
      userName: window.app.state.currentUser.name,
    });
  }

  /**
   * Handle field blur (field unlocking)
   * @param {Event} event - Blur event
   */
  function handleFieldBlur(event) {
    const input = event.target;
    const fieldId = input.dataset.fieldId;

    // Emit field unlock to Socket.IO
    window.app.state.socket.emit("field_unlock", {
      formId: currentForm.id,
      fieldId: fieldId,
    });
  }
  /**
   * Handle field value change with debouncing for better performance
   * @param {Event} event - Input change event
   */
  let changeTimeouts = {}; // Store timeouts for each field

  function handleFieldChange(event) {
    const input = event.target;
    const fieldId = input.dataset.fieldId;
    const value =
      input.type === "number" ? parseFloat(input.value) : input.value;

    // Clear existing timeout for this field
    if (changeTimeouts[fieldId]) {
      clearTimeout(changeTimeouts[fieldId]);
    }

    // 🚀 INSTANT visual feedback for the user
    input.style.borderColor = "#4CAF50";
    setTimeout(() => {
      input.style.borderColor = "";
    }, 300);

    // Debounce the socket emission (500ms delay)
    changeTimeouts[fieldId] = setTimeout(() => {
      console.log(`⚡ Emitting field change for ${fieldId}:`, value);

      // Emit field change to Socket.IO
      window.app.state.socket.emit("field_change", {
        formId: currentForm.id,
        fieldId: fieldId,
        value: value,
        userName: window.app.state.currentUser.name,
      });

      delete changeTimeouts[fieldId];
    }, 500);
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async function handleFormSubmit(event) {
    event.preventDefault();

    try {
      // Get all field values
      const inputs = formContainer.querySelectorAll(".form-field");
      const responseData = {};

      inputs.forEach((input) => {
        const fieldId = input.dataset.fieldId;
        let value = input.value;

        // Convert to number if needed
        if (input.type === "number" && value) {
          value = parseFloat(value);
        }

        responseData[fieldId] = value;
      });

      // Save the form response
      const response = await fetch(
        `${CONFIG.SERVER_URL}/api/responses/${currentForm.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(responseData),
        }
      );
      const result = await response.json();
      if (result.success) {
        // IMMEDIATELY remove user from active users before showing success
        if (
          window.app.state.socket &&
          window.app.state.currentUser &&
          window.app.state.currentFormId
        ) {
          console.log(`🚀 FORM SUBMITTED - Removing user from active users`);
          window.app.state.socket.emit("leave_form", {
            formId: window.app.state.currentFormId,
            userId: window.app.state.currentUser.id,
            userName: window.app.state.currentUser.name,
          });
          window.app.state.currentFormId = null;
        }

        window.showNotification("Form submitted successfully!", "success");
        window.app.showView("home-view");
      } else {
        window.showNotification(`Error: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      window.showNotification(
        "Failed to submit the form. Please try again.",
        "error"
      );
    }
  }
  /**
   * Setup Socket.IO listeners for real-time collaboration with performance monitoring
   */
  function setupSocketListeners() {
    // Remove any existing listeners first to prevent duplicates
    window.app.state.socket.off("form_state");
    window.app.state.socket.off("field_update");
    window.app.state.socket.off("field_locked");
    window.app.state.socket.off("field_unlocked");
    window.app.state.socket.off("pong");

    console.log("🔄 Setting up socket listeners for real-time collaboration");

    // Listen for initial form state
    window.app.state.socket.on("form_state", ({ formId, response }) => {
      console.log("📋 Received form state:", {
        formId,
        responseKeys: Object.keys(response),
      });
      if (currentForm && currentForm.id === formId) {
        updateFormFields(response);
      }
    });

    // Listen for field updates from other users (INSTANT)
    window.app.state.socket.on("field_update", ({ fieldId, value }) => {
      console.log("⚡ Received field update:", { fieldId, value });
      const startTime = performance.now();

      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input && input.value !== value) {
        // Apply the value change
        input.value = value;

        // Add update animation with better visual feedback
        input.classList.add("updated");
        input.style.backgroundColor = "#e8f5e8";
        input.style.transition = "background-color 0.3s ease";

        setTimeout(() => {
          input.classList.remove("updated");
          input.style.backgroundColor = "";
        }, 1000);

        const endTime = performance.now();
        console.log(
          `✅ Field update applied in ${(endTime - startTime).toFixed(2)}ms`
        );
      }
    });

    // Listen for field locks (INSTANT)
    window.app.state.socket.on("field_locked", ({ fieldId, lockedBy }) => {
      console.log("🔒 Field locked:", { fieldId, lockedBy: lockedBy.userName });

      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input) {
        input.classList.add("locked");
        input.disabled = true;
        input.style.borderColor = "#ff9800";
        input.style.backgroundColor = "#fff3cd";

        // Add lock indicator with better styling
        const fieldGroup = input.closest(".form-group");
        let lockIndicator = fieldGroup.querySelector(".field-lock-indicator");
        if (!lockIndicator) {
          lockIndicator = document.createElement("div");
          lockIndicator.className = "field-lock-indicator";
          lockIndicator.style.cssText = `
            color: #856404;
            font-size: 12px;
            font-style: italic;
            margin-top: 2px;
            padding: 2px 6px;
            background: #fff3cd;
            border-radius: 3px;
            border: 1px solid #ffeaa7;
          `;
          fieldGroup.appendChild(lockIndicator);
        }
        lockIndicator.textContent = `🔒 ${lockedBy.userName} is editing`;
      }
    });

    // Listen for field unlocks (INSTANT)
    window.app.state.socket.on("field_unlocked", ({ fieldId }) => {
      console.log("🔓 Field unlocked:", fieldId);

      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input) {
        input.classList.remove("locked");
        input.disabled = false;
        input.style.borderColor = "";
        input.style.backgroundColor = "";

        // Remove lock indicator
        const fieldGroup = input.closest(".form-group");
        const lockIndicator = fieldGroup.querySelector(".field-lock-indicator");
        if (lockIndicator) {
          lockIndicator.remove();
        }
      }
    });

    // Health check response for debugging
    window.app.state.socket.on("pong", (stats) => {
      console.log("🏥 Health check response:", stats);
    });

    // Send periodic health checks (every 30 seconds) when form is active
    if (currentForm) {
      const healthCheckInterval = setInterval(() => {
        if (currentForm) {
          window.app.state.socket.emit("ping", { formId: currentForm.id });
        } else {
          clearInterval(healthCheckInterval);
        }
      }, 30000);
    }
  }

  /**
   * Update form fields with response data
   * @param {Object} response - The form response data
   */
  function updateFormFields(response) {
    Object.keys(response).forEach((fieldId) => {
      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input && input.value !== response[fieldId]) {
        input.value = response[fieldId];
      }
    });
  }

  // Public API
  return {
    loadForm,
  };
})();
