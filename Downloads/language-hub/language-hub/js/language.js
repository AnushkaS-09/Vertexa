// language.js — language chooser (no ?lang) and language details page (?lang=german)
import {
  requireUser, renderSidebar, getStudents, getMaterials, getStudentAttendance, calcAttendance,
  attendanceBarHTML, statCardsHTML, languageCardHTML, materialCardHTML, attachMaterialActions,
  formatPercent, escapeHtml, showFatal, todayISO, daysUntil, formatDate,
  LANGUAGES, LANGUAGE_KEYS, CATEGORIES
} from "./common.js";
import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { profile } = await requireUser(["professor", "student"]);
renderSidebar(profile, "languages");

const isProf = profile.role === "professor";
const root = document.getElementById("lang-root");
const lang = new URLSearchParams(location.search).get("lang");

try {
  if (!lang || !LANGUAGES[lang]) showChooser();
  else if (!isProf && !profile.languages.includes(lang)) showNoAccess();
  else await showLanguage(lang);
} catch (err) {
  console.error(err);
  showFatal("Could not load this page. Check your connection and refresh.");
}

/* ---------- Chooser ---------- */
function showChooser() {
  const keys = isProf ? LANGUAGE_KEYS : profile.languages.filter((k) => LANGUAGES[k]);
  root.innerHTML = `
    <div class="page-head"><div><h1>${isProf ? "Languages" : "My languages"}</h1>
    <p>${isProf ? "Choose a language to manage its students, materials and attendance." : "Choose a course to see its materials and your attendance."}</p></div></div>
    ${keys.length
      ? `<div class="grid grid-3">${keys.map((k) => languageCardHTML(k)).join("")}</div>`
      : `<div class="card empty"><h3>You are not enrolled in a language yet</h3><p>Your professor will add you to a course.</p></div>`}`;
}

function showNoAccess() {
  root.innerHTML = `
    <div class="card empty">
      <h2>You are not enrolled in ${LANGUAGES[lang].name}</h2>
      <p>You can only open the courses your professor has assigned to you.</p>
      <a class="btn btn-primary" href="language.html">Back to my languages</a>
    </div>`;
}

/* ---------- Language details ---------- */
async function showLanguage(key) {
  const L = LANGUAGES[key];
  const banner = `
    <a class="back-link" href="language.html">← All languages</a>
    <div class="lang-banner" style="--accent:${L.color};--soft:${L.soft}">
      <span class="lang-glyph" aria-hidden="true">${L.glyph}</span>
      <div class="banner-text"><h1>${L.name}</h1><p>${L.native}</p></div>
      ${isProf ? `<div class="row">
        <a class="btn btn-primary" href="attendance.html?lang=${key}">Take attendance</a>
        <a class="btn" href="materials.html?lang=${key}#upload">Upload material</a></div>` : ""}
    </div>`;

  let materials = await getMaterials([key]);
  let topHTML = "";
  let studentsHTML = "";

  if (isProf) {
    const students = await getStudents(key);
    const snap = await getDocs(query(collection(db, "attendance"), where("language", "==", key)));
    const records = snap.docs.map((d) => d.data());
    const overall = calcAttendance(records);
    const sessions = new Set(records.map((r) => r.date)).size;

    topHTML = `
      <div class="grid grid-3">
        <div class="stat"><span class="stat-value">${students.length}</span><span class="stat-label">Enrolled students</span></div>
        <div class="stat"><span class="stat-value">${sessions}</span><span class="stat-label">Class sessions recorded</span></div>
        <div class="stat"><span class="stat-value">${overall.percent === null ? "—" : formatPercent(overall.percent)}</span><span class="stat-label">Average attendance</span></div>
      </div>`;

    studentsHTML = `
      <section class="section">
        <div class="section-head"><h2>Students</h2></div>
        ${students.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Student</th><th>Attendance</th><th>Attended</th><th>Missed</th><th>Leave</th><th></th></tr></thead>
          <tbody>${students.map((s) => {
            const st = calcAttendance(records.filter((r) => r.studentId === s.uid));
            return `<tr>
              <td class="student-cell"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.email)}</small></td>
              <td class="mini-progress">${attendanceBarHTML(st).replace('class="muted small">No attendance has been recorded yet, so there is no percentage to show.', 'class="muted small">No records yet')}</td>
              <td>${st.present}</td><td>${st.absent}</td><td>${st.leave}</td>
              <td><a class="btn btn-sm" href="attendance.html?lang=${key}&student=${s.uid}">History</a></td>
            </tr>`;
          }).join("")}</tbody>
        </table></div>`
        : `<div class="card empty"><h3>No students enrolled in ${L.name}</h3><p>Register a student and tick ${L.name} to enrol them.</p><a class="btn btn-primary btn-sm" href="students.html#register">Register a student</a></div>`}
      </section>`;
  } else {
    const records = (await getStudentAttendance(profile.uid)).filter((r) => r.language === key);
    const stats = calcAttendance(records);
    topHTML = `
      <div class="card">
        <h2>My attendance</h2>
        ${attendanceBarHTML(stats)}
        <div style="margin-top:1rem">${statCardsHTML(stats)}</div>
        <p class="muted small" style="margin:1rem 0 0">Leave days are not counted in your percentage. <a href="attendance.html?lang=${key}">See attendance history</a></p>
      </div>`;
  }

  const upcoming = materials.filter((m) => m.deadline && m.deadline >= todayISO()).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 4);
  const deadlinesHTML = upcoming.length ? `
    <section class="section">
      <div class="section-head"><h2>Upcoming deadlines</h2></div>
      <div class="card"><ul class="item-list">${upcoming.map((m) => {
        const left = daysUntil(m.deadline);
        return `<li><div><span class="item-title">${escapeHtml(m.title)}</span><span class="item-sub">${escapeHtml(m.category)} · ${formatDate(m.deadline)}</span></div>
        <span class="due-pill ${left <= 3 ? "soon" : ""}">${left === 0 ? "Due today" : left === 1 ? "Tomorrow" : "In " + left + " days"}</span></li>`;
      }).join("")}</ul></div>
    </section>` : "";

  root.innerHTML = `
    ${banner}
    ${topHTML}
    ${studentsHTML}
    ${deadlinesHTML}
    <section class="section">
      <div class="section-head">
        <h2>Materials</h2>
        <select id="cat-filter" aria-label="Filter by category" style="width:auto">
          <option value="">All categories</option>
          ${CATEGORIES.map((c) => `<option>${c}</option>`).join("")}
        </select>
      </div>
      <div id="materials-box" class="materials-grid"></div>
    </section>`;

  const box = document.getElementById("materials-box");
  const filter = document.getElementById("cat-filter");

  function renderMaterials() {
    const list = materials.filter((m) => !filter.value || m.category === filter.value);
    box.innerHTML = list.length
      ? list.map((m) => materialCardHTML(m, { canDelete: isProf })).join("")
      : `<div class="card empty" style="grid-column:1/-1"><h3>No materials</h3><p>${materials.length ? "Nothing in this category yet." : `No ${L.name} materials have been uploaded yet.`}</p></div>`;
  }
  filter.addEventListener("change", renderMaterials);
  attachMaterialActions(box, () => materials, (gone) => {
    materials = materials.filter((m) => m.id !== gone.id);
    renderMaterials();
  });
  renderMaterials();
}
