// Script initializer helper
// This script ensures all modules are initialized properly

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script initializer running...");

  // Check the current page
  const currentPath = window.location.pathname;
  const isLoginPage =
    currentPath.includes("login.html") || currentPath.includes("signup.html");

  // Only run initialization for main app pages (not login/signup)
  if (!isLoginPage) {
    // Check if modules are properly loaded
    const modules = {
      app: window.app,
      formBuilder: window.formBuilder,
      formFiller: window.formFiller,
    }; // Log status
    Object.entries(modules).forEach(([name, module]) => {
      if (module) {
        console.log(`${name} module loaded successfully`);
      } else {
        console.error(`${name} module failed to load`);
      }
    });

    // Initialize form builder if it exists
    if (window.formBuilder && typeof window.formBuilder.init === "function") {
      console.log("Initializing form builder...");
      try {
        window.formBuilder.init();
      } catch (error) {
        console.error("Error initializing form builder:", error);
      }
    }
  } else {
    console.log("On authentication page - skipping app initialization");
  }

  console.log("Script initialization complete");
});
