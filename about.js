/* ============================================================
   about.js — JavaScript for the About Us page of Study Planner

   TABLE OF CONTENTS
   ─────────────────────────────────────────────────────────────
   1.  Scroll Progress Bar
   2.  Dark Mode Toggle
   3.  Typing Effect (animated headline)
   4.  Scroll-triggered Card Animations
   5.  Stats Counter Animation
   6.  Back to Top Button
   7.  Timeline Scroll Reveal
   ============================================================ */


/* ────────────────────────────────────────────────────────────
   1. SCROLL PROGRESS BAR
   ─────────────────────────────────────────────────────────────
   As the user scrolls, a thin bar at the very top of the page
   grows from 0% → 100% width to show reading progress.
   
   How it works:
   - scrollTop  = how many pixels have been scrolled
   - scrollHeight - clientHeight = total scrollable distance
   - We convert that ratio into a percentage and set it as width.
   ──────────────────────────────────────────────────────────── */
const progressBar = document.getElementById("progress-bar");

window.addEventListener("scroll", () => {
  const scrollTop    = document.documentElement.scrollTop;
  const totalHeight  = document.documentElement.scrollHeight
                     - document.documentElement.clientHeight;
  const scrollPercent = (scrollTop / totalHeight) * 100;

  progressBar.style.width = scrollPercent + "%";
});


/* ────────────────────────────────────────────────────────────
   2. DARK MODE TOGGLE
   ─────────────────────────────────────────────────────────────
   We add / remove the "dark" class on <html> (documentElement).
   
   WHY <html> and not <body>?
   The <head> script that runs on page load to prevent a flash
   also targets documentElement. Both must target the same element
   or the class will be in the wrong place on first load.
   
   The button icon is a Font Awesome <i> tag (fa-moon / fa-sun),
   matching the planner page so both pages look identical.
   
   localStorage stores the user's preference so it persists
   across page refreshes and sessions.
   ──────────────────────────────────────────────────────────── */
const darkModeBtn = document.getElementById("darkModeBtn");

/* Helper — sets the icon AND the html.dark class to match the given theme */
function applyTheme(theme) {
  /* Add or remove the "dark" class on <html> depending on theme */
  document.documentElement.classList.toggle("dark", theme === "dark");

  /* Swap the icon: sun icon when dark (to switch back), moon when light */
  darkModeBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'   /* Dark mode is active — show sun */
    : '<i class="fa-solid fa-moon"></i>'; /* Light mode is active — show moon */
}

/* On page load, restore the saved theme (default to "light" if nothing saved) */
applyTheme(localStorage.getItem("theme") || "light");

/* Toggle dark mode when the button is clicked */
darkModeBtn.addEventListener("click", () => {
  /* Read current state to decide which theme to switch TO */
  const isDark = document.documentElement.classList.contains("dark");
  const theme  = isDark ? "light" : "dark"; /* Flip it */

  /* Save the new preference to localStorage */
  localStorage.setItem("theme", theme);

  /* Apply the new theme — this handles both the class and the icon */
  applyTheme(theme);
});


/* ────────────────────────────────────────────────────────────
   3. TYPING EFFECT (looping animated headline)
   ─────────────────────────────────────────────────────────────
   The <h1 id="typing"> element cycles through three phrases,
   typing one character at a time, then deleting, then moving
   to the next phrase — forever.
   
   State variables:
   - phrases     : array of phrases to cycle through
   - phraseIndex : which phrase we're currently on
   - charIndex   : how many characters of the current phrase are shown
   - deleting    : true = we're removing characters, false = adding them
   ──────────────────────────────────────────────────────────── */
const phrases = [
  "Plan. Focus. Achieve.",
  "Study Smarter. 📚",
  "Your Goals, Our Mission. 🎯"
];

let phraseIndex = 0;   /* Start with the first phrase */
let charIndex   = 0;   /* Start with 0 characters shown */
let deleting    = false; /* Start by typing, not deleting */

const typingEl = document.getElementById("typing");

function type() {
  const currentPhrase = phrases[phraseIndex];

  /* Build the visible portion of the phrase */
  const visibleText = deleting
    ? currentPhrase.substring(0, charIndex--)  /* Shrink by 1 */
    : currentPhrase.substring(0, charIndex++); /* Grow by 1 */

  /*
    Update the element content:
    - The text we've typed so far
    - A blinking cursor "|" made with a <span> using the CSS blink animation
  */
  typingEl.innerHTML =
    visibleText +
    '<span style="border-right: 3px solid #fff; margin-left: 2px; animation: blink 0.7s infinite;">&nbsp;</span>';

  /* ── Finished typing the full phrase ── */
  if (!deleting && charIndex > currentPhrase.length) {
    deleting = true;
    setTimeout(type, 1800); /* Pause 1.8s before starting to delete */
    return;
  }

  /* ── Finished deleting the phrase ── */
  if (deleting && charIndex <= 0) {
    /* Fix: use <= 0 (not < 0) to avoid showing substring(0,-1) */
    deleting = false;
    phraseIndex = (phraseIndex + 1) % phrases.length; /* Move to next phrase, loop back at end */
  }

  /* Deleting is faster (40ms) than typing (80ms) for a natural feel */
  setTimeout(type, deleting ? 40 : 80);
}

/* Kick off the typing animation */
type();


/* ────────────────────────────────────────────────────────────
   4. SCROLL-TRIGGERED CARD ANIMATIONS
   ─────────────────────────────────────────────────────────────
   Team cards and info cards start invisible (opacity 0, shifted
   down by 40px). When each card enters the viewport, it fades
   in and slides up to its natural position.
   
   We use IntersectionObserver — it's more efficient than
   listening to scroll events because it only fires when an
   element actually enters / leaves the viewport.
   
   The stagger delay (i * 100ms) is based on the element's
   stable index in the full list — not the observer batch index —
   so cards always animate in the correct left-to-right order.
   ──────────────────────────────────────────────────────────── */

/* Grab all cards and convert to a real Array for indexOf() later */
const animatedEls   = document.querySelectorAll(".team-card, .info-card");
const allAnimatedArr = Array.from(animatedEls);

/* Set each card's starting (hidden) state in JS */
animatedEls.forEach(el => {
  el.style.opacity   = "0";
  el.style.transform = "translateY(40px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
});

/* Create the observer */
const cardObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      /*
        Get the stable index of THIS card in the full list.
        This gives us a consistent stagger delay regardless of
        how many cards the observer delivers at once.
      */
      const i = allAnimatedArr.indexOf(entry.target);

      setTimeout(() => {
        entry.target.style.opacity   = "1";
        entry.target.style.transform = "translateY(0)";
      }, i * 100); /* 100ms delay per card */

      /* Once revealed, stop observing this card (performance) */
      cardObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 }); /* Fire when 15% of the card is visible */

/* Start observing each card */
animatedEls.forEach(el => cardObserver.observe(el));


/* ────────────────────────────────────────────────────────────
   5. STATS COUNTER ANIMATION
   ─────────────────────────────────────────────────────────────
   When the stats section scrolls into view, each number counts
   up from 0 to its target value, then shows a suffix.
   
   The target number and suffix (e.g. "+", "%", or "") live in
   data attributes on each element:
     data-target="500" data-suffix="+"
   
   Using data attributes instead of hardcoding the logic keeps
   this JS flexible — you can change the stats in HTML alone.
   ──────────────────────────────────────────────────────────── */
let statsDone = false; /* Prevents re-running if user scrolls back */
const statsSection = document.getElementById("statsSection");

if (statsSection) {
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !statsDone) {
      statsDone = true; /* Mark as done so we don't restart */

      document.querySelectorAll(".stat-num").forEach(el => {
        const target = +el.dataset.target;   /* Read target number from HTML attribute */
        const suffix = el.dataset.suffix ?? ""; /* Read suffix ("+", "%", or "") */
        let count = 0;

        /* step = how much to add each tick (aim for ~60 ticks total) */
        const step = Math.ceil(target / 60);

        const interval = setInterval(() => {
          count += step;

          if (count >= target) {
            /* We've reached (or passed) the target — show exact number + suffix */
            el.textContent = target + suffix;
            clearInterval(interval); /* Stop the timer */
          } else {
            /* Still counting up — show current count */
            el.textContent = count;
          }
        }, 30); /* Tick every 30ms (~33 fps) */
      });
    }
  }, { threshold: 0.4 }); /* Fire when 40% of the section is visible */

  statsObserver.observe(statsSection);
}


/* ────────────────────────────────────────────────────────────
   6. BACK TO TOP BUTTON
   ─────────────────────────────────────────────────────────────
   A circular button fixed in the bottom-right corner.
   - Hidden (opacity 0) until the user scrolls > 400px
   - CSS class "visible" handles the fade-in/out animation
   - Clicking it smoothly scrolls back to the top
   ──────────────────────────────────────────────────────────── */
const topBtn = document.getElementById("backToTop");

/* Show/hide the button based on scroll position */
window.addEventListener("scroll", () => {
  /* toggle() adds the class if scrolled > 400px, removes it otherwise */
  topBtn.classList.toggle("visible", window.scrollY > 400);
});

/* Smooth scroll to top when clicked */
topBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});


/* ────────────────────────────────────────────────────────────
   7. TIMELINE SCROLL REVEAL
   ─────────────────────────────────────────────────────────────
   The four timeline items start invisible (opacity: 0) and
   shifted left (translateX: -22px) via CSS.
   
   As each item scrolls into view, we add the "revealed" CSS
   class, which transitions it to opacity: 1 and translateX(0).
   
   A staggered delay (i * 160ms) makes them slide in one after
   another instead of all at once.
   ──────────────────────────────────────────────────────────── */
const timelineItems    = document.querySelectorAll(".timeline-item");
const allTimelineArr   = Array.from(timelineItems); /* Stable array for indexOf() */

const timelineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      /*
        Use the element's stable position in the full list, NOT the
        batch index i — the observer may deliver items in any batch
        size, so i could be 0 every time and kill the stagger effect.
      */
      const i = allTimelineArr.indexOf(entry.target);

      /* Delay each item slightly more than the last (stagger effect) */
      setTimeout(() => {
        entry.target.classList.add("revealed");
      }, i * 160);

      /* Stop watching this item once it's been revealed */
      timelineObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 }); /* Fire when 12% of the item is visible */

timelineItems.forEach(el => timelineObserver.observe(el));