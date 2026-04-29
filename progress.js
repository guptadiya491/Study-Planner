
// ============================================================
// AUTH GUARD
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

function goToPlanner() {
  window.location.href = "login.html";
}

// ============================================================
// DARK MODE
// ============================================================

const darkBtn = document.getElementById("darkModeBtn");

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

document.addEventListener("click", (e) => {
  if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
    navLinks.classList.remove("open");
  }
});

// ============================================================
// HERO QUOTES CAROUSEL
// ============================================================

const heroQuotes = [
  "Small progress each day adds up to big results. Keep showing up! 🚀",
  "Don't watch the clock — do what it does. Keep going! 💪",
  "Success is the sum of small efforts repeated day in and day out. 🌟"
];

let heroQuoteIndex = 0;
const heroQuoteText = document.getElementById("heroQuoteText");
const hqDots = document.querySelectorAll(".hq-dot");

function setHeroQuote(index) {
  heroQuoteIndex = index;
  heroQuoteText.classList.add("fading");
  setTimeout(() => {
    heroQuoteText.textContent = heroQuotes[heroQuoteIndex];
    hqDots.forEach((dot, i) => {
      dot.classList.toggle("active", i === heroQuoteIndex);
    });
    heroQuoteText.classList.remove("fading");
  }, 400);
}

setHeroQuote(0);

setInterval(() => {
  setHeroQuote((heroQuoteIndex + 1) % heroQuotes.length);
}, 4000);

hqDots.forEach(dot => {
  dot.addEventListener("click", () => {
    setHeroQuote(parseInt(dot.dataset.index));
  });
});

// ============================================================
// USER IDENTITY
// ============================================================
// FIX: getCurrentUser() now prefers userEmail (unique per person)
// and falls back to loggedInUser only if email is absent.
// This prevents two accounts that both have loggedInUser="true"
// (or any shared value) from sharing reward keys.
//
// Your login page should store BOTH keys when a user signs in:
//   localStorage.setItem("loggedInUser", user.name);   // display name
//   localStorage.setItem("userEmail",    user.email);  // unique ID  ← critical
//
// If you cannot change login.html right now, the sanitised
// loggedInUser fallback below still improves isolation by
// lowercasing and trimming the stored value.
// ============================================================

function getCurrentUser() {
  // Prefer email as the unique identifier
  const email = (localStorage.getItem("userEmail") || "").trim().toLowerCase();
  if (email) return email;

  // Fallback: use loggedInUser value, sanitised
  const name = (localStorage.getItem("loggedInUser") || "guest").trim().toLowerCase();
  return name || "guest";
}

function getCurrentUserEmail() {
  return localStorage.getItem("userEmail") || "";
}

// All reward/points/snapshot keys are prefixed with the
// current user's unique ID so data never leaks across accounts.
function userKey(base) {
  return base + "__" + getCurrentUser();
}

// ============================================================
// LOCAL STORAGE HELPERS — USER-SPECIFIC TASK STORAGE
// ============================================================

function getTaskStore() {
  try {
    const raw = JSON.parse(localStorage.getItem("tasks"));
    if (!Array.isArray(raw)) return [];

    if (raw.length === 0 || (typeof raw[0] === "object" && !raw[0].hasOwnProperty("useremail"))) {
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

// ============================================================
// SESSION GUARD
// ============================================================

const SESSION_VERSION = "v3"; // bumped from v2 → forces clean re-init for all users

function initUserSession() {
  const currentUser = getCurrentUser();
  if (currentUser === "guest") return;

  const initKey = "initialized_" + SESSION_VERSION + "_" + currentUser;

  if (!localStorage.getItem(initKey)) {
    // Brand-new user OR migrating from old version — reset reward keys.
    localStorage.setItem(userKey("studyPoints"),         "0");
    localStorage.setItem(userKey("awardedMilestones"),   JSON.stringify({}));
    localStorage.setItem(userKey("awardedTaskSnapshot"), JSON.stringify({}));
    localStorage.setItem(userKey("taskStatuses"),        JSON.stringify({}));

    // Clean up old-version init flags
    localStorage.removeItem("initialized_v1_" + currentUser);
    localStorage.removeItem("initialized_v2_" + currentUser);
    localStorage.removeItem("initialized_" + currentUser);
    localStorage.removeItem(userKey("initialized"));

    localStorage.setItem(initKey, "true");
  }

  localStorage.setItem("lastActiveUser", currentUser);
}

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

const subjectEmpty   = document.getElementById("subjectEmpty");
const priorityEmpty  = document.getElementById("priorityEmpty");
const subjectCanvas  = document.getElementById("subjectChart");
const priorityCanvas = document.getElementById("priorityChart");

// ============================================================
// FEEDBACK TOAST
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
// LOAD TASKS
// ============================================================

function loadTasks() {
  const tasks = getTasks();
  renderTable(tasks);
  updateQuickStats(tasks);
  renderCharts(tasks);
}

// ============================================================
// RENDER TABLE
// ============================================================

function renderTable(tasks) {
  let filtered = tasks;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = tasks.filter(t =>
      (t.subject || "").toLowerCase().includes(q) ||
      (t.task    || "").toLowerCase().includes(q)
    );
  }

  if (currentSort.field) {
    filtered = [...filtered].sort((a, b) => {
      const av = (a[currentSort.field] || "").toLowerCase();
      const bv = (b[currentSort.field] || "").toLowerCase();
      return currentSort.asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  taskBody.innerHTML = "";

  if (filtered.length === 0) {
    noTasksMsg.style.display = "block";
    taskTableEl.style.display = "none";
    return;
  }

  noTasksMsg.style.display = "none";
  taskTableEl.style.display = "table";

  const today = new Date().toISOString().split("T")[0];
  const savedStatuses = getSavedTaskStatuses();

  filtered.forEach(task => {
    const isOverdue   = task.date && task.date < today;
    const savedStatus = savedStatuses[task.id] || "no";
    const row         = document.createElement("tr");

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
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="yes"     ${savedStatus === "yes"     ? "checked" : ""}></td>
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="partial" ${savedStatus === "partial" ? "checked" : ""}></td>
      <td style="text-align:center"><input type="radio" class="status-radio" name="status-${task.id}" value="no"      ${savedStatus === "no"      ? "checked" : ""}></td>
      <td style="text-align:center">
        <button class="delete-btn" data-id="${task.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;

    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm("Delete this task?")) {
        const statuses = getSavedTaskStatuses();
        delete statuses[task.id];
        localStorage.setItem(userKey("taskStatuses"), JSON.stringify(statuses));

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
// SEARCH
// ============================================================

document.getElementById("searchBox").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderTable(getTasks());
});

// ============================================================
// COLUMN SORT
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
    localStorage.removeItem(userKey("taskStatuses"));
    localStorage.removeItem(userKey("awardedTaskSnapshot"));
    localStorage.setItem(userKey("studyPoints"), "0");
    localStorage.setItem(userKey("awardedMilestones"), JSON.stringify({}));
    loadTasks();
    calculateProgress();
    renderCalendar();
  }
});

// ============================================================
// QUICK STATS
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
// TASK STATUS PERSISTENCE — USER-SPECIFIC
// ============================================================

function getSavedTaskStatuses() {
  try {
    return JSON.parse(localStorage.getItem(userKey("taskStatuses"))) || {};
  } catch {
    return {};
  }
}

function saveCurrentTaskStatuses() {
  const rows     = taskBody.querySelectorAll("tr");
  const statuses = getSavedTaskStatuses();

  rows.forEach(row => {
    row.querySelectorAll(".status-radio").forEach(radio => {
      if (radio.checked) {
        const taskId = radio.name.replace("status-", "");
        statuses[taskId] = radio.value;
      }
    });
  });

  localStorage.setItem(userKey("taskStatuses"), JSON.stringify(statuses));
  return statuses;
}

// ============================================================
// POINTS SYSTEM — ALL KEYS USER-SPECIFIC
// ============================================================

function computePointsForStatus(status) {
  if (status === "yes")     return 10;
  if (status === "partial") return 5;
  return 0;
}

function computeNewPoints(currentStatuses) {
  const snapshotKey     = userKey("awardedTaskSnapshot");
  const awarded         = JSON.parse(localStorage.getItem(snapshotKey)) || {};
  let newPoints         = 0;
  const updatedSnapshot = { ...awarded };

  Object.entries(currentStatuses).forEach(([taskId, status]) => {
    const prevStatus = awarded[taskId] || "no";
    const prevPts    = computePointsForStatus(prevStatus);
    const currPts    = computePointsForStatus(status);
    const diff       = currPts - prevPts;

    if (diff > 0) newPoints += diff;
    updatedSnapshot[taskId] = status;
  });

  Object.keys(updatedSnapshot).forEach(id => {
    if (!(id in currentStatuses)) delete updatedSnapshot[id];
  });

  localStorage.setItem(snapshotKey, JSON.stringify(updatedSnapshot));
  return newPoints;
}

function getMilestonePoints(percent, total) {
  const milestonesKey = userKey("awardedMilestones");
  const milestones    = JSON.parse(localStorage.getItem(milestonesKey)) || {};
  let bonus = 0;

  if (total >= 10 && !milestones["milestone_10tasks"]) { bonus += 15; milestones["milestone_10tasks"] = true; }
  else if (total >= 5 && !milestones["milestone_5tasks"]) { bonus += 5; milestones["milestone_5tasks"] = true; }

  if (total >= 5) {
    if (percent >= 50  && !milestones["milestone_50"])  { bonus += 10; milestones["milestone_50"]  = true; }
    if (percent >= 80  && !milestones["milestone_80"])  { bonus += 25; milestones["milestone_80"]  = true; }
    if (percent >= 100 && !milestones["milestone_100"]) { bonus += 50; milestones["milestone_100"] = true; }
  }

  localStorage.setItem(milestonesKey, JSON.stringify(milestones));
  return bonus;
}

function getPointsInfo(percent) {
  if (percent === 100) return {
    rank: "🏆 Legend", color: "#f59e0b",
    message: "Perfect score! You've completed every single task. Absolutely outstanding — you're a true study champion!",
    tip: "Keep this streak going and add new tasks to maintain momentum."
  };
  if (percent >= 80) return {
    rank: "🔥 Expert", color: "#10b981",
    message: "Excellent work! You're smashing your goals with incredible consistency. Just a little more to reach perfection!",
    tip: "Tackle your remaining tasks one by one — you're so close!"
  };
  if (percent >= 60) return {
    rank: "⭐ Advanced", color: "#06b6d4",
    message: "Great progress! You're clearly putting in solid effort. Stay consistent and the results will follow.",
    tip: "Try completing your highest-priority tasks first for maximum impact."
  };
  if (percent >= 40) return {
    rank: "💪 Rising", color: "#818cf8",
    message: "Good start! You're building momentum. Every task you complete brings you closer to your goal.",
    tip: "Break big tasks into smaller steps and tackle them one at a time."
  };
  if (percent > 0) return {
    rank: "📚 Beginner", color: "#8b5cf6",
    message: "You've taken the first step — that's what matters! Small wins every day add up to big results.",
    tip: "Try completing at least one more task before your next session."
  };
  return {
    rank: "🚀 Getting Started", color: "#64748b",
    message: "No tasks marked complete yet — but your journey starts now! Pick one task and crush it today.",
    tip: "Start with the easiest task to build your confidence."
  };
}

// ============================================================
// INJECT MODAL + REWARDS BUTTON STYLES
// ============================================================

(function injectPointsModalStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #pointsModalOverlay {
      position: fixed; inset: 0;
      background: rgba(10,15,30,0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 999998; opacity: 0; transition: opacity 0.3s ease;
    }
    #pointsModalOverlay.pm-visible { opacity: 1; }
    #pointsModal {
      background: var(--surface, #ffffff); border-radius: 20px;
      padding: 36px 32px 28px; width: 90%; max-width: 420px;
      text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.35);
      transform: translateY(30px) scale(0.96);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      opacity: 0; position: relative;
    }
    #pointsModalOverlay.pm-visible #pointsModal { transform: translateY(0) scale(1); opacity: 1; }
    .pm-rank { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
    .pm-points-ring {
      width: 110px; height: 110px; border-radius: 50%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin: 16px auto; border: 4px solid;
    }
    .pm-points-number { font-size: 2rem; font-weight: 800; line-height: 1; }
    .pm-points-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-top: 2px; }
    .pm-breakdown { display: flex; justify-content: center; gap: 18px; margin: 14px 0; flex-wrap: wrap; }
    .pm-breakdown-item {
      background: var(--surface2, #f8faff);
      border: 1.5px solid var(--border, rgba(99,102,241,0.15));
      border-radius: 10px; padding: 10px 16px; min-width: 80px;
    }
    .pm-breakdown-item span { display: block; font-size: 1.2rem; font-weight: 800; color: var(--primary, #4f46e5); }
    .pm-breakdown-item small { font-size: 0.72rem; font-weight: 600; color: var(--text-muted, #64748b); }
    .pm-message {
      font-size: 0.88rem; color: var(--text-muted, #64748b); line-height: 1.6;
      margin: 14px 0 10px; padding: 12px 16px;
      background: var(--surface2, #f8faff); border-radius: 10px; border-left: 3px solid;
    }
    .pm-tip { font-size: 0.8rem; color: var(--text-muted, #64748b); font-style: italic; margin-bottom: 20px; }
    .pm-close-btn {
      padding: 12px 36px;
      background: linear-gradient(135deg, var(--primary, #4f46e5), var(--accent, #06b6d4));
      border: none; border-radius: 50px; color: #fff; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.25s ease;
      box-shadow: 0 8px 20px rgba(79,70,229,0.3);
    }
    .pm-close-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(79,70,229,0.4); }
    .pm-total-points-stored { font-size: 0.78rem; color: var(--text-muted, #64748b); margin-top: 12px; opacity: 0.8; }
    .pm-total-points-stored strong { color: var(--primary, #4f46e5); }
    .pm-no-new-points {
      font-size: 0.88rem; color: var(--text-muted, #64748b);
      background: var(--surface2, #f8faff);
      border: 1.5px solid var(--border, rgba(99,102,241,0.15));
      border-radius: 10px; padding: 12px 16px; margin: 14px 0; line-height: 1.6;
    }
    /* ── REWARDS MODAL ── */
    #rewardsModalOverlay {
      position: fixed; inset: 0;
      background: rgba(10,15,30,0.75); backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 999998; opacity: 0; transition: opacity 0.3s ease;
    }
    #rewardsModalOverlay.rm-visible { opacity: 1; }
    #rewardsModal {
      background: var(--surface, #ffffff); border-radius: 20px;
      padding: 36px 32px 28px; width: 90%; max-width: 400px;
      text-align: center; box-shadow: 0 24px 60px rgba(0,0,0,0.35);
      transform: translateY(30px) scale(0.96);
      transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease;
      opacity: 0;
    }
    #rewardsModalOverlay.rm-visible #rewardsModal { transform: translateY(0) scale(1); opacity: 1; }
    .rm-title { font-size: 1.4rem; font-weight: 800; color: var(--primary, #4f46e5); margin-bottom: 6px; }
    .rm-subtitle { font-size: 0.82rem; color: var(--text-muted, #64748b); margin-bottom: 20px; }
    .rm-total-ring {
      width: 130px; height: 130px; border-radius: 50%;
      border: 5px solid #f59e0b; background: rgba(245,158,11,0.08);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      margin: 0 auto 20px;
    }
    .rm-total-number { font-size: 2.2rem; font-weight: 800; color: #f59e0b; line-height: 1; }
    .rm-total-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #f59e0b; opacity: 0.8; margin-top: 3px; }
    .rm-breakdown-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .rm-stat { background: var(--surface2, #f8faff); border: 1.5px solid var(--border, rgba(99,102,241,0.15)); border-radius: 10px; padding: 12px; }
    .rm-stat-value { display: block; font-size: 1.3rem; font-weight: 800; color: var(--primary, #4f46e5); }
    .rm-stat-label { font-size: 0.72rem; font-weight: 600; color: var(--text-muted, #64748b); }
    .rm-rank-badge { display: inline-block; padding: 6px 20px; border-radius: 20px; font-size: 0.88rem; font-weight: 700; margin-bottom: 20px; border: 2px solid; }
    .rm-close-btn {
      padding: 12px 36px;
      background: linear-gradient(135deg, var(--primary, #4f46e5), var(--accent, #06b6d4));
      border: none; border-radius: 50px; color: #fff; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; font-family: 'Poppins', sans-serif; transition: all 0.25s ease;
      box-shadow: 0 8px 20px rgba(79,70,229,0.3);
    }
    .rm-close-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(79,70,229,0.4); }
    /* ── REWARDS FLOAT BUTTON ── */
    #rewardsFloatBtn {
      position: fixed; bottom: 90px; left: 22px;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      border: none; border-radius: 50px; color: #fff;
      font-family: 'Poppins', sans-serif; font-size: 0.82rem; font-weight: 700;
      padding: 10px 18px; cursor: pointer; z-index: 9997;
      box-shadow: 0 6px 20px rgba(245,158,11,0.45);
      display: flex; align-items: center; gap: 7px;
      transition: all 0.25s ease; white-space: nowrap;
    }
    #rewardsFloatBtn:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(245,158,11,0.55); }
    #rewardsFloatBtn i { font-size: 0.95rem; }
  `;
  document.head.appendChild(style);
})();

(function injectRewardsButton() {
  const btn = document.createElement("button");
  btn.id        = "rewardsFloatBtn";
  btn.innerHTML = '<i class="fa-solid fa-trophy"></i> My Rewards';
  btn.title     = "View your total points";
  document.body.appendChild(btn);
  btn.addEventListener("click", showRewardsModal);
})();

// ============================================================
// REWARDS MODAL
// FIX: Every read is wrapped in getCurrentUser() at call-time
// so switching accounts always shows the correct user's data.
// ============================================================

function showRewardsModal() {
  const existing = document.getElementById("rewardsModalOverlay");
  if (existing) existing.remove();

  // ── Read THIS user's data only (via userKey, evaluated now) ──
  const totalPts = parseInt(localStorage.getItem(userKey("studyPoints")) || "0");

  const snapshot = JSON.parse(localStorage.getItem(userKey("awardedTaskSnapshot"))) || {};
  let doneCount = 0, partialCount = 0;
  Object.values(snapshot).forEach(s => {
    if (s === "yes")     doneCount++;
    if (s === "partial") partialCount++;
  });

  const taskPoints  = doneCount * 10 + partialCount * 5;
  const bonusPoints = Math.max(0, totalPts - taskPoints);

  let rank = "🚀 Getting Started", rankColor = "#64748b";
  if      (totalPts >= 200) { rank = "🏆 Legend";   rankColor = "#f59e0b"; }
  else if (totalPts >= 100) { rank = "🔥 Expert";   rankColor = "#10b981"; }
  else if (totalPts >= 60)  { rank = "⭐ Advanced"; rankColor = "#06b6d4"; }
  else if (totalPts >= 30)  { rank = "💪 Rising";   rankColor = "#818cf8"; }
  else if (totalPts >= 10)  { rank = "📚 Beginner"; rankColor = "#8b5cf6"; }

  // Display name shown inside the modal
  const displayName = (localStorage.getItem("loggedInUser") || "You").trim();

  const overlay = document.createElement("div");
  overlay.id = "rewardsModalOverlay";
  overlay.innerHTML = `
    <div id="rewardsModal">
      <div class="rm-title">🎖️ ${displayName}'s Rewards</div>
      <div class="rm-subtitle">Your total points earned so far</div>
      <div class="rm-total-ring">
        <div class="rm-total-number">${totalPts}</div>
        <div class="rm-total-label">Total Points</div>
      </div>
      <div class="rm-rank-badge" style="color:${rankColor}; border-color:${rankColor}; background:${rankColor}18;">
        ${rank}
      </div>
      <div class="rm-breakdown-grid">
        <div class="rm-stat"><span class="rm-stat-value">${doneCount}</span><span class="rm-stat-label">Tasks Completed</span></div>
        <div class="rm-stat"><span class="rm-stat-value">${partialCount}</span><span class="rm-stat-label">Tasks Partial</span></div>
        <div class="rm-stat"><span class="rm-stat-value">${taskPoints}</span><span class="rm-stat-label">Task Points</span></div>
        <div class="rm-stat"><span class="rm-stat-value">${bonusPoints}</span><span class="rm-stat-label">Bonus Points</span></div>
      </div>
      <button class="rm-close-btn" id="rmCloseBtn">Close</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("rm-visible")));
  document.getElementById("rmCloseBtn").addEventListener("click", closeRewardsModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeRewardsModal(); });
}

function closeRewardsModal() {
  const overlay = document.getElementById("rewardsModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("rm-visible");
  setTimeout(() => overlay.remove(), 350);
}

// ============================================================
// POINTS MODAL
// FIX: Reads and writes userKey("studyPoints") at call-time
// so the correct user's total is always used.
// ============================================================

function showPointsModal(total, doneCount, partialCount, percent, sessionPoints) {
  const existing = document.getElementById("pointsModalOverlay");
  if (existing) existing.remove();

  const info = getPointsInfo(percent);

  // Read & update THIS user's running total
  const storageKey = userKey("studyPoints");
  const prevTotal  = parseInt(localStorage.getItem(storageKey) || "0");
  const newTotal   = prevTotal + sessionPoints;
  localStorage.setItem(storageKey, String(newTotal));

  const pointsContent = sessionPoints > 0
    ? `
      <div class="pm-points-ring" style="border-color:${info.color}; color:${info.color}; background:${info.color}18;">
        <div class="pm-points-number">+${sessionPoints}</div>
        <div class="pm-points-label">New Points</div>
      </div>
      <div class="pm-message" style="border-left-color:${info.color};">${info.message}</div>
      <p class="pm-tip">💡 ${info.tip}</p>
    `
    : `
      <div class="pm-no-new-points">
        ✅ Your progress is already counted! Complete more tasks or mark more as done to earn additional points.
      </div>
      <p class="pm-tip">💡 ${info.tip}</p>
    `;

  const overlay = document.createElement("div");
  overlay.id = "pointsModalOverlay";
  overlay.innerHTML = `
    <div id="pointsModal">
      <div class="pm-rank" style="color:${info.color}">${info.rank}</div>
      ${pointsContent}
      <div class="pm-breakdown">
        <div class="pm-breakdown-item"><span>${doneCount}</span><small>Completed</small></div>
        <div class="pm-breakdown-item"><span>${partialCount}</span><small>Partial</small></div>
        <div class="pm-breakdown-item"><span>${percent}%</span><small>Progress</small></div>
      </div>
      <button class="pm-close-btn" id="pmCloseBtn">Awesome, Keep Going!</button>
      <p class="pm-total-points-stored">Your total points: <strong>${newTotal} pts</strong></p>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("pm-visible")));
  document.getElementById("pmCloseBtn").addEventListener("click", closePointsModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePointsModal(); });
}

function closePointsModal() {
  const overlay = document.getElementById("pointsModalOverlay");
  if (!overlay) return;
  overlay.classList.remove("pm-visible");
  setTimeout(() => overlay.remove(), 350);
}

// ============================================================
// CALCULATE PROGRESS
// ============================================================

document.getElementById("calculateProgress").addEventListener("click", calculateProgress);

function calculateProgress() {
  const rows = taskBody.querySelectorAll("tr");
  const total = rows.length;

  let completedScore = 0;
  let doneCount      = 0;
  let partialCount   = 0;

  const currentStatuses = saveCurrentTaskStatuses();

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

  const pendingCount = total - doneCount - partialCount;
  const percent      = total === 0 ? 0 : Math.round((completedScore / total) * 100);

  totalEl.textContent   = total;
  doneEl.textContent    = doneCount;
  partialEl.textContent = partialCount;
  pendingEl.textContent = pendingCount;

  animateCircle(percent);

  circleStatus.textContent =
    percent >= 80 ? "Excellent progress! 🔥" :
    percent >= 50 ? "Good work, keep going! 💪" :
                    "Let's get started! 📚";

  getAIFeedback(percent);
  updateBadges(total, percent);

  if (percent === 100) launchConfetti();

  const newTaskPoints  = computeNewPoints(currentStatuses);
  const milestoneBonus = getMilestonePoints(percent, total);
  const sessionPoints  = newTaskPoints + milestoneBonus;

  showPointsModal(total, doneCount, partialCount, percent, sessionPoints);
}

// ============================================================
// CIRCLE ANIMATION
// ============================================================

function getTrackColor() {
  return document.documentElement.classList.contains("dark") ? "#1e2540" : "#e2e8f0";
}

function animateCircle(target) {
  let current = 0;
  const speed = Math.max(target / 50, 0.5);

  function update() {
    current = Math.min(current + speed, target);
    const isDark = document.documentElement.classList.contains("dark");
    const fill   = isDark ? "#818cf8" : "#4f46e5";
    const track  = getTrackColor();

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

// ============================================================
// AI FEEDBACK TOAST
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
  setTimeout(() => feedbackBox.classList.remove("show"), 6000);
}

// ============================================================
// ACHIEVEMENT BADGES
// ============================================================

function updateBadges(total, percent) {
  if (total    >   0) document.getElementById("badge1").classList.add("unlocked");
  if (percent >= 50)  document.getElementById("badge2").classList.add("unlocked");
  if (percent >= 100) document.getElementById("badge3").classList.add("unlocked");
}

// ============================================================
// CONFETTI
// ============================================================

function launchConfetti() {
  const end = Date.now() + 3000;
  (function frame() {
    confetti({ particleCount: 6, spread: 80, origin: { x: Math.random(), y: Math.random() - 0.2 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ============================================================
// CHARTS (Chart.js)
// ============================================================

let subjectChartInst, priorityChartInst;

function getChartColors(n) {
  const palette = ["#4f46e5","#06b6d4","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6"];
  return Array.from({ length: n }, (_, i) => palette[i % palette.length]);
}

function renderCharts(tasks) {
  renderSubjectChart(tasks);
  renderPriorityChart(tasks);
}

function renderSubjectChart(tasks) {
  if (tasks.length === 0) {
    subjectEmpty.classList.remove("hidden");
    subjectCanvas.classList.add("hidden");
    if (subjectChartInst) { subjectChartInst.destroy(); subjectChartInst = null; }
    return;
  }
  subjectEmpty.classList.add("hidden");
  subjectCanvas.classList.remove("hidden");

  const map = {};
  tasks.forEach(t => { map[t.subject] = (map[t.subject] || 0) + 1; });
  const labels = Object.keys(map);
  const data   = Object.values(map);

  const ctx = document.getElementById("subjectChart").getContext("2d");
  if (subjectChartInst) subjectChartInst.destroy();

  subjectChartInst = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Tasks", data,
        backgroundColor: getChartColors(labels.length),
        borderRadius: 8, borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, color: "#64748b" }, grid: { color: "rgba(99,102,241,0.08)" } },
        x: { ticks: { color: "#64748b" }, grid: { display: false } }
      }
    }
  });
}

function renderPriorityChart(tasks) {
  if (tasks.length === 0) {
    priorityEmpty.classList.remove("hidden");
    priorityCanvas.classList.add("hidden");
    if (priorityChartInst) { priorityChartInst.destroy(); priorityChartInst = null; }
    return;
  }
  priorityEmpty.classList.add("hidden");
  priorityCanvas.classList.remove("hidden");

  const high   = tasks.filter(t => t.priority === "high").length;
  const medium = tasks.filter(t => t.priority === "medium").length;
  const low    = tasks.filter(t => t.priority === "low").length;

  const ctx = document.getElementById("priorityChart").getContext("2d");
  if (priorityChartInst) priorityChartInst.destroy();

  priorityChartInst = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["High", "Medium", "Low"],
      datasets: [{ data: [high, medium, low], backgroundColor: ["#ef4444","#f59e0b","#10b981"], borderWidth: 0, hoverOffset: 8 }]
    },
    options: {
      responsive: true, cutout: "65%",
      plugins: { legend: { position: "bottom", labels: { color: "#64748b", padding: 16, usePointStyle: true } } }
    }
  });
}

// ============================================================
// MONTHLY CALENDAR
// ============================================================

let calendarDate = new Date();
const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

  for (let i = 0; i < firstDay; i++) {
    const div = document.createElement("div");
    div.className = "day empty";
    grid.appendChild(div);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayTasks = tasks.filter(t => t.date === dateStr);

    const div = document.createElement("div");
    div.className = "day" +
      (dayTasks.length > 0 ? " has-task" : "") +
      (dateStr === todayStr ? " today" : "");
    div.textContent = d;

    if (dayTasks.length > 0) {
      const dot = document.createElement("div");
      dot.className = "task-dot";
      div.appendChild(dot);
    }

    div.addEventListener("click", () => {
      document.querySelectorAll(".day").forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      showDayTasks(dateStr, dayTasks);
    });

    grid.appendChild(div);
  }
}

function showDayTasks(dateStr, tasks) {
  const title = document.getElementById("dayTaskTitle");
  const list  = document.getElementById("dayTaskList");
  const d     = new Date(dateStr + "T00:00:00");

  title.textContent = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
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
// BACK TO TOP BUTTON
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
// INIT
// ============================================================

initUserSession();
loadTasks();
renderCalendar();

const initialTasks = getTasks();
if (initialTasks.length > 0) {
  updateBadges(initialTasks.length, 0);
}