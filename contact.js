const progressBar = document.getElementById("progress-bar");

window.addEventListener("scroll", () => {
  const scrollTop   = document.documentElement.scrollTop;
  const totalHeight = document.documentElement.scrollHeight
                    - document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / totalHeight) * 100 + "%";
});
// =========================
// DARK MODE TOGGLE
// Matches the planner page logic exactly:
//  - Reads/writes "theme" key in localStorage
//  - Toggles "dark" class on <html> (document.documentElement)
//  - Swaps Font Awesome moon <-> sun icon inside the button
// =========================

const darkBtn = document.getElementById("darkModeBtn");

// Helper: apply a given theme ("dark" or "light") to the page
function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Swap icon to match current mode
  darkBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// Apply saved theme immediately (flash prevention was already done in <head>)
applyTheme(localStorage.getItem("theme") || "light");

// Toggle theme on button click
darkBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});

// =========================
// CONTACT FORM SETUP
// Grabs form elements, injects the progress bar and character counter,
// then sets up real-time validation and the submit handler.
// =========================

const nameI     = document.getElementById("name");
const emailI    = document.getElementById("email");
const msgI      = document.getElementById("message");
const form      = document.getElementById("contactForm");
const submitBtn = form.querySelector("button[type='submit']");

// ---- CHARACTER COUNTER (injected below the textarea) ----
// Shows how many characters the user has typed out of the 300 limit.
const counter = document.createElement("div");
counter.id = "charCounter";
counter.style.cssText = "font-size:0.8rem;color:#888;text-align:right;margin-top:4px;transition:color 0.2s";
counter.textContent = "0 / 300";
msgI.setAttribute("maxlength", "300");
msgI.parentNode.appendChild(counter);

// ---- FORM PROGRESS BAR (injected above all fields) ----
// Fills 0% → 33% → 66% → 100% as each field becomes valid.
const progressWrap = document.createElement("div");
progressWrap.innerHTML = `
  <div id="formProgress" style="margin-bottom:24px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
      <span style="font-size:12px;color:#888;" id="progressLabel">Fill in all fields to send</span>
      <span style="font-size:12px;font-weight:600;color:#3b82f6;" id="progressPct">0%</span>
    </div>
    <div style="background:#e5e7eb;border-radius:99px;height:6px;overflow:hidden;">
      <div id="progressFill" style="height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);width:0%;transition:width 0.4s ease;"></div>
    </div>
  </div>
`;
form.insertBefore(progressWrap, form.firstChild);

// ---- GLOBAL CSS INJECTED ONCE ----
// Keyframes and utility classes used by the form enhancements and success overlay.
const style = document.createElement("style");
style.textContent = `
  /* Overlay / card entry animations */
  @keyframes slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes popIn     { 0%{transform:scale(0);opacity:0} 100%{transform:scale(1);opacity:1} }
  @keyframes drawCheck { to{stroke-dashoffset:0} }
  @keyframes countDown { from{width:100%} to{width:0%} }
  @keyframes spinAnim  { to{transform:rotate(360deg)} }

  /* Field border states */
  .cf-input-valid   { border-color:#22c55e !important; }
  .cf-input-invalid { border-color:#ef4444 !important; }

  /* Inline error message below a field */
  .cf-field-err { font-size:12px;color:#ef4444;margin-top:4px;display:none; }

  /* Dark mode overrides for the success overlay */
  html.dark #successOverlay                              { background:#0f172a !important; }
  html.dark #successOverlay h2                           { color:#93c5fd !important; }
  html.dark #successOverlay p                            { color:#cbd5e1 !important; }
  html.dark #successOverlay .meta-box                    { background:#1e293b !important; border-color:#334155 !important; }
  html.dark #successOverlay .meta-row span:last-child    { color:#e2e8f0 !important; }
`;
document.head.appendChild(style);

// =========================
// VALIDATION HELPERS
// =========================

// Mark a field as valid (green border, hide error)
function setValid(input) {
  input.classList.remove("cf-input-invalid");
  input.classList.add("cf-input-valid");
  const err = input.parentNode.querySelector(".cf-field-err");
  if (err) err.style.display = "none";
}

// Mark a field as invalid (red border, show error message)
function setInvalid(input, msg) {
  input.classList.remove("cf-input-valid");
  input.classList.add("cf-input-invalid");
  let err = input.parentNode.querySelector(".cf-field-err");
  if (!err) {
    err = document.createElement("p");
    err.className = "cf-field-err";
    input.parentNode.appendChild(err);
  }
  err.textContent = msg;
  err.style.display = "block";
}

// Remove valid/invalid state (used on form reset)
function clearState(input) {
  input.classList.remove("cf-input-valid", "cf-input-invalid");
  const err = input.parentNode.querySelector(".cf-field-err");
  if (err) err.style.display = "none";
}

// Validation rules for each field
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateName()  { return nameI.value.trim().length >= 2; }
function validateEmail() { return emailRe.test(emailI.value.trim()); }
function validateMsg()   { return msgI.value.trim().length >= 10; }

// =========================
// PROGRESS BAR UPDATER
// Called whenever any field changes.
// Counts how many of the 3 fields are currently valid.
// =========================
function updateProgress() {
  const score = [validateName(), validateEmail(), validateMsg()].filter(Boolean).length;
  const pct   = Math.round((score / 3) * 100);
  document.getElementById("progressFill").style.width  = pct + "%";
  document.getElementById("progressPct").textContent   = pct + "%";
  const labels = ["Fill in all fields to send", "Keep going...", "Almost there!", "Ready to send!"];
  document.getElementById("progressLabel").textContent = labels[score];
}

// =========================
// REAL-TIME FIELD EVENTS
// Validate on blur (when user leaves a field),
// update progress bar on any input change.
// =========================

nameI.addEventListener("blur",  () => { validateName()  ? setValid(nameI)  : setInvalid(nameI,  "Name must be at least 2 characters."); updateProgress(); });
emailI.addEventListener("blur", () => { validateEmail() ? setValid(emailI) : setInvalid(emailI, "Please enter a valid email address."); updateProgress(); });
msgI.addEventListener("blur",   () => { validateMsg()   ? setValid(msgI)   : setInvalid(msgI,   "Message must be at least 10 characters."); updateProgress(); });

nameI.addEventListener("input",  updateProgress);
emailI.addEventListener("input", updateProgress);

// Character counter for the message textarea
msgI.addEventListener("input", () => {
  const len = msgI.value.length;
  counter.textContent   = len + " / 300";
  counter.style.color   = len > 250 ? "#ef4444" : "#888"; // turn red near limit
  updateProgress();
});

// =========================
// FORM SUBMIT HANDLER
// 1. Validates all fields (shows errors if any fail)
// 2. Shows a loading spinner on the button for 2.5 seconds
// 3. Saves submission to localStorage
// 4. Shows the animated success overlay
// 5. Resets the form back to empty state
// =========================
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const vN = validateName(), vE = validateEmail(), vM = validateMsg();

  // Show inline errors for any failing field
  if (!vN) setInvalid(nameI,  "Name must be at least 2 characters.");
  if (!vE) setInvalid(emailI, "Please enter a valid email address.");
  if (!vM) setInvalid(msgI,   "Message must be at least 10 characters.");
  if (!vN || !vE || !vM) return; // stop here if any field is invalid

  // Show loading spinner while "sending"
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spinAnim 0.7s linear infinite;vertical-align:middle;margin-right:8px;"></span> Sending...`;

  setTimeout(() => {
    // Save message data to localStorage for record keeping
    const data = {
      name:    nameI.value.trim(),
      email:   emailI.value.trim(),
      message: msgI.value.trim(),
      time:    new Date().toLocaleString()
    };
    const msgs = JSON.parse(localStorage.getItem("messages") || "[]");
    msgs.push(data);
    localStorage.setItem("messages", JSON.stringify(msgs));

    // Show the full-screen success overlay
    showSuccessOverlay(data);

    // Reset everything behind the overlay
    form.reset();
    [nameI, emailI, msgI].forEach(clearState);
    counter.textContent = "0 / 300";
    document.getElementById("progressFill").style.width  = "0%";
    document.getElementById("progressPct").textContent   = "0%";
    document.getElementById("progressLabel").textContent = "Fill in all fields to send";
    submitBtn.disabled  = false;
    submitBtn.textContent = "Send Message";
  }, 2500);
});

// =========================
// SUCCESS OVERLAY
// Full-screen animated panel that appears after successful form submission.
// Shows: animated checkmark, personalised thank-you message,
//        submission summary (name, email, timestamp),
//        auto-close countdown bar (9 seconds), and a manual close button.
// =========================
function showSuccessOverlay(data) {
  // Remove any existing overlay first
  const existing = document.getElementById("successOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "successOverlay";
  overlay.style.cssText = `
    position:fixed;inset:0;background:#fff;z-index:99999;
    display:flex;align-items:center;justify-content:center;flex-direction:column;
    padding:40px 20px;text-align:center;animation:slideUp 0.4s ease forwards;
  `;

  overlay.innerHTML = `
    <!-- Animated green tick circle -->
    <div style="width:80px;height:80px;border-radius:50%;background:#dcfce7;
      display:flex;align-items:center;justify-content:center;margin-bottom:20px;
      animation:popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275) forwards;">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
        style="stroke-dasharray:50;stroke-dashoffset:50;animation:drawCheck 0.4s 0.4s ease forwards;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>

    <h2 style="font-size:1.8rem;font-weight:700;color:#1e3a8a;margin-bottom:10px;">
      Message Sent! 🎉
    </h2>
    <p style="color:#555;font-size:1rem;max-width:400px;line-height:1.6;margin-bottom:24px;">
      Thanks <strong>${data.name}</strong>! We've received your message and will reply to
      <strong>${data.email}</strong> within 24 hours.
    </p>

    <!-- Submission summary card -->
    <div class="meta-box" style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;
      padding:16px 24px;margin-bottom:28px;text-align:left;min-width:280px;">
      <div class="meta-row" style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.88rem;border-bottom:1px solid #e2e8f0;">
        <span style="color:#888;">Name</span><span style="color:#1e3a8a;font-weight:600;">${data.name}</span>
      </div>
      <div class="meta-row" style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.88rem;border-bottom:1px solid #e2e8f0;">
        <span style="color:#888;">Email</span><span style="color:#1e3a8a;font-weight:600;">${data.email}</span>
      </div>
      <div class="meta-row" style="display:flex;justify-content:space-between;padding:5px 0;font-size:0.88rem;">
        <span style="color:#888;">Sent at</span><span style="color:#1e3a8a;font-weight:600;">${data.time}</span>
      </div>
    </div>

    <!-- Auto-close countdown progress bar (empties over 9 seconds) -->
    <div style="background:#e5e7eb;border-radius:99px;height:6px;width:260px;overflow:hidden;margin-bottom:8px;">
      <div id="cdBar" style="height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#8b5cf6);
       width:100%;animation:countDown 9s linear forwards;"></div>
    </div>
    <p style="font-size:0.78rem;color:#aaa;margin-bottom:20px;">Closing in 9 seconds...</p>

    <!-- Manual close button -->
    <button onclick="document.getElementById('successOverlay').remove()"
      style="background:#1e3a8a;color:#fff;border:none;padding:10px 28px;border-radius:25px;
      font-size:0.95rem;cursor:pointer;font-family:inherit;transition:background 0.2s;"
      onmouseover="this.style.background='#3b82f6'" onmouseout="this.style.background='#1e3a8a'">
      ✉️ Send another message
    </button>
  `;

  document.body.appendChild(overlay);

  // Auto-dismiss after 9 seconds with a fade-out
  setTimeout(() => {
    if (document.getElementById("successOverlay")) {
      overlay.style.transition = "opacity 0.5s";
      overlay.style.opacity = "0";
      setTimeout(() => overlay.remove(), 500);
    }
  }, 9000);
}

// =========================
// BACK TO TOP BUTTON
// Appears (fades in) when the user scrolls more than 400px down.
// Smooth-scrolls back to the top when clicked.
// =========================
const topBtnStyle = document.createElement("style");
topBtnStyle.textContent = `
  #backToTop {
    position: fixed;
    bottom: 90px;
    right: 22px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #6366f1;
    color: #fff;
    border: none;
    font-size: 20px;
    cursor: pointer;
    z-index: 9998;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.5);
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s, background 0.2s;
    pointer-events: none;
  }
  #backToTop.visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: all;
  }
  #backToTop:hover {
    background: #4f46e5;
    transform: translateY(-3px);
  }
`;
document.head.appendChild(topBtnStyle);

const topBtn = document.createElement("button");
topBtn.id        = "backToTop";
topBtn.innerHTML = "&#8679;"; // upward arrow character
topBtn.title     = "Back to top";
document.body.appendChild(topBtn);

// Show/hide based on scroll position
window.addEventListener("scroll", () => {
  topBtn.classList.toggle("visible", window.scrollY > 400);
});

// Smooth scroll to top
topBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});