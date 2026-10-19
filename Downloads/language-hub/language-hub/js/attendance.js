// attendance.js
// Professor: mark / edit attendance by class date, and review each student's history.
// Student: read-only view of their own attendance.
//
// Each record is stored with a predictable ID:  language_studentUid_YYYY-MM-DD
// Saving the same student + language + date again overwrites that one record,
// which is how duplicates are prevented (the security rules also check the ID).
import {
  requireUser, renderSidebar, getStudents, getStudentAttendance, calcAttendance,
  attendanceBarHTML, statCardsHTML, statusBadgeHTML, formatDate, formatPercent,
  todayISO, showToast, showFatal, confirmDialog, escapeHtml, LANGUAGES, LANGUAGE_KEYS
} from "./common.js";
import { db } from "./firebase-config.js";
import {
  collection, doc, query, where, getDocs, writeBatch, updateDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { profile } = await requireUser(["professor", "student"]);
renderSidebar(profile, "attendance");
const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

try {
  if (profile.role === "professor") await initProfessor();
  else await initStudent();
} catch (err) {
  console.error(err);
  showFatal("Could not load attendance. Check your connection and the Firebase setup, then refresh.");
}

/* =============================================================
   PROFESSOR
   ============================================================= */
async function initProfessor() {
  $("professor-view").hidden = false;
  const students = await getStudents();

  const langOptions = LANGUAGE_KEYS.map((k) => `<option value="${k}">${LANGUAGES[k].name}</option>`).join("");
  $("pf-language").innerHTML = langOptions;
  $("hist-language").innerHTML = langOptions;

  const startLang = LANGUAGES[params.get("lang")] ? params.get("lang") : "german";
  $("pf-language").value = startLang;
  $("hist-language").value = startLang;
  $("pf-date").value = todayISO();
  $("pf-date").max = todayISO();

  /* ----- Part 1: mark attendance for a date ----- */
  let roster = [];
  let state = {};        // studentUid -> "present" | "absent" | "leave"
  let saved = {};        // studentUid -> status already stored for this date

  async function loadRoster() {
    const lang = $("pf-language").value;
    const date = $("pf-date").value;
    roster = students.filter((s) => s.languages.includes(lang));
    saved = {};

    if (!date) {
      $("roster-body").innerHTML = `<tr><td colspan="3" class="muted">Choose a class date.</td></tr>`;
      $("roster-summary").textContent = "";
      return;
    }
    if (roster.length === 0) {
      $("roster-body").innerHTML = `<tr><td colspan="3"><div class="empty"><p>No students are enrolled in ${LANGUAGES[lang].name} yet.</p><a class="btn btn-sm" href="students.html#register">Register a student</a></div></td></tr>`;
      $("roster-summary").textContent = "";
      $("save-attendance").disabled = true;
      $("mark-all").disabled = true;
      return;
    }
    $("save-attendance").disabled = false;
    $("mark-all").disabled = false;

    try {
      const snap = await getDocs(query(collection(db, "attendance"), where("language", "==", lang), where("date", "==", date)));
      snap.forEach((d) => { saved[d.data().studentId] = d.data().status; });
    } catch (err) {
      console.error(err);
      showToast("Could not load existing records for this date.", "error");
    }
    state = { ...saved };
    renderRoster();
  }

  function renderRoster() {
    $("roster-body").innerHTML = roster.map((s) => `
      <tr>
        <td class="student-cell"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.email)}</small></td>
        <td>
          <div class="segmented" role="radiogroup" aria-label="Attendance for ${escapeHtml(s.name)}">
            ${["present", "absent", "leave"].map((v) => `
              <label><input type="radio" name="st-${s.uid}" value="${v}" data-uid="${s.uid}" ${state[s.uid] === v ? "checked" : ""}><span>${v[0].toUpperCase() + v.slice(1)}</span></label>`).join("")}
          </div>
        </td>
        <td>${saved[s.uid] ? '<span class="badge badge-present">Saved</span>' : '<span class="badge">Not recorded</span>'}</td>
      </tr>`).join("");
    updateSummary();
  }

  function updateSummary() {
    const marked = roster.filter((s) => state[s.uid]).length;
    const already = Object.keys(saved).length;
    $("roster-summary").textContent = `${marked} of ${roster.length} students marked` + (already ? ` · ${already} already saved for this date` : "");
  }

  $("roster-body").addEventListener("change", (e) => {
    if (e.target.matches('input[type="radio"]')) {
      state[e.target.dataset.uid] = e.target.value;
      updateSummary();
    }
  });

  $("mark-all").addEventListener("click", () => {
    roster.forEach((s) => { state[s.uid] = "present"; });
    renderRoster();
  });

  $("save-attendance").addEventListener("click", async () => {
    const lang = $("pf-language").value;
    const date = $("pf-date").value;
    const toSave = roster.filter((s) => state[s.uid]);
    if (!date) { showToast("Choose a class date first.", "error"); return; }
    if (date > todayISO()) { showToast("You cannot record attendance for a future date.", "error"); return; }
    if (toSave.length === 0) { showToast("Mark at least one student before saving.", "error"); return; }

    const btn = $("save-attendance");
    btn.disabled = true;
    btn.textContent = "Saving…";
    try {
      const batch = writeBatch(db);
      toSave.forEach((s) => {
        batch.set(doc(db, "attendance", `${lang}_${s.uid}_${date}`), {
          studentId: s.uid,
          language: lang,
          date,
          status: state[s.uid],
          markedBy: profile.uid,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showToast(`Attendance saved for ${toSave.length} student${toSave.length === 1 ? "" : "s"}.`, "success");
      await loadRoster();
      if ($("hist-language").value === lang) await loadHistory();
    } catch (err) {
      console.error(err);
      showToast("Could not save attendance. Check your connection and permissions, then try again.", "error");
    }
    btn.disabled = false;
    btn.textContent = "Save attendance";
  });

  $("pf-language").addEventListener("change", loadRoster);
  $("pf-date").addEventListener("change", loadRoster);

  /* ----- Part 2: one student's history ----- */
  let history = [];

  function fillStudentSelect(preselect) {
    const lang = $("hist-language").value;
    const list = students.filter((s) => s.languages.includes(lang));
    $("hist-student").innerHTML = list.length
      ? list.map((s) => `<option value="${s.uid}">${escapeHtml(s.name)}</option>`).join("")
      : `<option value="">No students enrolled</option>`;
    if (preselect && list.some((s) => s.uid === preselect)) $("hist-student").value = preselect;
  }

  async function loadHistory() {
    const lang = $("hist-language").value;
    const uid = $("hist-student").value;
    if (!uid) {
      $("hist-summary").innerHTML = "";
      $("hist-table").innerHTML = `<div class="empty"><p>No students are enrolled in ${LANGUAGES[lang].name} yet.</p></div>`;
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, "attendance"), where("studentId", "==", uid), where("language", "==", lang)));
      history = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => b.date.localeCompare(a.date));
    } catch (err) {
      console.error(err);
      showToast("Could not load this student's history.", "error");
      return;
    }
    renderHistory();
  }

  function renderHistory() {
    const stats = calcAttendance(history);
    $("hist-summary").innerHTML = attendanceBarHTML(stats) + (stats.percent === null ? "" : statCardsHTML(stats));
    if (history.length === 0) {
      $("hist-table").innerHTML = `<div class="empty"><p>No attendance has been recorded for this student in this language.</p></div>`;
      return;
    }
    $("hist-table").innerHTML = `
      <div class="table-wrap"><table>
        <thead><tr><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>${history.map((r) => `
          <tr>
            <td>${formatDate(r.date)}</td>
            <td>
              <select class="inline-status" data-id="${r.id}" aria-label="Status on ${formatDate(r.date)}">
                ${["present", "absent", "leave"].map((v) => `<option value="${v}" ${r.status === v ? "selected" : ""}>${v[0].toUpperCase() + v.slice(1)}</option>`).join("")}
              </select>
            </td>
            <td><button class="btn btn-sm btn-danger-ghost" data-remove="${r.id}" type="button">Remove</button></td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  }

  $("hist-table").addEventListener("change", async (e) => {
    const sel = e.target.closest("select[data-id]");
    if (!sel) return;
    const rec = history.find((r) => r.id === sel.dataset.id);
    try {
      await updateDoc(doc(db, "attendance", rec.id), { status: sel.value, markedBy: profile.uid, updatedAt: serverTimestamp() });
      rec.status = sel.value;
      showToast("Attendance updated.", "success");
      renderHistory();
      if ($("pf-language").value === rec.language && $("pf-date").value === rec.date) await loadRoster();
    } catch (err) {
      console.error(err);
      sel.value = rec.status;
      showToast("Could not update that record.", "error");
    }
  });

  $("hist-table").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const rec = history.find((r) => r.id === btn.dataset.remove);
    const ok = await confirmDialog(`Remove the attendance record for ${formatDate(rec.date)}? It will no longer count towards the percentage.`, "Remove record");
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "attendance", rec.id));
      history = history.filter((r) => r.id !== rec.id);
      showToast("Record removed.", "success");
      renderHistory();
      if ($("pf-language").value === rec.language && $("pf-date").value === rec.date) await loadRoster();
    } catch (err) {
      console.error(err);
      showToast("Could not remove that record.", "error");
    }
  });

  $("hist-language").addEventListener("change", () => { fillStudentSelect(); loadHistory(); });
  $("hist-student").addEventListener("change", loadHistory);

  fillStudentSelect(params.get("student"));
  await loadRoster();
  await loadHistory();
  if (params.get("student")) $("hist-student").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* =============================================================
   STUDENT
   ============================================================= */
async function initStudent() {
  $("student-view").hidden = false;
  const langs = profile.languages.filter((k) => LANGUAGES[k]);

  if (langs.length === 0) {
    $("student-overview").innerHTML = `<div class="card empty" style="grid-column:1/-1"><h3>You are not enrolled in a language yet</h3><p>Once your professor adds you to a course, your attendance will appear here.</p></div>`;
    return;
  }

  const records = await getStudentAttendance(profile.uid);
  let selected = langs.includes(params.get("lang")) ? params.get("lang") : langs[0];

  function render() {
    $("student-overview").innerHTML = langs.map((k) => {
      const L = LANGUAGES[k];
      const stats = calcAttendance(records.filter((r) => r.language === k));
      return `
        <button type="button" class="att-card ${k === selected ? "selected" : ""}" data-lang="${k}" style="--accent:${L.color}">
          <span class="lang-name">${L.name}</span>
          ${attendanceBarHTML(stats)}
          <small>${stats.present} present · ${stats.absent} absent · ${stats.leave} leave</small>
        </button>`;
    }).join("");

    const L = LANGUAGES[selected];
    const mine = records.filter((r) => r.language === selected).sort((a, b) => b.date.localeCompare(a.date));
    const stats = calcAttendance(mine);

    $("student-detail").innerHTML = `
      <div class="section-head"><h2>${L.name} · details</h2></div>
      ${statCardsHTML(stats)}
      <p class="muted small" style="margin:.75rem 0 1rem">
        ${stats.percent === null ? "No attendance has been recorded yet." : `Attendance is ${formatPercent(stats.percent)}: ${stats.present} attended out of ${stats.counted} counted classes. Leave days are not counted.`}
      </p>
      ${mine.length ? `
        <div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>${mine.map((r) => `<tr><td>${formatDate(r.date)}</td><td>${statusBadgeHTML(r.status)}</td></tr>`).join("")}</tbody>
        </table></div>`
        : `<div class="card empty"><p>No attendance records for ${L.name} yet.</p></div>`}`;
  }

  $("student-overview").addEventListener("click", (e) => {
    const card = e.target.closest("[data-lang]");
    if (card) { selected = card.dataset.lang; render(); }
  });
  render();
}
