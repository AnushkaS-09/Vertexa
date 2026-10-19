// common.js
// Helpers used by every page: login guard, sidebar, formatting,
// attendance maths and the material cards.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, getDocs, deleteDoc, collection, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ---------- Constants ---------- */

export const LANGUAGES = {
  german:   { key: "german",   name: "German",   native: "Deutsch", glyph: "ß", color: "#b7791f", soft: "#fbf1dc" },
  spanish:  { key: "spanish",  name: "Spanish",  native: "Español", glyph: "ñ", color: "#c2512f", soft: "#fbe7df" },
  japanese: { key: "japanese", name: "Japanese", native: "日本語",   glyph: "あ", color: "#4a4fa3", soft: "#e6e7f6" }
};
export const LANGUAGE_KEYS = Object.keys(LANGUAGES);
export const CATEGORIES = ["Notes", "Worksheets", "Assignments", "Tests", "Other"];

/* ---------- Small utilities ---------- */

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function homeFor(role) {
  return role === "professor" ? "professor-dashboard.html" : "student-dashboard.html";
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Accepts a "YYYY-MM-DD" string or a Firestore Timestamp and returns a Date.
export function toDate(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d || isNaN(d)) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatPercent(p) {
  return p.toFixed(1).replace(/\.0$/, "") + "%";
}

function millis(ts) {
  return ts && typeof ts.toMillis === "function" ? ts.toMillis() : 0;
}

export function daysUntil(dateStr) {
  const today = toDate(todayISO());
  return Math.round((toDate(dateStr) - today) / 86400000);
}

/* ---------- Messages and dialogs ---------- */

export function showToast(message, type = "info") {
  let box = document.getElementById("toast-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "toast-box";
    box.className = "toast-box";
    box.setAttribute("aria-live", "polite");
    document.body.appendChild(box);
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

export function confirmDialog(message, confirmLabel = "Confirm") {
  return new Promise((resolve) => {
    const dlg = document.createElement("dialog");
    dlg.className = "dialog";
    dlg.innerHTML = `
      <form method="dialog">
        <h3>Please confirm</h3>
        <p>${escapeHtml(message)}</p>
        <div class="dialog-actions">
          <button class="btn btn-ghost" value="cancel">Cancel</button>
          <button class="btn btn-danger" value="ok">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("close", () => {
      resolve(dlg.returnValue === "ok");
      dlg.remove();
    });
    dlg.showModal();
  });
}

export function showFatal(message) {
  document.body.classList.remove("app-loading");
  const main = document.getElementById("main");
  if (main) main.innerHTML = `<div class="card empty"><h2>Something went wrong</h2><p>${escapeHtml(message)}</p></div>`;
}

/* ---------- Login guard and sidebar ---------- */

// Every protected page calls this first. It waits for Firebase to tell us
// who is logged in, loads their profile (which contains their role) and
// sends them away if they should not be on this page.
export function requireUser(allowedRoles) {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        location.replace("login.html");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) {
          await signOut(auth);
          location.replace("login.html?reason=noprofile");
          return;
        }
        const profile = { uid: user.uid, ...snap.data() };
        profile.languages = profile.languages || [];
        if (allowedRoles && !allowedRoles.includes(profile.role)) {
          location.replace(homeFor(profile.role));
          return;
        }
        document.body.classList.remove("app-loading");
        resolve({ user, profile });
      } catch (err) {
        console.error(err);
        showFatal("We could not load your account. Check your connection and the Firebase setup, then refresh.");
      }
    });
  });
}

export function renderSidebar(profile, active) {
  const isProf = profile.role === "professor";
  const links = isProf
    ? [["dashboard", "professor-dashboard.html", "Dashboard"], ["languages", "language.html", "Languages"], ["attendance", "attendance.html", "Attendance"],
       ["materials", "materials.html", "Materials"], ["students", "students.html", "Students"], ["profile", "profile.html", "Profile"]]
    : [["dashboard", "student-dashboard.html", "Dashboard"], ["languages", "language.html", "My languages"], ["attendance", "attendance.html", "My attendance"],
       ["materials", "materials.html", "Materials"], ["profile", "profile.html", "Profile"]];

  document.getElementById("sidebar").innerHTML = `
    <div class="sidebar-brand">
      <span class="brand-mark">L</span>
      <div><strong>Language Hub</strong><small>${isProf ? "Professor" : "Student"} portal</small></div>
    </div>
    <nav class="sidebar-nav">
      ${links.map(([key, href, label]) => `<a href="${href}" class="${key === active ? "active" : ""}">${label}</a>`).join("")}
    </nav>
    <div class="sidebar-footer">
      <div class="who"><strong>${escapeHtml(profile.name)}</strong><small>${escapeHtml(profile.email)}</small></div>
      <button class="btn btn-ghost btn-sm" id="logout-btn" type="button">Log out</button>
    </div>`;

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await signOut(auth);
    location.replace("login.html");
  });
  document.getElementById("menu-toggle").addEventListener("click", () => document.body.classList.toggle("nav-open"));
  document.getElementById("scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));
}

/* ---------- Firestore reads ---------- */

// Students who may see a language: one query per language, merged.
export async function getMaterials(languages) {
  const lists = await Promise.all(
    languages.map((lang) => getDocs(query(collection(db, "materials"), where("language", "==", lang))))
  );
  const all = [];
  lists.forEach((snap) => snap.forEach((d) => all.push({ id: d.id, ...d.data() })));
  return sortNewest(all);
}

// Professor only: every material.
export async function getAllMaterials() {
  const snap = await getDocs(collection(db, "materials"));
  return sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

function sortNewest(list) {
  return list.sort((a, b) => millis(b.uploadedAt) - millis(a.uploadedAt));
}

// Professor only. Optionally limited to one language.
export async function getStudents(languageKey = null) {
  const q = languageKey
    ? query(collection(db, "users"), where("languages", "array-contains", languageKey))
    : query(collection(db, "users"), where("role", "==", "student"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data(), languages: d.data().languages || [] }))
    .filter((u) => u.role === "student")
    .sort((a, b) => a.name.localeCompare(b.name));
}

// A student's own records (all languages).
export async function getStudentAttendance(uid) {
  const snap = await getDocs(query(collection(db, "attendance"), where("studentId", "==", uid)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Professor only: every record.
export async function getAllAttendance() {
  const snap = await getDocs(collection(db, "attendance"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ---------- Attendance maths ---------- */

// Attendance % = Present / (Present + Absent) x 100.
// Leave is shown separately and is NOT part of the percentage.
// Only dates that have a record are counted, so un-recorded classes never count.
export function calcAttendance(records) {
  let present = 0, absent = 0, leave = 0;
  records.forEach((r) => {
    if (r.status === "present") present++;
    else if (r.status === "absent") absent++;
    else if (r.status === "leave") leave++;
  });
  const counted = present + absent;
  return {
    present, absent, leave,
    conducted: present + absent + leave,
    counted,
    percent: counted > 0 ? (present / counted) * 100 : null
  };
}

export function attendanceBarHTML(stats) {
  if (stats.percent === null) {
    return `<p class="muted small">No attendance has been recorded yet, so there is no percentage to show.</p>`;
  }
  const level = stats.percent >= 85 ? "good" : stats.percent >= 75 ? "fair" : "low";
  return `
    <div class="progress-row">
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.percent.toFixed(1)}">
        <span class="progress-fill ${level}" style="width:${stats.percent}%"></span>
      </div>
      <strong class="progress-value">${formatPercent(stats.percent)}</strong>
    </div>`;
}

export function statCardsHTML(stats) {
  return `
    <div class="grid grid-4">
      <div class="stat"><span class="stat-value">${stats.conducted}</span><span class="stat-label">Classes conducted</span></div>
      <div class="stat"><span class="stat-value">${stats.present}</span><span class="stat-label">Attended</span></div>
      <div class="stat"><span class="stat-value">${stats.absent}</span><span class="stat-label">Missed</span></div>
      <div class="stat"><span class="stat-value">${stats.leave}</span><span class="stat-label">On leave</span></div>
    </div>`;
}

export function statusBadgeHTML(status) {
  const label = { present: "Present", absent: "Absent", leave: "Leave" }[status] || status;
  return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

/* ---------- Language cards and badges ---------- */

export function languageBadgeHTML(key) {
  const l = LANGUAGES[key];
  if (!l) return "";
  return `<span class="badge badge-lang" style="--accent:${l.color};--soft:${l.soft}">${l.name}</span>`;
}

export function languageCardHTML(key, lines = []) {
  const l = LANGUAGES[key];
  return `
    <a class="lang-card" href="language.html?lang=${key}" style="--accent:${l.color};--soft:${l.soft}">
      <span class="lang-glyph" aria-hidden="true">${l.glyph}</span>
      <span class="lang-name">${l.name}</span>
      <span class="lang-native">${l.native}</span>
      <span class="lang-lines">${lines.map((t) => `<span>${t}</span>`).join("")}</span>
      <span class="lang-open">Open →</span>
    </a>`;
}

/* ---------- Materials: cards, download, delete ---------- */

export function materialCardHTML(m, { canDelete = false } = {}) {
  const ext = (m.fileName.split(".").pop() || "file").toUpperCase().slice(0, 4);
  let deadline = "";
  if (m.deadline) {
    const left = daysUntil(m.deadline);
    deadline = `<span class="meta-item ${left < 0 ? "overdue" : ""}">Due ${formatDate(m.deadline)}${left < 0 ? " (passed)" : ""}</span>`;
  }
  return `
    <article class="material">
      <div class="material-top">
        <span class="file-chip">${escapeHtml(ext)}</span>
        <div class="material-badges">${languageBadgeHTML(m.language)}<span class="badge badge-cat">${escapeHtml(m.category)}</span></div>
      </div>
      <h3>${escapeHtml(m.title)}</h3>
      ${m.description ? `<p class="material-desc">${escapeHtml(m.description)}</p>` : ""}
      <div class="material-meta">
        <span class="meta-item">Uploaded ${formatDate(m.uploadedAt)}</span>
        ${deadline}
        ${m.fileSize ? `<span class="meta-item">${formatBytes(m.fileSize)}</span>` : ""}
      </div>
      <div class="material-actions">
        <button class="btn btn-sm" data-action="view" data-id="${m.id}" type="button">View</button>
        <button class="btn btn-sm" data-action="download" data-id="${m.id}" type="button">Download</button>
        ${canDelete ? `<button class="btn btn-sm btn-danger-ghost" data-action="delete" data-id="${m.id}" type="button">Delete</button>` : ""}
      </div>
    </article>`;
}

export async function downloadFile(url, fileName) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  } catch (err) {
    // Usually a CORS problem on the storage bucket (see README, "Optional: CORS").
    window.open(url, "_blank", "noopener");
    showToast("The file opened in a new tab instead of downloading. See the README (CORS step) for direct downloads.", "info");
  }
}

export async function deleteMaterial(m) {
  await deleteDoc(doc(db, "materials", m.id));
}

// Attach once per container; handles View / Download / Delete clicks.
export function attachMaterialActions(container, getList, onDeleted) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const m = getList().find((x) => x.id === btn.dataset.id);
    if (!m) return;

    if (btn.dataset.action === "view") {
      window.open(m.downloadURL, "_blank", "noopener");
    } else if (btn.dataset.action === "download") {
      btn.disabled = true;
      await downloadFile(m.downloadURL, m.fileName);
      btn.disabled = false;
    } else if (btn.dataset.action === "delete") {
      const ok = await confirmDialog(`Delete "${m.title}"? The file will be removed permanently.`, "Delete");
      if (!ok) return;
      try {
        await deleteMaterial(m);
        showToast("Material deleted.", "success");
        if (onDeleted) onDeleted(m);
      } catch (err) {
        console.error(err);
        showToast("Could not delete the material. Check your connection and try again.", "error");
      }
    }
  });
}
