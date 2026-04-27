/* =====================================================
   STUDY PLANNER — PLANNER PAGE SCRIPT
   Structure:
   1.  Auth Guard
   2.  Dark Mode Toggle
   3.  Hamburger Menu
   4.  localStorage Helpers
   5.  Form Setup (min date, char counter, error clearing)
   6.  Form Submit & Validation
   7.  Toast Notification
   8.  Hero Stats
   9.  Sidebar Summary
   10. Tips Slider
   11. Motivational Quotes
   12. Daily Planner (date nav, week row, schedule grid)
   13. Recent Tasks (filter + render + delete)
   14. Back To Top Button
   15. Initialization (runs everything on page load)
===================================================== */
const progressBar = document.getElementById("progress-bar");

window.addEventListener("scroll", () => {
  const scrollTop   = document.documentElement.scrollTop;
  const totalHeight = document.documentElement.scrollHeight
                    - document.documentElement.clientHeight;
  progressBar.style.width = (scrollTop / totalHeight) * 100 + "%";
}); 
 
/* =====================================================
   1. AUTH GUARD
   Protects this page from unauthenticated access.
   - Primary check is the inline <script> in <head> (redirects
     before the page renders, no flash).
   - This secondary check catches the browser "back button" case
     where the page may be shown from cache after logout.
===================================================== */
// Guard on back-button navigation (page shown from bfcache)
window.addEventListener("pageshow", () => {
  if (!localStorage.getItem("loggedInUser")) {
    window.location.replace("login.html");
  }
});
 
 
/* =====================================================
   2. DARK MODE TOGGLE
   - Uses html.dark class (consistent with CSS variables in planner.css)
   - Reads saved preference and syncs icon on load
   - Saves new preference on toggle
===================================================== */
const darkBtn = document.getElementById("darkModeBtn");
 
// Update both the class and the button icon together
function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  darkBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}
 
// Apply saved theme on load (html.dark may already be set by <head> script,
// but this call ensures the button icon is also in sync)
applyTheme(localStorage.getItem("theme") || "light");
 
darkBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  const newTheme = isDark ? "dark" : "light";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
});
 
 
/* =====================================================
   3. HAMBURGER MENU
   Toggles the mobile nav drawer open/closed.
   Also closes if user clicks anywhere outside the nav.
===================================================== */
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");
 
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});
 
// Close nav when clicking anywhere outside the hamburger or nav list
document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove("open");
  }
});
 
 
/* =====================================================
   4. LOCALSTORAGE HELPERS
   Centralised read/write for the tasks array.
   Stores tasks per user in [{ useremail:"", tasks: [] }].
===================================================== */
function getCurrentUserEmail() {
  return localStorage.getItem("userEmail") || "";
}

function getTaskStore() {
  try {
    const raw = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(raw)) return [];

    // Backwards compatibility: migrate legacy flat task arrays into the new wrapper.
    if (raw.length === 0 || typeof raw[0] === "object" && !raw[0].hasOwnProperty("useremail")) {
      const email = getCurrentUserEmail();
      if (!email) return [];
      const wrapped = [{ useremail: email, tasks: raw }];
      localStorage.setItem("tasks", JSON.stringify(wrapped));
      return wrapped;
    }

    return raw;
  } catch {
    return [];
  }
}

function getTasks() {
  const email = getCurrentUserEmail();
  if (!email) return [];

  const store = getTaskStore();
  const userEntry = store.find(entry => entry.useremail === email);
  return userEntry ? userEntry.tasks : [];
}

function saveTasks(tasks) {
  const email = getCurrentUserEmail();
  if (!email) return;

  const store = getTaskStore();
  const existing = store.find(entry => entry.useremail === email);

  if (existing) {
    existing.tasks = tasks;
  } else {
    store.push({ useremail: email, tasks });
  }

  localStorage.setItem("tasks", JSON.stringify(store));
}
 
 
/* =====================================================
   5. FORM SETUP
   - Sets today as the minimum selectable date
   - Live character counter for the task textarea
   - Clears inline errors as the user types/selects
===================================================== */
const form         = document.getElementById("plannerForm");
const taskTextarea = document.getElementById("task");
const charCountEl  = document.getElementById("charCount");
 
// Prevent picking past dates for new tasks
document.getElementById("date").min = new Date().toISOString().split("T")[0];
 
// Character counter — turns red near the limit, enforces max at 200
taskTextarea.addEventListener("input", () => {
  const len = taskTextarea.value.length;
  charCountEl.textContent  = `${len}/200`;
  charCountEl.style.color  = len > 180 ? "var(--danger)" : "var(--text-muted)";
 
  // Hard-cap: trim any characters beyond 200
  if (len > 200) {
    taskTextarea.value = taskTextarea.value.slice(0, 200);
  }
});
 
// Clear error message and border colour as soon as the user starts fixing a field
["subject", "task", "date", "time", "priority"].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
 
  const clearError = () => {
    const errEl = document.getElementById(id + "Err");
    if (errEl) errEl.textContent = "";
    el.style.borderColor = "";
  };
 
  el.addEventListener("input",  clearError);
  el.addEventListener("change", clearError);
});
 
 
/* =====================================================
   6. FORM SUBMIT & VALIDATION
   - Validates all required fields with custom error messages
   - Builds a task object and stores it in localStorage
   - Updates all UI sections after a successful save
===================================================== */
 
// Checks a single field: shows error and red border if empty, clears if valid
function validateField(id, errId, message) {
  const el  = document.getElementById(id);
  const err = document.getElementById(errId);
  const val = el ? el.value.trim() : "";
 
  if (!val) {
    if (err) err.textContent = message;
    if (el)  el.style.borderColor = "var(--danger)";
    return false;
  }
 
  if (err) err.textContent  = "";
  if (el)  el.style.borderColor = "";
  return true;
}
 
form.addEventListener("submit", (e) => {
  e.preventDefault(); // stop native browser submission
 
  // Validate all required fields — collect results so ALL errors show at once
  const isSubjectValid  = validateField("subject",  "subjectErr",  "Please select a subject.");
  const isTaskValid     = validateField("task",     "taskErr",     "Please enter a task description.");
  const isDateValid     = validateField("date",     "dateErr",     "Please pick a deadline date.");
  const isTimeValid     = validateField("time",     "timeErr",     "Please pick a deadline time.");
  const isPriorityValid = validateField("priority", "priorityErr", "Please select a priority level.");
 
  // Stop if any field failed
  if (!isSubjectValid || !isTaskValid || !isDateValid || !isTimeValid || !isPriorityValid) return;
 
  // Build the new task object
  const newTask = {
    id:        Date.now(),   // unique ID (timestamp)
    subject:   document.getElementById("subject").value.trim(),
    task:      document.getElementById("task").value.trim(),
    date:      document.getElementById("date").value,
    time:      document.getElementById("time").value,
    priority:  document.getElementById("priority").value,
    notes:     document.getElementById("notes").value.trim(),
    createdAt: new Date().toISOString()
  };
 
  // Append and save
  const tasks = getTasks();
  tasks.push(newTask);
  saveTasks(tasks);
 
  // User feedback
  showToast("Task added successfully! 🎉");
 
  // Reset form and char counter
  form.reset();
  charCountEl.textContent = "0/200";
 
  // Refresh all dynamic UI sections
  updateHeroStats();
  updateSidebarSummary();
  renderRecentTasks(currentFilter);
  renderSchedule();
  renderWeekRow(currentViewDate); // update week dots if today has a new task
});
 
 
/* =====================================================
   7. TOAST NOTIFICATION
   Shows a temporary success message at the bottom of the screen.
   @param {string} message — text to display in the toast
===================================================== */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.querySelector("span").textContent = message;
  toast.classList.add("show"); // CSS slides it up
 
  // Auto-hide after 3 seconds
  setTimeout(() => toast.classList.remove("show"), 3000);
}
 
 
/* =====================================================
   8. HERO STATS
   Reads tasks from localStorage and updates the three
   counters in the hero banner (Total / Due Today / Overdue).
===================================================== */
function updateHeroStats() {
  const tasks = getTasks();
  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
 
  document.getElementById("heroTotal").textContent   = tasks.length;
  document.getElementById("heroToday").textContent   = tasks.filter(t => t.date === todayStr).length;
  document.getElementById("heroOverdue").textContent = tasks.filter(t => t.date < todayStr).length;
}
 
 
/* =====================================================
   9. SIDEBAR SUMMARY
   Updates the High / Medium / Low count badges in the sidebar.
===================================================== */
function updateSidebarSummary() {
  const tasks = getTasks();
  document.getElementById("highCount").textContent = tasks.filter(t => t.priority === "high").length;
  document.getElementById("medCount").textContent  = tasks.filter(t => t.priority === "medium").length;
  document.getElementById("lowCount").textContent  = tasks.filter(t => t.priority === "low").length;
}
 
 
/* =====================================================
   10. TIPS SLIDER
   Auto-rotates study tips every 4 seconds.
   Clicking a dot jumps directly to that tip.
   Wrapped in an IIFE so its variables don't pollute global scope.
===================================================== */
(function initTips() {
  const tips          = document.querySelectorAll(".tip-text");
  const dotsContainer = document.getElementById("tipDots");
  let currentTip      = 0;
 
  // Create one dot per tip
  tips.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "tip-dot" + (i === 0 ? " active" : "");
    dot.addEventListener("click", () => goToTip(i));
    dotsContainer.appendChild(dot);
  });
 
  // Switch to a specific tip by index
  function goToTip(index) {
    // Deactivate current
    tips[currentTip].classList.remove("active");
    dotsContainer.children[currentTip].classList.remove("active");
 
    // Activate new
    currentTip = index;
    tips[currentTip].classList.add("active");
    dotsContainer.children[currentTip].classList.add("active");
  }
 
  // Auto-advance every 4 seconds, wrapping back to 0
  setInterval(() => goToTip((currentTip + 1) % tips.length), 4000);
})();
 
 
/* =====================================================
   11. MOTIVATIONAL QUOTES
   Cycles through a list of quotes.
   Starts at a random quote; "New Quote" button moves to the next one.
===================================================== */
const QUOTES = [
  { text: '"Success is the sum of small efforts, repeated day in and day out."', author: '— Robert Collier' },
  { text: '"Education is the passport to the future."',                          author: '— Malcolm X' },
  { text: '"The more that you read, the more things you will know."',            author: '— Dr. Seuss' },
  { text: '"Don\'t watch the clock; do what it does. Keep going."',              author: '— Sam Levenson' },
  { text: '"You don\'t have to be great to start, but you have to start to be great."', author: '— Zig Ziglar' },
  { text: '"Discipline is the bridge between goals and accomplishment."',         author: '— Jim Rohn' },
  { text: '"A little progress each day adds up to big results."',                 author: '— Satya Nani' },
];
 
// Start at a random quote so it feels fresh each visit
let quoteIndex = Math.floor(Math.random() * QUOTES.length);
 
function setQuote(index) {
  document.getElementById("quoteText").textContent   = QUOTES[index].text;
  document.getElementById("quoteAuthor").textContent = QUOTES[index].author;
}
 
// Set initial quote
setQuote(quoteIndex);
 
// "New Quote" cycles forward through the array
document.getElementById("newQuoteBtn").addEventListener("click", () => {
  quoteIndex = (quoteIndex + 1) % QUOTES.length;
  setQuote(quoteIndex);
});
 
 
/* =====================================================
   12. DAILY PLANNER
   Features:
   - Date navigator (prev / next / today buttons)
   - 7-day week strip (click any day to jump to it)
   - 24-hour schedule grid (tasks slot into their deadline hour)
   - Clicking an empty slot pre-fills the form's time field
   - Auto-scrolls to current hour when viewing today
===================================================== */
 
// Track which date the planner is currently showing
let currentViewDate = new Date();
 
// Lookup arrays for display formatting
const DAY_NAMES   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];
 
// Convert a Date object to "YYYY-MM-DD" string (matches task.date format)
function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
 
// Update the day name and full date text above the week row
function updateDateDisplay() {
  document.getElementById("dayName").textContent  = DAY_NAMES[currentViewDate.getDay()];
  document.getElementById("fullDate").textContent =
    `${MONTH_NAMES[currentViewDate.getMonth()]} ${currentViewDate.getDate()}, ${currentViewDate.getFullYear()}`;
}
 
// Render the 7-day week strip centred on currentViewDate
function renderWeekRow(centerDate) {
  const weekRow = document.getElementById("weekRow");
  weekRow.innerHTML = "";
 
  // Find the Sunday that starts this week
  const startOfWeek = new Date(centerDate);
  startOfWeek.setDate(centerDate.getDate() - centerDate.getDay());
 
  // Short day labels (S M T W T F S)
  const DAY_ABBREVIATIONS = ["S","M","T","W","T","F","S"];
 
  for (let i = 0; i < 7; i++) {
    const d       = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateStr = toDateStr(d);
 
    // Show a dot if any tasks exist for this day
    const hasTasks = getTasks().some(t => t.date === dateStr);
 
    const dayEl = document.createElement("div");
    dayEl.className = "week-day" + (dateStr === toDateStr(currentViewDate) ? " active" : "");
    dayEl.innerHTML = `
      <span class="wd-name">${DAY_ABBREVIATIONS[i]}</span>
      <span class="wd-date">${d.getDate()}</span>
      ${hasTasks ? '<div class="wd-dot"></div>' : ''}
    `;
 
    // Clicking a day switches the planner view to that date
    dayEl.addEventListener("click", () => {
      currentViewDate = new Date(d);
      updateDateDisplay();
      renderWeekRow(currentViewDate);
      renderSchedule();
    });
 
    weekRow.appendChild(dayEl);
  }
}
 
// Render the 24-hour schedule grid for the currently viewed date
function renderSchedule() {
  const grid    = document.getElementById("scheduleGrid");
  grid.innerHTML = "";
 
  const dateStr  = toDateStr(currentViewDate);
  const allTasks = getTasks().filter(t => t.date === dateStr);
 
  for (let hour = 0; hour < 24; hour++) {
    // Human-readable time label (12-hour format)
    const label   = hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
    const hourStr = String(hour).padStart(2, "0"); // e.g. "09"
 
    // Find tasks whose deadline time falls in this hour
    const slotTasks = allTasks.filter(t => t.time && t.time.startsWith(hourStr));
 
    const slot = document.createElement("div");
    slot.className = "time-slot";
 
    if (slotTasks.length > 0) {
      // Show the first task for this hour (most common case)
      const t = slotTasks[0];
      slot.innerHTML = `
        <div class="time-label">${label}</div>
        <div class="slot-content slot-task">
          <div class="slot-priority-dot ${t.priority}"></div>
          <div class="slot-task-inner">
            <div class="slot-task-subject">${t.subject}</div>
            <div class="slot-task-name">${t.task}</div>
          </div>
        </div>
      `;
    } else {
      // Empty slot — clicking it pre-fills the form time and scrolls up
      slot.innerHTML = `
        <div class="time-label">${label}</div>
        <div class="slot-content">
          <span class="slot-empty-text">+ Add task</span>
        </div>
      `;
 
      slot.querySelector(".slot-content").addEventListener("click", () => {
        const timeInput = document.getElementById("time");
        timeInput.value = `${hourStr}:00`; // pre-fill with the clicked hour
        document.querySelector(".planner-section").scrollIntoView({ behavior: "smooth" });
 
        // Small delay so scroll completes before focus is set
        setTimeout(() => timeInput.focus(), 600);
      });
    }
 
    grid.appendChild(slot);
  }
 
  // If viewing today, auto-scroll to the current hour
  if (dateStr === toDateStr(new Date())) {
    const slots       = grid.querySelectorAll(".time-slot");
    const currentHour = new Date().getHours();
    if (slots[currentHour]) {
      slots[currentHour].scrollIntoView({ block: "center" });
    }
  }
}
 
// Date navigator buttons
document.getElementById("prevDay").addEventListener("click", () => {
  currentViewDate.setDate(currentViewDate.getDate() - 1);
  updateDateDisplay();
  renderWeekRow(currentViewDate);
  renderSchedule();
});
 
document.getElementById("nextDay").addEventListener("click", () => {
  currentViewDate.setDate(currentViewDate.getDate() + 1);
  updateDateDisplay();
  renderWeekRow(currentViewDate);
  renderSchedule();
});
 
// "Today" button resets view to current date
document.getElementById("todayBtn").addEventListener("click", () => {
  currentViewDate = new Date();
  updateDateDisplay();
  renderWeekRow(currentViewDate);
  renderSchedule();
});
 
 
/* =====================================================
   13. RECENT TASKS — FILTER + RENDER + DELETE
===================================================== */
 
// Track active filter so it survives re-renders (e.g. after adding a task)
let currentFilter = "all";
 
// Filter button click handler — updates active state and re-renders
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderRecentTasks(currentFilter);
  });
});
 
// Render task cards into the grid
function renderRecentTasks(filter = "all") {
  const grid = document.getElementById("recentTasksGrid");
  let tasks  = getTasks();
 
  // Apply priority filter (skip if "all")
  if (filter !== "all") {
    tasks = tasks.filter(t => t.priority === filter);
  }
 
  // Show newest first, cap at 12 cards to avoid an overwhelming list
  tasks = tasks.slice().reverse().slice(0, 12);
 
  // Empty state
  if (tasks.length === 0) {
    grid.innerHTML = `
      <div class="no-tasks-placeholder">
        <i class="fa-solid fa-clipboard"></i>
        <p>${filter === "all"
          ? "No tasks yet. Add your first task above!"
          : `No ${filter}-priority tasks found.`}
        </p>
      </div>
    `;
    return;
  }
 
  grid.innerHTML = "";
  const todayStr = new Date().toISOString().split("T")[0];
 
  tasks.forEach(task => {
    const isOverdue = task.date && task.date < todayStr;
 
    // Build the card element
    const card = document.createElement("div");
    card.className = `task-card ${task.priority}`;
    card.innerHTML = `
      <div class="task-card-header">
        <span class="task-subject-badge">${task.subject}</span>
        <span class="task-priority-badge ${task.priority}">
          ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>
      <div class="task-card-body">
        <div class="task-card-title">${task.task}</div>
        ${task.notes ? `<div class="task-card-notes">${task.notes}</div>` : ""}
      </div>
      <div class="task-card-footer">
        <span class="task-deadline ${isOverdue ? "overdue" : ""}">
          <i class="fa-solid fa-${isOverdue ? "triangle-exclamation" : "calendar-days"}"></i>
          ${isOverdue ? "Overdue · " : ""}${task.date || "No date"} ${task.time || ""}
        </span>
        <button class="task-delete-btn" data-id="${task.id}" title="Delete task">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
 
    // Delete button — asks for confirmation then removes task from storage
    card.querySelector(".task-delete-btn").addEventListener("click", (e) => {
      e.stopPropagation(); // prevent card click events from firing
 
      if (confirm("Delete this task?")) {
        saveTasks(getTasks().filter(t => t.id !== task.id));
 
        // Refresh all UI sections that depend on the task list
        renderRecentTasks(currentFilter);
        updateHeroStats();
        updateSidebarSummary();
        renderSchedule();
        renderWeekRow(currentViewDate);
      }
    });
 
    grid.appendChild(card);
  });
}
 
 
/* =====================================================
   14. BACK TO TOP BUTTON
   Created dynamically (no HTML markup needed).
   Appears after scrolling 400px; smooth-scrolls to top on click.
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
 
const backToTopBtn     = document.createElement("button");
backToTopBtn.id        = "backToTop";
backToTopBtn.innerHTML = "&#8679;"; // ↑ arrow
backToTopBtn.title     = "Back to top";
document.body.appendChild(backToTopBtn);
 
// Show/hide based on scroll depth
window.addEventListener("scroll", () => {
  backToTopBtn.classList.toggle("visible", window.scrollY > 400);
});
 
backToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
 
 
/* =====================================================
   15. INITIALIZATION
   Called once on page load to populate all dynamic sections.
   Order matters: data helpers (stats/summary) first,
   then UI renderers that depend on them.
===================================================== */
updateHeroStats();       // fill hero stat numbers
updateSidebarSummary();  // fill priority count badges
 
updateDateDisplay();                // set day name + full date text
renderWeekRow(currentViewDate);     // build the 7-day strip
renderSchedule();                   // build the hourly grid
 
renderRecentTasks();                // show existing task cards