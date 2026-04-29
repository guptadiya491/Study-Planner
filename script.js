/* =====================================================
   STUDY PLANNER — MAIN SCRIPT
   Structure:
   1. Dark Mode Toggle
   2. Hamburger Menu
   3. Chatbot Toggle
   4. Page Transition
   5. Hero Image Click (Random Quote)
   6. Back To Top Button
   7. Konami Code Easter Egg
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
===================================================== */
const darkModeBtn = document.getElementById("darkModeBtn");

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  darkModeBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

applyTheme(localStorage.getItem("theme") || "light");

darkModeBtn.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});


/* =====================================================
   2. HAMBURGER MENU
===================================================== */
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");

hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));

document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove("open");
  }
});


/* =====================================================
   3. CHATBOT TOGGLE
===================================================== */
function toggleChat() {
  const chatPopup = document.getElementById("chatbot-popup");
  chatPopup.classList.toggle("show");
}


/* =====================================================
   4. PAGE TRANSITION
===================================================== */
function startTransition(textArray, redirectPage) {
  const transition  = document.getElementById("page-transition");
  const loadingText = document.querySelector(".loading-text");

  transition.classList.add("active");

  let i = 0;

  function showNextMessage() {
    if (i < textArray.length) {
      const words = textArray[i].split(" ");
      loadingText.innerHTML = words
        .map(word => `<span>${word}</span>`)
        .join(" ");

      i++;
      setTimeout(showNextMessage, 1200);
    }
  }

  showNextMessage();

  const totalDuration = textArray.length * 1200 + 800;
  setTimeout(() => {
    window.location.href = redirectPage;
  }, totalDuration);
}


/* =====================================================
   5. HERO IMAGE CLICK — RANDOM MOTIVATIONAL QUOTE
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

let lastQuoteIndex = -1;

const heroImg   = document.getElementById("heroImg");
const quoteBox  = document.getElementById("quoteBox");
const quoteText = document.getElementById("quoteText");

if (heroImg && quoteBox && quoteText) {

  heroImg.addEventListener("click", () => {
    let idx;
    do {
      idx = Math.floor(Math.random() * motivationalQuotes.length);
    } while (idx === lastQuoteIndex);
    lastQuoteIndex = idx;

    heroImg.classList.remove("spin");
    void heroImg.offsetWidth;
    heroImg.classList.add("spin");

    quoteText.textContent = motivationalQuotes[idx];
    quoteBox.style.display = "block";

    quoteBox.style.animation = "none";
    void quoteBox.offsetWidth;
    quoteBox.style.animation = "";

    clearTimeout(heroImg._quoteTimer);
    heroImg._quoteTimer = setTimeout(() => {
      quoteBox.style.display = "none";
    }, 3000);
  });

}


/* =====================================================
   6. BACK TO TOP BUTTON
===================================================== */
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
document.head.appendChild(backToTopStyle);

const backToTopBtn = document.createElement("button");
backToTopBtn.id        = "backToTop";
backToTopBtn.innerHTML = "&#8679;";
backToTopBtn.title     = "Back to top";
document.body.appendChild(backToTopBtn);

window.addEventListener("scroll", () => {
  backToTopBtn.classList.toggle("visible", window.scrollY > 400);
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* =====================================================
   7. KONAMI CODE EASTER EGG 🎮
===================================================== */
const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp",
  "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight",
  "ArrowLeft", "ArrowRight",
  "b", "a"
];
let konamiProgress = 0;

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

document.addEventListener("keydown", (e) => {
  if (e.key === KONAMI_SEQUENCE[konamiProgress]) {
    konamiProgress++;

    if (konamiProgress === KONAMI_SEQUENCE.length) {
      document.getElementById("easterEgg").classList.add("show");
      konamiProgress = 0;
    }
  } else {
    konamiProgress = 0;
  }
});