// students.js (professor only)
//
// How registration works:
// createUserWithEmailAndPassword() normally signs the new user in, which would log the
// professor out. To avoid that, we create the account using a temporary SECOND Firebase
// app instance, then sign it out and discard it. The professor stays logged in on the main app.
// The student's profile (role = "student") is then saved in Firestore by the professor.
import {
  requireUser, renderSidebar, getStudents, getAllAttendance, calcAttendance,
  showToast, showFatal, formatPercent, escapeHtml, LANGUAGES, LANGUAGE_KEYS
} from "./common.js";
import { db, firebaseConfig } from "./firebase-config.js";
import { initializeApp, deleteApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { profile } = await requireUser(["professor"]);
renderSidebar(profile, "students");
const $ = (id) => document.getElementById(id);

let students = [];
let attendance = [];
let editing = null;

const checkboxes = (name, selected = []) =>
  LANGUAGE_KEYS.map((k) => `<label class="check"><input type="checkbox" name="${name}" value="${k}" ${selected.includes(k) ? "checked" : ""}> ${LANGUAGES[k].name}</label>`).join("");

$("reg-languages").innerHTML = checkboxes("reg-lang");
$("filter-language").innerHTML = `<option value="">All languages</option>` + LANGUAGE_KEYS.map((k) => `<option value="${k}">${LANGUAGES[k].name}</option>`).join("");

/* ----- Load and show students ----- */
async function load() {
  try {
    [students, attendance] = await Promise.all([getStudents(), getAllAttendance()]);
  } catch (err) {
    console.error(err);
    showFatal("Could not load students. Check your Firebase setup and security rules, then refresh.");
    return;
  }
  render();
}

function render() {
  const lang = $("filter-language").value;
  const text = $("filter-search").value.trim().toLowerCase();
  const list = students.filter((s) =>
    (!lang || s.languages.includes(lang)) &&
    (!text || s.name.toLowerCase().includes(text) || s.email.toLowerCase().includes(text))
  );
  $("count").textContent = `(${list.length}${list.length !== students.length ? " of " + students.length : ""})`;

  if (students.length === 0) {
    $("students-list").innerHTML = `<div class="card empty"><h3>No students registered yet</h3><p>Use the form above to register your first student.</p></div>`;
    return;
  }
  if (list.length === 0) {
    $("students-list").innerHTML = `<div class="card empty"><h3>No matching students</h3><p>Try a different language or search.</p></div>`;
    return;
  }

  $("students-list").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Student</th><th>Enrolled in</th><th>Attendance</th><th></th></tr></thead>
      <tbody>${list.map((s) => `
        <tr>
          <td class="student-cell"><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.email)}</small></td>
          <td>${s.languages.length ? `<div class="chip-row">${s.languages.map((k) => `<span class="badge badge-lang" style="--accent:${LANGUAGES[k].color};--soft:${LANGUAGES[k].soft}">${LANGUAGES[k].name}</span>`).join("")}</div>` : '<span class="muted">Not enrolled</span>'}</td>
          <td>${s.languages.length ? `<div class="chip-row">${s.languages.map((k) => {
            const st = calcAttendance(attendance.filter((r) => r.studentId === s.uid && r.language === k));
            const L = LANGUAGES[k];
            return st.percent === null
              ? `<span class="att-chip none">${L.name}: no records</span>`
              : `<span class="att-chip" style="--accent:${L.color};--soft:${L.soft}">${L.name}: ${formatPercent(st.percent)} (${st.present}/${st.counted})</span>`;
          }).join("")}</div>` : '<span class="muted">—</span>'}</td>
          <td><div class="action-cell">
            <a class="btn btn-sm" href="attendance.html?lang=${s.languages[0] || "german"}&student=${s.uid}">History</a>
            <button class="btn btn-sm" data-edit="${s.uid}" type="button">Edit enrolment</button>
          </div></td>
        </tr>`).join("")}</tbody>
    </table></div>`;
}

$("filter-language").addEventListener("change", render);
$("filter-search").addEventListener("input", render);

/* ----- Register a student ----- */
function regError(message) {
  $("register-error").textContent = message;
  $("register-error").hidden = !message;
}

$("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  regError("");
  const name = $("reg-name").value.trim();
  const email = $("reg-email").value.trim().toLowerCase();
  const password = $("reg-password").value;
  const languages = [...document.querySelectorAll('input[name="reg-lang"]:checked')].map((c) => c.value);

  if (!name) return regError("Please enter the student's name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return regError("Please enter a valid email address.");
  if (password.length < 8) return regError("The temporary password must be at least 8 characters.");
  if (languages.length === 0) return regError("Choose at least one language to enrol the student in.");

  const btn = $("register-btn");
  btn.disabled = true;
  btn.textContent = "Registering…";

  const tempApp = initializeApp(firebaseConfig, "registrar-" + Date.now());
  const tempAuth = getAuth(tempApp);
  let createdUid = null;
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    createdUid = cred.user.uid;
    await setDoc(doc(db, "users", createdUid), {
      name, email, role: "student", languages, createdAt: serverTimestamp()
    });
    showToast(`${name} has been registered.`, "success");
    $("register-form").reset();
    await load();
  } catch (err) {
    console.error(err);
    if (err.code === "auth/email-already-in-use") regError("An account with this email already exists.");
    else if (err.code === "auth/weak-password") regError("That password is too weak. Use at least 8 characters.");
    else if (err.code === "auth/invalid-email") regError("That email address is not valid.");
    else if (createdUid) regError("The login was created but the student's profile could not be saved. Delete that user in the Firebase console (Authentication) and try again.");
    else regError("Could not register the student. Check your connection and try again.");
  } finally {
    try { await signOut(tempAuth); } catch (e2) { /* ignore */ }
    try { await deleteApp(tempApp); } catch (e2) { /* ignore */ }
    btn.disabled = false;
    btn.textContent = "Register student";
  }
});

/* ----- Edit enrolment ----- */
$("students-list").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-edit]");
  if (!btn) return;
  editing = students.find((s) => s.uid === btn.dataset.edit);
  $("edit-name").textContent = `${editing.name} · ${editing.email}`;
  $("edit-languages").innerHTML = checkboxes("edit-lang", editing.languages);
  $("edit-dialog").showModal();
});

$("edit-cancel").addEventListener("click", () => $("edit-dialog").close());

$("edit-save").addEventListener("click", async () => {
  const languages = [...document.querySelectorAll('input[name="edit-lang"]:checked')].map((c) => c.value);
  const btn = $("edit-save");
  btn.disabled = true;
  try {
    await updateDoc(doc(db, "users", editing.uid), { languages });
    editing.languages = languages;
    $("edit-dialog").close();
    showToast("Enrolment updated.", "success");
    render();
  } catch (err) {
    console.error(err);
    showToast("Could not update the enrolment. Please try again.", "error");
  }
  btn.disabled = false;
});

await load();
