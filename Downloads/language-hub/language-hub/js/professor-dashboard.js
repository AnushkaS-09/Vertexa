// professor-dashboard.js
import {
  requireUser, renderSidebar, getStudents, getAllMaterials, getAllAttendance,
  calcAttendance, languageCardHTML, languageBadgeHTML, formatDate, formatPercent,
  escapeHtml, showFatal, LANGUAGES, LANGUAGE_KEYS
} from "./common.js";

const { profile } = await requireUser(["professor"]);
renderSidebar(profile, "dashboard");
document.getElementById("welcome").textContent = "Welcome, " + profile.name;

try {
  const [students, materials, attendance] = await Promise.all([getStudents(), getAllMaterials(), getAllAttendance()]);

  // Per-language numbers
  const perLang = {};
  LANGUAGE_KEYS.forEach((key) => {
    const records = attendance.filter((r) => r.language === key);
    perLang[key] = {
      students: students.filter((s) => s.languages.includes(key)).length,
      sessions: new Set(records.map((r) => r.date)).size,
      stats: calcAttendance(records),
      materials: materials.filter((m) => m.language === key).length
    };
  });
  const overall = calcAttendance(attendance);

  // Summary cards
  document.getElementById("stats").innerHTML = `
    <div class="stat"><span class="stat-value">${students.length}</span><span class="stat-label">Registered students</span></div>
    <div class="stat"><span class="stat-value">${materials.length}</span><span class="stat-label">Uploaded materials</span></div>
    <div class="stat"><span class="stat-value">${LANGUAGE_KEYS.reduce((n, k) => n + perLang[k].sessions, 0)}</span><span class="stat-label">Class sessions recorded</span></div>
    <div class="stat"><span class="stat-value">${overall.percent === null ? "—" : formatPercent(overall.percent)}</span><span class="stat-label">Average attendance</span></div>`;

  // Language selection cards
  document.getElementById("language-cards").innerHTML = LANGUAGE_KEYS.map((key) =>
    languageCardHTML(key, [
      `${perLang[key].students} student${perLang[key].students === 1 ? "" : "s"} enrolled`,
      `${perLang[key].materials} material${perLang[key].materials === 1 ? "" : "s"}`
    ])
  ).join("");

  // Students grouped by language
  document.getElementById("attendance-summary").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Language</th><th>Students</th><th>Sessions</th><th>Avg. attendance</th></tr></thead>
      <tbody>
        ${LANGUAGE_KEYS.map((key) => `
          <tr>
            <td>${languageBadgeHTML(key)}</td>
            <td>${perLang[key].students}</td>
            <td>${perLang[key].sessions}</td>
            <td>${perLang[key].stats.percent === null ? '<span class="muted">No records yet</span>' : formatPercent(perLang[key].stats.percent)}</td>
          </tr>`).join("")}
      </tbody>
    </table></div>`;

  // Recent uploads (already sorted newest first)
  const recent = materials.slice(0, 5);
  document.getElementById("recent-uploads").innerHTML = recent.length
    ? `<ul class="item-list">${recent.map((m) => `
        <li>
          <div>
            <span class="item-title">${escapeHtml(m.title)}</span>
            <span class="item-sub">Uploaded ${formatDate(m.uploadedAt)}</span>
            <div class="item-badges">${languageBadgeHTML(m.language)}<span class="badge badge-cat">${escapeHtml(m.category)}</span></div>
          </div>
        </li>`).join("")}</ul>`
    : `<div class="empty"><p>Nothing uploaded yet.</p><a class="btn btn-primary btn-sm" href="materials.html#upload">Upload your first material</a></div>`;
} catch (err) {
  console.error(err);
  showFatal("Could not load the dashboard data. Check your Firebase setup and security rules, then refresh.");
}
