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
    event.preventDefault();

    // Validate user authentication and role
    if (!window.app.state.currentUser) {
      alert("Please login first");
      window.app.showView("home-view");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      alert("Only admin users can create or edit forms");
      window.app.showView("home-view");
      return;
    }

    const title = formTitleInput.value.trim();
    if (!title) {
      alert("Please enter a form title");
      return;
    }

    // Get field elements
    const fieldElements = formFieldsContainer.querySelectorAll(".field-item");
    if (fieldElements.length === 0) {
      alert("Please add at least one field to the form");
      return;
    }

    // Build fields array
    const fields = [];

    for (const fieldElement of fieldElements) {
      const type = fieldElement.dataset.type;
      const label = fieldElement.querySelector(".field-label").value.trim();
      const required = fieldElement.querySelector(".field-required").checked;

      if (!label) {
        alert("All fields must have a label");
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
          alert("All dropdown options must have a value");
          return;
        }

        fieldData.options = options;
      }

      fields.push(fieldData);
    }

    // Prepare form data
    const formData = {
      title,
      createdById: window.app.state.currentUser.id,
      fields,
    };

    try {
      let response;

      if (currentFormId) {
        // Update existing form
        response = await fetch(`/api/forms/${currentFormId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new form
        response = await fetch("/api/forms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();

      if (result.success) {
        // Refresh forms list and go back to home
        const forms = await window.app.fetchForms();
        window.app.renderFormsList(forms);
        window.app.showView("home-view");
        resetForm();
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Failed to save the form. Please try again.");
    }
  }
  /**
   * Load an existing form for editing
   * @param {string} formId - The form ID to load
   */
  async function loadForm(formId) {
    // Check if user is logged in and is admin
    if (!window.app.state.currentUser) {
      alert("Please login first");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      alert("Only admin users can edit forms");
      return;
    }

    try {
      const response = await fetch(`/api/forms/${formId}`);
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
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error loading form:", error);
      alert("Failed to load the form. Please try again.");
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
   */
  function newForm() {
    // Check if user is logged in and is admin
    if (!window.app.state.currentUser) {
      alert("Please login first");
      return;
    }

    if (window.app.state.currentUser.role !== "admin") {
      alert("Only admin users can create forms");
      return;
    }

    resetForm();
    window.app.showView("form-builder-view");
  }

  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Initialize on load
  init();

  // Public API
  return {
    addField,
    loadForm,
    newForm,
  };
})();
