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
      const formResponse = await fetch(`/api/forms/${formId}`);
      const formResult = await formResponse.json();
      if (!formResult.success) {
        window.showNotification(`Error: ${formResult.message}`, "error");
        return;
      }

      currentForm = formResult.data;

      // Fetch existing response data if any
      const responseResponse = await fetch(`/api/responses/${formId}`);
      const responseResult = await responseResponse.json();

      let responseData = {};
      if (responseResult.success && responseResult.data) {
        responseData = responseResult.data.response || {};
      }

      // Render form UI
      renderForm(currentForm, responseData);

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
   * Handle field value change
   * @param {Event} event - Input change event
   */
  function handleFieldChange(event) {
    const input = event.target;
    const fieldId = input.dataset.fieldId;
    const value =
      input.type === "number" ? parseFloat(input.value) : input.value;

    // Emit field change to Socket.IO
    window.app.state.socket.emit("field_change", {
      formId: currentForm.id,
      fieldId: fieldId,
      value: value,
      userName: window.app.state.currentUser.name,
    });
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
      const response = await fetch(`/api/responses/${currentForm.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(responseData),
      });

      const result = await response.json();
      if (result.success) {
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
   * Setup Socket.IO listeners for real-time collaboration
   */
  function setupSocketListeners() {
    // Remove any existing listeners first to prevent duplicates
    window.app.state.socket.off("form_state");
    window.app.state.socket.off("field_update");
    window.app.state.socket.off("field_locked");
    window.app.state.socket.off("field_unlocked");

    // Listen for initial form state
    window.app.state.socket.on("form_state", ({ formId, response }) => {
      if (currentForm && currentForm.id === formId) {
        updateFormFields(response);
      }
    });

    // Listen for field updates from other users
    window.app.state.socket.on("field_update", ({ fieldId, value }) => {
      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input && input.value !== value) {
        // Apply the value change
        input.value = value;

        // Add update animation
        input.classList.add("updated");
        setTimeout(() => {
          input.classList.remove("updated");
        }, 1000);
      }
    });

    // Listen for field locks
    window.app.state.socket.on("field_locked", ({ fieldId, lockedBy }) => {
      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input) {
        input.classList.add("locked");
        input.disabled = true;

        // Add lock indicator
        const fieldGroup = input.closest(".form-group");
        let lockIndicator = fieldGroup.querySelector(".field-lock-indicator");
        if (!lockIndicator) {
          lockIndicator = document.createElement("div");
          lockIndicator.className = "field-lock-indicator";
          fieldGroup.appendChild(lockIndicator);
        }
        lockIndicator.textContent = `${lockedBy.userName} is editing`;
      }
    });

    // Listen for field unlocks
    window.app.state.socket.on("field_unlocked", ({ fieldId }) => {
      const input = document.querySelector(
        `.form-field[data-field-id="${fieldId}"]`
      );
      if (input) {
        input.classList.remove("locked");
        input.disabled = false;

        // Remove lock indicator
        const fieldGroup = input.closest(".form-group");
        const lockIndicator = fieldGroup.querySelector(".field-lock-indicator");
        if (lockIndicator) {
          lockIndicator.remove();
        }
      }
    });
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
