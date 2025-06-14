// Authentication JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Get the current page path
  const currentPath = window.location.pathname;

  // Check if user is already logged in
  const currentUser = localStorage.getItem("currentUser");
  // Only redirect if we're on the login or signup page and user is already logged in
  if (
    currentUser &&
    (currentPath.includes("login.html") || currentPath.includes("signup.html"))
  ) {
    console.log("User already logged in, redirecting to main app");
    // Redirect to main app without using replace to avoid navigation loop
    window.location.href = "index.html";
    return;
  }

  console.log("Auth initialization complete on path:", currentPath);

  // Login form handler
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Signup form handler
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup);
  }
});

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get("email");
  const password = formData.get("password");

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setLoadingState(submitBtn, true);
  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (result.success) {
      // Store user data (handle both response formats: result.data or result.user)
      const userData = result.data || result.user;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      showMessage("Login successful! Redirecting...", "success"); // Redirect to main app after a short delay
      // Using href instead of replace to avoid potential redirect loops
      setTimeout(() => {
        console.log("Login successful, redirecting to index.html");
        window.location.href = "index.html";
      }, 1000);
    } else {
      showMessage(result.message || "Login failed", "error");
    }
  } catch (error) {
    console.error("Login error:", error);
    showMessage("Login failed. Please try again.", "error");
  } finally {
    setLoadingState(submitBtn, false);
  }
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const adminRequest = formData.get("adminRequest") === "on";

  // Validate passwords match
  if (password !== confirmPassword) {
    showMessage("Passwords do not match", "error");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  setLoadingState(submitBtn, true);

  try {
    const response = await fetch(`${CONFIG.SERVER_URL}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
        role: adminRequest ? "admin" : "user",
      }),
    });

    const result = await response.json();

    if (result.success) {
      showMessage("Account created successfully! Please login.", "success");

      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } else {
      showMessage(result.message || "Registration failed", "error");
    }
  } catch (error) {
    console.error("Signup error:", error);
    showMessage("Registration failed. Please try again.", "error");
  } finally {
    setLoadingState(submitBtn, false);
  }
}

/**
 * Quick login function for demo accounts
 */
function quickLogin(email, password) {
  document.getElementById("email").value = email;
  document.getElementById("password").value = password;

  // Highlight the fields briefly
  const emailField = document.getElementById("email");
  const passwordField = document.getElementById("password");

  emailField.style.background = "#e6f3ff";
  passwordField.style.background = "#e6f3ff";

  setTimeout(() => {
    emailField.style.background = "";
    passwordField.style.background = "";
  }, 1000);
}

/**
 * Show message to user
 */
function showMessage(text, type = "info") {
  // Remove existing messages
  const existingMessage = document.querySelector(".message");
  if (existingMessage) {
    existingMessage.remove();
  }

  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;

  const form = document.querySelector(".auth-form");
  form.insertBefore(message, form.firstChild);

  // Auto-remove error messages after 5 seconds
  if (type === "error") {
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 5000);
  }
}

/**
 * Set loading state for submit button
 */
function setLoadingState(button, loading) {
  if (loading) {
    button.disabled = true;
    button.classList.add("loading");
    button.dataset.originalText = button.textContent;
    button.textContent = "";
  } else {
    button.disabled = false;
    button.classList.remove("loading");
    button.textContent = button.dataset.originalText || "Submit";
  }
}
