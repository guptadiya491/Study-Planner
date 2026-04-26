// ============================================================
// AUTH GUARD
// Show lock overlay if user is not logged in — do NOT redirect
// ============================================================
 
window.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("lockOverlay");
  if (!localStorage.getItem("loggedInUser")) {
    overlay.style.display = "flex";
    document.body.classList.add("locked");
  } else {
    overlay.style.display = "none";
    document.body.classList.remove("locked");
  }
});
 
// Re-check auth when navigating back (browser cache)
window.addEventListener("pageshow", () => {
  const overlay = document.getElementById("lockOverlay");
  if (!localStorage.getItem("loggedInUser")) {
    overlay.style.display = "flex";
    document.body.classList.add("locked");
  } else {
    overlay.style.display = "none";
    document.body.classList.remove("locked");
  }
});
 
// Redirect to login page from lock overlay button
function goToPlanner() {
  window.location.href = "login.html";
}
 
// ============================================================
// DARK MODE
// ============================================================
 
const darkBtn = document.getElementById("darkModeBtn");
 
// Apply a theme (light/dark) to <html> and update button icon
function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  darkBtn.innerHTML = theme === "dark"
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}
 
applyTheme(localStorage.getItem("theme") || "light");
 
darkBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  const theme = isDark ? "dark" : "light";
  localStorage.setItem("theme", theme);
  applyTheme(theme);
});
 
// ============================================================
// HAMBURGER MENU
// ============================================================
 
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("navLinks");
 
hamburger.addEventListener("click", () => navLinks.classList.toggle("open"));
 
// Close menu when clicking anywhere outside it
document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove("open");
  }
});
 
// ============================================================
// HERO QUOTES CAROUSEL
// CHANGE: Replaces the old animateHeroRing logic.
// Rotates through 3 quotes automatically every 4 seconds.
// Clicking a dot also jumps to that quote immediately.
// ============================================================

const heroQuotes = [
  "Small progress each day adds up to big results. Keep showing up! 🚀",
  "Don't watch the clock — do what it does. Keep going! 💪",
  "Success is the sum of small efforts repeated day in and day out. 🌟"
];

let heroQuoteIndex = 0;
const heroQuoteText = document.getElementById("heroQuoteText");
const hqDots = document.querySelectorAll(".hq-dot");

// Set a quote by index — fades out, swaps text, fades in
function setHeroQuote(index) {
  heroQuoteIndex = index;

  // Fade out
  heroQuoteText.classList.add("fading");

  setTimeout(() => {
    // Swap text while invisible
    heroQuoteText.textContent = heroQuotes[heroQuoteIndex];

    // Update which dot is active
    hqDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === heroQuoteIndex);
    });

    // Fade back in
    heroQuoteText.classList.remove("fading");
  }, 400);
}

// Show first quote immediately on page load
setHeroQuote(0);

// Auto-advance every 4 seconds
setInterval(() => {
  setHeroQuote((heroQuoteIndex + 1) % heroQuotes.length);
}, 4000);

// Clicking a dot jumps to that quote
hqDots.forEach(dot => {
  dot.addEventListener("click", () => {
    setHeroQuote(parseInt(dot.dataset.index));
  });
});

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
 
const getTasks  = () => JSON.parse(localStorage.getItem("tasks")) || [];
const saveTasks = (tasks) => localStorage.setItem("tasks", JSON.stringify(tasks));
 
// ============================================================
// DOM REFERENCES
// ============================================================
 
const taskBody      = document.getElementById("taskBody");
const noTasksMsg    = document.getElementById("noTasksMsg");
const taskTableEl   = document.querySelector(".task-table-wrapper table");
 
const totalEl       = document.getElementById("statTotal");
const doneEl        = document.getElementById("statDone");
const partialEl     = document.getElementById("statPartial");
const pendingEl     = document.getElementById("statPending");
const overdueEl     = document.getElementById("statOverdue");
 
const circle        = document.getElementById("circleProgress");
const circlePercent = document.getElementById("circlePercent");
const circleStatus  = document.getElementById("circleStatus");
const feedbackBox   = document.getElementById("feedbackBox");

// CHANGE: References for chart empty states
const subjectEmpty  = document.getElementById("subjectEmpty");
const priorityEmpty = document.getElementById("priorityEmpty");
const subjectCanvas = document.getElementById("subjectChart");
const priorityCanvas = document.getElementById("priorityChart");
 
// ============================================================
// FEEDBACK TOAST — close button
// ============================================================
 
document.getElementById("feedbackClose").addEventListener("click", () => {
  feedbackBox.classList.remove("show");
});
 
// ============================================================
// SORT STATE & SEARCH QUERY
// ============================================================
 
let currentSort = { field: null, asc: true };
let searchQuery = "";
 
// ============================================================
// LOAD TASKS — entry point called on page init
// ============================================================
 
function loadTasks() {
  const tasks = getTasks();
  renderTable(tasks);
  updateQuickStats(tasks);
  renderCharts(tasks);
}
 
// ============================================================
// RENDER TABLE
// Applies search filter and sort, then builds rows
// ============================================================
 
function renderTable(tasks) {
  // Filter by search query across subject and task name
  let filtered = tasks;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = tasks.filter(t =>
      (t.subject || "").toLowerCase().includes(q) ||
      (t.task    || "").toLowerCase().includes(q)
    );
  }
 
  // Sort by chosen column
  if (currentSort.field) {
    filtered = [...filtered].sort((a, b) => {
      const av = (a[currentSort.field] || "").toLowerCase();
      const bv = (b[currentSort.field] || "").toLowerCase();
      return currentSort.asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }
 
  taskBody.innerHTML = "";
 
  // Show "no tasks" message when list is empty
  if (filtered.length === 0) {
    noTasksMsg.style.display = "block";
    taskTableEl.style.display = "none";
    return;
  }
 
  noTasksMsg.style.display = "none";
  taskTableEl.style.display = "table";
 
  const today = new Date().toISOString().split("T")[0];
 
  filtered.forEach(task => {
    const isOverdue = task.date && task.date < today;
    const row = document.createElement("tr");
 
    row.innerHTML = `
      <td>${task.subject || "—"}</td>
      <td>${task.task    || "—"}</td>
      <td>
        ${task.date || "—"}
        ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ""}
      </td>
      <td>${task.time || "—"}</td>
      <td>
        <span class="priority-chip ${task.priority || "low"}">
          ${(task.priority || "low").charAt(0).toUpperCase() + (task.priority || "low").slice(1)}
        </span>
      </td>
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="yes"></td>
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="partial"></td>
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="no" checked></td>
      <td style="text-align:center">
        <button class="delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
 
    // Delete a single task and refresh everything
    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Delete this task?")) {
        saveTasks(getTasks().filter(t => t.id !== task.id));
        loadTasks();
        calculateProgress();
        renderCalendar();
      }
    });
 
    taskBody.appendChild(row);
  });
}
 
// ============================================================
// SEARCH — live filter as user types
// ============================================================
 
document.getElementById("searchBox").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderTable(getTasks());
});
 
// ============================================================
// COLUMN SORT — clicking a <th> toggles asc/desc
// ============================================================
 
document.querySelectorAll("th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const field = th.dataset.sort;
    if (currentSort.field === field) currentSort.asc = !currentSort.asc;
    else { currentSort.field = field; currentSort.asc = true; }
    renderTable(getTasks());
  });
});
 
// ============================================================
// EXPORT CSV
// ============================================================
 
document.getElementById("exportBtn").addEventListener("click", () => {
  const tasks = getTasks();
  if (!tasks.length) { alert("No tasks to export!"); return; }
 
  let csv = "Subject,Task,Date,Time,Priority\n";
  tasks.forEach(t => {
    csv += `"${t.subject}","${t.task}","${t.date}","${t.time}","${t.priority}"\n`;
  });
 
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "study-tasks.csv";
  a.click();
  URL.revokeObjectURL(url);
});
 
// ============================================================
// CLEAR ALL TASKS
// ============================================================
 
document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (confirm("⚠️ Clear ALL tasks? This cannot be undone.")) {
    saveTasks([]);
    loadTasks();
    calculateProgress();
    renderCalendar();
  }
});
 
// ============================================================
// QUICK STATS — initial load (before Calculate is clicked)
// Done/Partial start at 0; they update properly after calculateProgress()
// ============================================================
 
function updateQuickStats(tasks) {
  const today = new Date().toISOString().split("T")[0];
  totalEl.textContent   = tasks.length;
  doneEl.textContent    = 0;
  partialEl.textContent = 0;
  pendingEl.textContent = tasks.length;
  overdueEl.textContent = tasks.filter(t => t.date && t.date < today).length;
}
 
// ============================================================
// CALCULATE PROGRESS
// Reads radio selections from the rendered table rows and
// computes percent, then updates all UI components
// ============================================================
 
document.getElementById("calculateProgress").addEventListener("click", calculateProgress);
 
function calculateProgress() {
  const rows = taskBody.querySelectorAll("tr");
  const total = rows.length;
 
  // completed = full tasks done + 0.5 per partial task
  let completedScore = 0;
  let doneCount      = 0;
  let partialCount   = 0;
 
  rows.forEach(row => {
    const yesRadio     = row.querySelector("input[value='yes']");
    const partialRadio = row.querySelector("input[value='partial']");
 
    if (yesRadio && yesRadio.checked) {
      completedScore += 1;
      doneCount++;
    } else if (partialRadio && partialRadio.checked) {
      completedScore += 0.5;
      partialCount++;
    }
  });
 
  // pending = tasks with neither done nor partial selected
  const pendingCount = total - doneCount - partialCount;
  const percent      = total === 0 ? 0 : Math.round((completedScore / total) * 100);
 
  // Update all stat cards with accurate values
  totalEl.textContent   = total;
  doneEl.textContent    = doneCount;
  partialEl.textContent = partialCount;
  pendingEl.textContent = pendingCount;
 
  // Animate the circular indicator (dashboard circle only — ring removed)
  animateCircle(percent);
 
  // Update status message below circle
  circleStatus.textContent =
    percent >= 80 ? "Excellent progress! 🔥" :
    percent >= 50 ? "Good work, keep going! 💪" :
                    "Let's get started! 📚";
 
  // Show AI feedback toast and unlock badges
  getAIFeedback(percent);
  updateBadges(total, percent);
 
  // Launch confetti if 100% complete
  if (percent === 100) launchConfetti();
}
 
// ============================================================
// CIRCLE ANIMATION
// Animates the conic-gradient progress circle smoothly
// ============================================================
 
// Returns correct background track color for current theme
function getTrackColor() {
  return document.documentElement.classList.contains("dark") ? "#1e2540" : "#e2e8f0";
}
 
function animateCircle(target) {
  let current = 0;
  const speed = Math.max(target / 50, 0.5);
 
  function update() {
    current = Math.min(current + speed, target);
    const isDark  = document.documentElement.classList.contains("dark");
    const fill    = isDark ? "#818cf8" : "#4f46e5";
    const track   = getTrackColor();
 
    // Rotate -90deg so progress starts from the top (12 o'clock)
    if (current <= 0) {
      circle.style.background = track;
    } else if (current >= 100) {
      circle.style.background = `conic-gradient(from -90deg, ${fill} 100%, ${track} 100%)`;
    } else {
      circle.style.background =
        `conic-gradient(from -90deg, ${fill} ${current}%, ${fill}cc ${current + 0.4}%, ${track} ${current + 0.5}%)`;
    }
 
    circlePercent.textContent = Math.round(current) + "%";
    if (current < target) requestAnimationFrame(update);
  }
 
  requestAnimationFrame(update);
}

// NOTE: animateHeroRing removed — hero ring replaced with quotes carousel
 
// ============================================================
// AI FEEDBACK TOAST
// Shows a motivational message based on progress percentage
// ============================================================
 
const feedbackMessages = {
  high: [
    "🔥 Outstanding! You're absolutely crushing your goals!",
    "🌟 Incredible consistency — you're unstoppable!",
    "💯 Almost perfect performance. Keep this up!",
  ],
  mid: [
    "👍 Great work! A little more effort and you'll be there.",
    "🚀 You're doing really well — stay consistent!",
    "👏 Nice progress! Push through to the finish.",
  ],
  low: [
    "⚡ Good start! Focus on one subject at a time.",
    "📚 You're building momentum — keep going!",
    "💡 Small wins add up. Keep at it!",
  ],
  zero: [
    "😊 Let's begin! Start with your easiest task.",
    "🔥 Pick one task and crush it today!",
    "📌 Every journey starts with a single step!",
  ]
};
 
function getAIFeedback(percent) {
  let pool;
  if      (percent >= 90) pool = feedbackMessages.high;
  else if (percent >= 60) pool = feedbackMessages.mid;
  else if (percent > 0)   pool = feedbackMessages.low;
  else                    pool = feedbackMessages.zero;
 
  const msg = pool[Math.floor(Math.random() * pool.length)];
  document.getElementById("feedbackText").textContent = msg;
  feedbackBox.classList.add("show");
 
  // Auto-hide after 6 seconds
  setTimeout(() => feedbackBox.classList.remove("show"), 6000);
}
 
// ============================================================
// ACHIEVEMENT BADGES
// Unlock based on progress milestones
// ============================================================
 
function updateBadges(total, percent) {
  if (total    >   0) document.getElementById("badge1").classList.add("unlocked"); // First task added
  if (percent >= 50)  document.getElementById("badge2").classList.add("unlocked"); // 50% complete
  if (percent >= 100) document.getElementById("badge3").classList.add("unlocked"); // All done!
}
 
// ============================================================
// CONFETTI — fires when 100% progress is reached
// ============================================================
 
function launchConfetti() {
  const end = Date.now() + 3000;
  (function frame() {
    confetti({
      particleCount: 6,
      spread: 80,
      origin: { x: Math.random(), y: Math.random() - 0.2 }
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
 
// ============================================================
// CHARTS (Chart.js)
// CHANGE: Each chart now shows an empty state placeholder
// when no tasks exist, and hides it when tasks are present.
// ============================================================
 
let subjectChartInst, priorityChartInst;
 
// Shared color palette for charts
function getChartColors(n) {
  const palette = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}
 
function renderCharts(tasks) {
  renderSubjectChart(tasks);
  renderPriorityChart(tasks);
}
 
// Bar chart: number of tasks per subject
function renderSubjectChart(tasks) {

  // CHANGE: Show empty state if no tasks, hide canvas
  if (tasks.length === 0) {
    subjectEmpty.classList.remove("hidden");
    subjectCanvas.classList.add("hidden");
    if (subjectChartInst) { subjectChartInst.destroy(); subjectChartInst = null; }
    return;
  }

  // Tasks exist — hide empty state, show canvas
  subjectEmpty.classList.add("hidden");
  subjectCanvas.classList.remove("hidden");

  const map = {};
  tasks.forEach(t => { map[t.subject] = (map[t.subject] || 0) + 1; });
  const labels = Object.keys(map);
  const data   = Object.values(map);
 
  const ctx = document.getElementById("subjectChart").getContext("2d");
  if (subjectChartInst) subjectChartInst.destroy(); // Destroy old chart before redrawing
 
  subjectChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Tasks",
        data,
        backgroundColor: getChartColors(labels.length),
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: "#64748b" },
          grid: { color: "rgba(99,102,241,0.08)" }
        },
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false }
        }
      }
    }
  });
}
 
// Doughnut chart: task count by priority level
function renderPriorityChart(tasks) {

  // CHANGE: Show empty state if no tasks, hide canvas
  if (tasks.length === 0) {
    priorityEmpty.classList.remove("hidden");
    priorityCanvas.classList.add("hidden");
    if (priorityChartInst) { priorityChartInst.destroy(); priorityChartInst = null; }
    return;
  }

  // Tasks exist — hide empty state, show canvas
  priorityEmpty.classList.add("hidden");
  priorityCanvas.classList.remove("hidden");

  const high   = tasks.filter(t => t.priority === "high").length;
  const medium = tasks.filter(t => t.priority === "medium").length;
  const low    = tasks.filter(t => t.priority === "low").length;
 
  const ctx = document.getElementById("priorityChart").getContext("2d");
  if (priorityChartInst) priorityChartInst.destroy(); // Destroy old chart before redrawing
 
  priorityChartInst = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["High", "Medium", "Low"],
      datasets: [{
        data: [high, medium, low],
        backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#64748b", padding: 16, usePointStyle: true }
        }
      }
    }
  });
}
 
// ============================================================
// MONTHLY CALENDAR
// ============================================================
 
let calendarDate = new Date();
const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
 
document.getElementById("prevMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});
 
document.getElementById("nextMonth").addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});
 
function renderCalendar() {
  const year  = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const tasks = getTasks();
  const today = new Date();
 
  // Zero-padded today string for comparison
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
 
  document.getElementById("monthTitle").textContent = `${monthNames[month]} ${year}`;
 
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
 
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
 
  // Leading empty cells to align first day correctly
  for (let i = 0; i < firstDay; i++) {
    const div = document.createElement("div");
    div.className = "day empty";
    grid.appendChild(div);
  }
 
  // One cell per day
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTasks = tasks.filter(t => t.date === dateStr);
 
    const div = document.createElement("div");
    div.className = "day" +
      (dayTasks.length > 0 ? " has-task" : "") +
      (dateStr === todayStr  ? " today"    : "");
    div.textContent = d;
 
    // Dot indicator for days with tasks
    if (dayTasks.length > 0) {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      div.appendChild(dot);
    }
 
    // Show task details for clicked day
    div.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      showDayTasks(dateStr, dayTasks);
    });
 
    grid.appendChild(div);
  }
}
 
// Populate the task panel below the calendar for a selected day
function showDayTasks(dateStr, tasks) {
  const title = document.getElementById("dayTaskTitle");
  const list  = document.getElementById("dayTaskList");
  const d     = new Date(dateStr + "T00:00:00");
 
  title.textContent = d.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric"
  });
  list.innerHTML = "";
 
  if (tasks.length === 0) {
    list.innerHTML = "<li style='opacity:0.6'>No tasks for this day 📭</li>";
    return;
  }
 
  tasks.forEach(t => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${t.subject}</strong> — ${t.task}
      ${t.time ? `<span style='opacity:0.6'>@ ${t.time}</span>` : ""}
    `;
    list.appendChild(li);
  });
}
 
// ============================================================
// MOTIVATION QUOTES
// ============================================================
 
const motivationQuotes = [
  '"Small progress each day adds up to big results 🚀"',
  '"Push yourself, because no one else is going to do it for you 💪"',
  '"Great things never come from comfort zones 🌟"',
  '"Dream it. Wish it. Do it. ✨"',
  '"Success doesn\'t just find you. You have to go out and get it 🏆"',
  '"The secret of getting ahead is getting started 📚"',
  '"Don\'t stop when you\'re tired. Stop when you\'re done 🔥"',
];
let motIndex = 0;
 
document.getElementById("newMotivation").addEventListener("click", () => {
  motIndex = (motIndex + 1) % motivationQuotes.length;
  document.getElementById("motivationQuote").textContent = motivationQuotes[motIndex];
});
 
// ============================================================
// BACK TO TOP BUTTON (injected dynamically)
// ============================================================
 
const topBtnStyle = document.createElement("style");
topBtnStyle.textContent = `
  #backToTop {
    position: fixed; bottom: 90px; right: 22px;
    width: 46px; height: 46px; border-radius: 50%;
    background: #6366f1; color: #fff; border: none;
    font-size: 20px; cursor: pointer; z-index: 9998;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(99,102,241,0.5);
    opacity: 0; transform: translateY(20px);
    transition: opacity 0.3s, transform 0.3s, background 0.2s;
    pointer-events: none;
  }
  #backToTop.visible { opacity: 1; transform: translateY(0); pointer-events: all; }
  #backToTop:hover   { background: #4f46e5; transform: translateY(-3px); }
`;
document.head.appendChild(topBtnStyle);
 
const topBtn = document.createElement("button");
topBtn.id        = "backToTop";
topBtn.innerHTML = "&#8679;";
topBtn.title     = "Back to top";
document.body.appendChild(topBtn);
 
window.addEventListener("scroll", () => {
  topBtn.classList.toggle("visible", window.scrollY > 400);
});
 
topBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
 
// ============================================================
// INIT — run on page load
// ============================================================
 
loadTasks();
renderCalendar();
 
// Pre-unlock "First Task" badge if tasks already exist
const initialTasks = getTasks();
if (initialTasks.length > 0) {
  updateBadges(initialTasks.length, 0);
}