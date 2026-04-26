/* =============================================
   SELECT ELEMENTS
   Declared at top so they are available
   everywhere — including inside window.onload
============================================= */
const emailInput    = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn      = document.getElementById("loginBtn");
const forgotBtn     = document.getElementById("forgotBtn");
const togglePassword = document.getElementById("togglePassword");
const passwordField  = document.getElementById("password");


/* =============================================
   ON PAGE LOAD
   - Apply saved dark/light theme
   - Restore saved email & password
   - Skip login if user is already logged in
============================================= */
window.onload = function () {

  // Apply dark mode if previously saved
  const theme = localStorage.getItem("theme");
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  // Auto-fill email if it was saved before
  const savedEmail = localStorage.getItem("userEmail");
  if (savedEmail) {
    emailInput.value = savedEmail;
  }

  // Auto-fill password if it was saved before
  const savedPassword = localStorage.getItem("userPassword");
  if (savedPassword) {
    passwordInput.value = savedPassword;
  }

  // If user is already logged in, go directly to planner page
  if (localStorage.getItem("loggedInUser")) {
    window.location.replace("planner.html");
  }
};


/* =============================================
   HELPER: Show Red Error on Input
   - Adds red border to the input
   - Shows an error message below it
   - Clears both as soon as user starts typing
============================================= */
function showError(input, message) {
  input.classList.add("error");

  // Create error message element if it doesn't exist
  let msg = input.parentNode.querySelector(".input-error-msg");
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "input-error-msg";
    input.parentNode.appendChild(msg);
  }

  msg.textContent = message;
  msg.classList.add("visible");

  // Auto-clear error when user starts typing
  input.addEventListener("input", function clear() {
    input.classList.remove("error");
    msg.classList.remove("visible");
    input.removeEventListener("input", clear);
  });
}


/* =============================================
   HELPER: Show Toast Notification
   - Small popup at bottom-right of screen
   - Disappears automatically after 2 seconds
============================================= */
function showToast(msg, color = "#333") {
  const toast = document.createElement("div");
  toast.textContent = msg;

  // Inline styles so toast works independently of CSS file
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${color};
    color: #fff;
    padding: 10px 20px;
    border-radius: 8px;
    z-index: 9999;
    font-family: Poppins, sans-serif;
  `;

  document.body.appendChild(toast);

  // Remove toast after 2 seconds
  setTimeout(() => toast.remove(), 2000);
}


/* =============================================
   LOGIN BUTTON
   - Validates email & password fields
   - Checks against saved users in localStorage
   - Saves credentials and redirects on success
============================================= */
loginBtn.addEventListener("click", () => {

  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  // Show errors if fields are empty
  if (!email || !password) {
    if (!email)    showError(emailInput,    "Email is required.");
    if (!password) showError(passwordInput, "Password is required.");
    showToast("Enter email & password ❌", "red");
    return;
  }

  // Get all registered users from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if any user matches the entered email & password
  const validUser = users.find(user =>
    user.email === email && user.password === password
  );

  if (validUser) {
    // Save login state and credentials for next visit
    localStorage.setItem("loggedInUser", true);
    localStorage.setItem("userEmail",    email);
    localStorage.setItem("userPassword", password);

    showToast("Login Successful ✅", "green");

    // Redirect to planner page after a short delay
    setTimeout(() => {
      window.location.href = "planner.html";
    }, 1000);

  } else {
    // Wrong credentials — show errors on both fields
    showError(emailInput,    "Email or password is incorrect.");
    showError(passwordInput, "Email or password is incorrect.");
    showToast("Invalid Email or Password ❌", "red");
  }
});


/* =============================================
   FORGOT PASSWORD
   - Asks for registered email
   - Asks security question (set during signup)
   - Lets user set a new password if answer matches
============================================= */
forgotBtn.addEventListener("click", (e) => {
  e.preventDefault();

  const email = prompt("Enter your registered email:");
  if (!email) return;

  let users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find(u => u.email === email);

  if (!user) {
    showToast("Email not found ❌", "red");
    return;
  }

  // Map security question keys to readable question text
  // (must match exactly what was shown during signup)
  const questionMap = {
    pet:    "Name of Your Favourite Person.",
    school: "What's Your Favourite Color?",
    city:   "What is your DOB?"
  };
  const questionText = questionMap[user.securityQuestion] || user.securityQuestion;

  const answer = prompt(questionText);

  // Check if answer matches (case-insensitive)
  if (!answer || answer.toLowerCase() !== user.securityAnswer.toLowerCase()) {
    showToast("Wrong answer ❌", "red");
    return;
  }

  const newPassword = prompt("Enter new password:");
  if (!newPassword) return;

  if (newPassword.length < 8) {
    showToast("Password must be at least 8 characters ❌", "red");
    return;
  }

  const confirmPassword = prompt("Confirm your new password:");
  if (!confirmPassword) return;

  if (newPassword !== confirmPassword) {
    showToast("Passwords do not match ❌", "red");
    return;
  }

  // Update password and save back to localStorage
  user.password = newPassword;
  localStorage.setItem("users", JSON.stringify(users));
  showToast("Password reset successful ✅", "green");
});


/* =============================================
   PASSWORD TOGGLE (Eye Icon)
   - Toggles between hidden (disc) and visible text
   - Uses CSS class swap instead of type change
     because input is type="text" — changing type
     back to "password" would bring back the
     browser's native eye icon (the double-eye bug)
============================================= */
if (togglePassword && passwordField) {
  togglePassword.addEventListener("click", () => {
    // Show/hide password text via CSS class
    passwordField.classList.toggle("password-visible");

    // Switch icon between open eye and slashed eye
    togglePassword.classList.toggle("fa-eye");
    togglePassword.classList.toggle("fa-eye-slash");
  });
}


/* =============================================
   HELP BUTTON
   Shows a simple guide popup
============================================= */
document.getElementById("helpBtn").addEventListener("click", (e) => {
  e.preventDefault();
  alert(`
📘 Help Guide:

1. Enter your registered email & password
2. Click Login
3. If new user → click Sign Up
4. Forgot password → use "Forgot Password"

Need more help? Contact support 📧
  `);
});


/* =============================================
   GOOGLE LOGIN
   Placeholder — not implemented yet
============================================= */
document.getElementById("googleBtn").addEventListener("click", () => {
  showToast("Google login coming soon 🚧", "#4285F4");
});


/* =============================================
   FACEBOOK LOGIN
   Placeholder — not implemented yet
============================================= */
document.getElementById("facebookBtn").addEventListener("click", () => {
  showToast("Facebook login coming soon 🚧", "#1877F2");
});