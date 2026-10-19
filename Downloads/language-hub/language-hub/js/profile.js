// profile.js — shows the logged-in user's details (both roles)
import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { requireUser, renderSidebar, languageBadgeHTML, formatDate, showToast } from "./common.js";

const { profile } = await requireUser(["professor", "student"]);
renderSidebar(profile, "profile");
const $ = (id) => document.getElementById(id);

$("avatar").textContent = (profile.name || "?").trim().charAt(0).toUpperCase();
$("p-name").textContent = profile.name;
$("p-email").textContent = profile.email;
$("p-role").textContent = profile.role === "professor" ? "Professor" : "Student";
$("p-since").textContent = profile.createdAt ? formatDate(profile.createdAt) : "—";

if (profile.role === "professor") {
  $("p-languages").innerHTML = `<span class="muted">German, Spanish and Japanese (all courses)</span>`;
} else {
  $("p-languages").innerHTML = profile.languages.length
    ? profile.languages.map(languageBadgeHTML).join("")
    : `<span class="muted">Not enrolled in a language yet</span>`;
}

$("reset-btn").addEventListener("click", async () => {
  const btn = $("reset-btn");
  btn.disabled = true;
  try {
    await sendPasswordResetEmail(auth, profile.email);
    showToast("Password reset email sent. Check your inbox.", "success");
  } catch (err) {
    console.error(err);
    showToast("Could not send the email. Please try again later.", "error");
  }
  btn.disabled = false;
});
