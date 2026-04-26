// Apply saved theme on page load
window.onload = function () {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
  }
};
 
// Real-time password validation
document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  if (!passwordInput) return;
 
  // Build the warning box
  const warningBox = document.createElement("div");
  warningBox.id = "passwordWarning";
  warningBox.style.cssText = `
    display: none;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 6px;
    padding: 10px 14px;
    margin-top: 6px;
    font-size: 13px;
    color: #333;
  `;
 
  const rules = [
    { id: "rule-length",  text: "At least 8 characters",       test: v => v.length >= 8 },
    { id: "rule-lower",   text: "At least 1 lowercase letter",  test: v => /[a-z]/.test(v) },
    { id: "rule-upper",   text: "At least 1 uppercase letter",  test: v => /[A-Z]/.test(v) },
    { id: "rule-special", text: "At least 1 special character", test: v => /[^a-zA-Z0-9]/.test(v) },
  ];
 
  warningBox.innerHTML =
    `<strong>⚠️ Password must have:</strong>
     <ul style="margin:6px 0 0 16px; padding:0; list-style:none;">` +
    rules.map(r => `<li id="${r.id}" style="margin:3px 0;">❌ ${r.text}</li>`).join("") +
    `</ul>`;
 
  passwordInput.parentNode.insertBefore(warningBox, passwordInput.nextSibling);
 
  passwordInput.addEventListener("input", function () {
    const val = this.value;
 
    if (val.length === 0) {
      warningBox.style.display = "none";
      return;
    }
 
    warningBox.style.display = "block";
 
    let allPassed = true;
    rules.forEach(r => {
      const passed = r.test(val);
      if (!passed) allPassed = false;
      const el = document.getElementById(r.id);
      el.textContent = (passed ? "✅ " : "❌ ") + r.text;
      el.style.color = passed ? "green" : "#c0392b";
    });
 
    // Update warning box style based on overall pass/fail
    if (allPassed) {
      warningBox.style.background = "#d4edda";
      warningBox.style.borderColor = "#28a745";
      warningBox.querySelector("strong").textContent = "✅ Password looks good!";
    } else {
      warningBox.style.background = "#fff3cd";
      warningBox.style.borderColor = "#ffc107";
      warningBox.querySelector("strong").textContent = "⚠️ Password must have:";
    }
  });
});
 
// Handle signup form submission
function signup() {
  const name             = document.getElementById("name").value.trim();
  const email            = document.getElementById("email").value.trim();
  const password         = document.getElementById("password").value;
  const confirmPassword  = document.getElementById("confirmPassword").value;
  const questionSelect   = document.getElementById("securityQuestion");
  const securityQuestion = questionSelect.value; // Save VALUE so login.js can match it
  const securityAnswer   = document.getElementById("securityAnswer").value.trim().toLowerCase();
 
  // Empty field check
  if (!name || !email || !password || !confirmPassword || !securityQuestion || !securityAnswer) {
    alert("Please fill all fields!");
    return;
  }
 
  // Email format check
  if (!email.includes("@")) {
    alert("Enter valid email!");
    return;
  }
 
  // Password match check
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
 
  // Password strength check
  const strongPassword =
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[^a-zA-Z0-9]/.test(password);
 
  if (!strongPassword) {
    alert("Password must be at least 8 characters with 1 lowercase, 1 uppercase, and 1 special character!");
    return;
  }
 
  // Duplicate email check
  let users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.find(user => user.email === email)) {
    alert("Email already registered!");
    return;
  }
 
  // Save new user
  users.push({ name, email, password, securityQuestion, securityAnswer });
  localStorage.setItem("users", JSON.stringify(users));
 
  alert("Account created successfully!");
 
  // Persist login session across refreshes
  localStorage.setItem("loggedInUser", true);
  localStorage.setItem("userEmail", email);
 
  window.location.href = "planner.html";
}