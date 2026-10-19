// student-dashboard.js
import {
  requireUser, renderSidebar, getMaterials, getStudentAttendance, calcAttendance,
  attendanceBarHTML, languageCardHTML, languageBadgeHTML, formatDate, formatPercent,
  daysUntil, todayISO, escapeHtml, showFatal
} from "./common.js";

const { profile } = await requireUser(["student"]);
renderSidebar(profile, "dashboard");
document.getElementById("welcome").textContent = "Welcome, " + profile.name;

const cards = document.getElementById("language-cards");
const recentBox = document.getElementById("recent-materials");
const deadlineBox = document.getElementById("deadlines");

if (profile.languages.length === 0) {
  cards.innerHTML = `<div class="card empty" style="grid-column:1/-1"><h3>You are not enrolled in a language yet</h3><p>Your professor will add you to a course. Check back soon.</p></div>`;
  recentBox.innerHTML = `<div class="empty"><p>No materials yet.</p></div>`;
  deadlineBox.innerHTML = `<div class="empty"><p>No upcoming deadlines.</p></div>`;
} else {
  try {
    const [materials, attendance] = await Promise.all([getMaterials(profile.languages), getStudentAttendance(profile.uid)]);

    cards.innerHTML = profile.languages.map((key) => {
      const stats = calcAttendance(attendance.filter((r) => r.language === key));
      const line = stats.percent === null ? "No attendance recorded yet" : `Attendance: ${formatPercent(stats.percent)}`;
      return languageCardHTML(key, [line]);
    }).join("");

    // Recent uploads
    const recent = materials.slice(0, 5);
    recentBox.innerHTML = recent.length
      ? `<ul class="item-list">${recent.map((m) => `
          <li>
            <div>
              <span class="item-title">${escapeHtml(m.title)}</span>
              <span class="item-sub">Uploaded ${formatDate(m.uploadedAt)}</span>
              <div class="item-badges">${languageBadgeHTML(m.language)}<span class="badge badge-cat">${escapeHtml(m.category)}</span></div>
            </div>
            <a class="btn btn-sm" href="materials.html?lang=${m.language}">Open</a>
          </li>`).join("")}</ul>`
      : `<div class="empty"><p>Your professor has not uploaded any materials yet.</p></div>`;

    // Upcoming deadlines (today or later), soonest first
    const today = todayISO();
    const upcoming = materials
      .filter((m) => m.deadline && m.deadline >= today)
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 6);
    deadlineBox.innerHTML = upcoming.length
      ? `<ul class="item-list">${upcoming.map((m) => {
          const left = daysUntil(m.deadline);
          const cls = left === 0 ? "today" : left <= 3 ? "soon" : "";
          const text = left === 0 ? "Due today" : left === 1 ? "Tomorrow" : `In ${left} days`;
          return `
            <li>
              <div>
                <span class="item-title">${escapeHtml(m.title)}</span>
                <span class="item-sub">${escapeHtml(m.category)} · ${formatDate(m.deadline)}</span>
              </div>
              <span class="due-pill ${cls}">${text}</span>
            </li>`;
        }).join("")}</ul>`
      : `<div class="empty"><p>No upcoming assignment or test deadlines.</p></div>`;
  } catch (err) {
    console.error(err);
    showFatal("Could not load your dashboard. Check your connection and refresh.");
  }
}
