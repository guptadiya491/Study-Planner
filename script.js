/* =====================================================
   STUDY PLANNER — MAIN SCRIPT
   Structure:
   1. Dark Mode Toggle
   2. Chatbot Toggle
   3. Page Transition
   4. Hero Image Click (Random Quote)
   5. Back To Top Button
   6. Konami Code Easter Egg
===================================================== */
const progressBar = document.getElementById("progress-bar");

window.addEventListener("scroll", () => {
  const scrollTop   = document.documentElement.scrollTop;
  const totalHeight = document.documentElement.scrollHeight
                    - document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / totalHeight) * 100 + "%";
});

/* =====================================================
   1. DARK MODE TOGGLE
   - Reads saved preference from localStorage on load
   - Toggles .dark class on <body> and updates button icon
   - Saves new preference back to localStorage on click

   NOTE: This page uses .dark on <body> (not html.dark) because
   all dark-mode CSS in style.css is written as .dark { }.
   The button LOOKS identical to the planner (circle + FA icon)
   but the toggle target stays <body> to match this page's CSS.
===================================================== */
const darkModeBtn = document.getElementById("darkModeBtn");

/*
  Helper: apply a given theme ("dark" or "light") to the page.
  Syncs the body class AND the button icon in one place.
  Called on page load and on every click.
*/
function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  // Swap Font Awesome icon to match current mode
  darkModeBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// Apply saved theme on page load
// (body class was already set by <head> script to prevent flash,
//  but we still need to sync the button icon here)
applyTheme(localStorage.getItem("theme") || "light");

// Toggle on button click
darkModeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});


/* =====================================================
   2. CHATBOT TOGGLE
   Uses the CSS class .show (defined in style.css) so the
   chatbot popup respects dark-mode and other CSS rules cleanly.
===================================================== */
function toggleChat() {
  const chatPopup = document.getElementById("chatbot-popup");

  // Toggle the .show class — CSS handles display:flex vs display:none
  chatPopup.classList.toggle("show");
}


/* =====================================================
   3. PAGE TRANSITION
   Shows an animated full-screen overlay with staggered
   word reveals before navigating to another page.

   @param {string[]} textArray   — messages to show (one after another)
   @param {string}   redirectPage — URL to navigate to after animation
===================================================== */
function startTransition(textArray, redirectPage) {
  const transition  = document.getElementById("page-transition");
  const loadingText = document.querySelector(".loading-text");

  // Activate the overlay (makes it visible and blocks clicks)
  transition.classList.add("active");

  let i = 0; // index of current message in textArray

  function showNextMessage() {
    if (i < textArray.length) {
      // Split message into words and wrap each in a <span>
      // The CSS wordReveal animation fires on each span
      const words = textArray[i].split(" ");
      loadingText.innerHTML = words
        .map(word => `<span>${word}</span>`)
        .join(" ");

      i++;
      setTimeout(showNextMessage, 1200); // wait 1.2s per message
    }
  }

  showNextMessage();

  // Navigate after all messages have been shown (+ small buffer)
  const totalDuration = textArray.length * 1200 + 800;
  setTimeout(() => {
    window.location.href = redirectPage;
  }, totalDuration);
}


/* =====================================================
   4. HERO IMAGE CLICK — RANDOM MOTIVATIONAL QUOTE
   Clicking the hero image:
     a) Spins the image (CSS .spin class)
     b) Picks a random quote (never the same twice in a row)
     c) Shows the quote bubble for 3 seconds, then hides it
===================================================== */
const motivationalQuotes = [
  "🌟 Believe in yourself and your journey!",
  "📚 Every expert was once a beginner.",
  "🚀 Small steps every day lead to big success.",
  "💡 Knowledge is the light that never dims.",
  "🎯 Stay focused, stay consistent, stay unstoppable.",
  "⏰ The best time to start studying is NOW.",
  "🔥 Push yourself — no one else will do it for you."
];

let lastQuoteIndex = -1; // tracks previous quote to avoid repeats

const heroImg   = document.getElementById("heroImg");
const quoteBox  = document.getElementById("quoteBox");
const quoteText = document.getElementById("quoteText");

// Only attach listener if elements exist (safe for other pages)
if (heroImg && quoteBox && quoteText) {

  heroImg.addEventListener("click", () => {
    // Pick a random index, skipping the previous one
    let idx;
    do {
      idx = Math.floor(Math.random() * motivationalQuotes.length);
    } while (idx === lastQuoteIndex);
    lastQuoteIndex = idx;

    // --- Spin animation ---
    // Remove then re-add .spin to restart the CSS transition
    heroImg.classList.remove("spin");
    void heroImg.offsetWidth; // force browser reflow so animation restarts
    heroImg.classList.add("spin");

    // --- Quote bubble ---
    quoteText.textContent = motivationalQuotes[idx];
    quoteBox.style.display = "block";

    // Restart the CSS fade-in animation on the quote box
    quoteBox.style.animation = "none";
    void quoteBox.offsetWidth; // force reflow
    quoteBox.style.animation = ""; // re-apply from stylesheet

    // Auto-hide after 3 seconds (clear any previous pending timer)
    clearTimeout(heroImg._quoteTimer);
    heroImg._quoteTimer = setTimeout(() => {
      quoteBox.style.display = "none";
    }, 3000);
  });

}


/* =====================================================
   5. BACK TO TOP BUTTON
   Created dynamically (no HTML markup needed).
   Appears after scrolling down 400px, smooth-scrolls to top on click.
===================================================== */

// Inject styles for the button
const backToTopStyle = document.createElement("style");
backToTopStyle.textContent = `
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
    pointer-events: none; /* invisible = non-interactive */
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
document.head.appendChild(backToTopStyle);

// Create the button element
const backToTopBtn = document.createElement("button");
backToTopBtn.id        = "backToTop";
backToTopBtn.innerHTML = "&#8679;"; // upward arrow ↑
backToTopBtn.title     = "Back to top";
document.body.appendChild(backToTopBtn);

// Show/hide based on scroll position
window.addEventListener("scroll", () => {
  backToTopBtn.classList.toggle("visible", window.scrollY > 400);
});

// Smooth scroll to top on click
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* =====================================================
   6. KONAMI CODE EASTER EGG 🎮
   Secret: ↑ ↑ ↓ ↓ ← → ← → B A
   Shows a fun overlay when the full sequence is typed.
===================================================== */
const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a"
];
let konamiProgress = 0; // how many keys in the sequence have been matched

// Inject styles for the easter egg overlay
const easterEggStyle = document.createElement("style");
easterEggStyle.textContent = `
  #easterEgg {
    position: fixed;
    inset: 0;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    text-align: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s;
  }
  #easterEgg.show {
    opacity: 1;
    pointer-events: all;
  }
  #easterEgg h2 { font-size: 36px; margin-bottom: 12px; }
  #easterEgg p  { font-size: 18px; color: #a5b4fc; margin-bottom: 24px; }
  #easterEgg button {
    padding: 10px 28px;
    background: #6366f1;
    color: #fff;
    border: none;
    border-radius: 25px;
    font-size: 15px;
    cursor: pointer;
    transition: background 0.2s;
  }
  #easterEgg button:hover { background: #4f46e5; }
  .egg-emoji {
    font-size: 60px;
    animation: spinEmoji 1s linear infinite;
  }
  @keyframes spinEmoji { to { transform: rotate(360deg); } }
`;
document.head.appendChild(easterEggStyle);

// Create the easter egg overlay element
const easterEggOverlay = document.createElement("div");
easterEggOverlay.id = "easterEgg";
easterEggOverlay.innerHTML = `
  <div class="egg-emoji">🎓</div>
  <h2>You found the Easter Egg! 🎉</h2>
  <p>
    You clearly have too much time — go study! 😄<br>
    But seriously, thanks for exploring our page.
  </p>
  <button onclick="document.getElementById('easterEgg').classList.remove('show')">
    Back to studying 📚
  </button>
`;
document.body.appendChild(easterEggOverlay);

// Listen for keystrokes and match against the Konami sequence
document.addEventListener("keydown", (e) => {
  if (e.key === KONAMI_SEQUENCE[konamiProgress]) {
    konamiProgress++;

    if (konamiProgress === KONAMI_SEQUENCE.length) {
      // Full sequence matched — show the overlay!
      document.getElementById("easterEgg").classList.add("show");
      konamiProgress = 0; // reset for next time
    }
  } else {
    // Wrong key — reset sequence progress
    konamiProgress = 0;
  }
});