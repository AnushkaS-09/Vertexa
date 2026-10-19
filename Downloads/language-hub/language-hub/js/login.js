// login.js — sign in, create an account, validate the form, redirect by role.
import { auth, db, isConfigured } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { homeFor } from "./common.js";

const $ = (id) => document.getElementById(id);
const form = $("login-form");
const emailInput = $("email");
const passwordInput = $("password");
const confirmInput = $("confirm-password");
const nameInput = $("name");
const submitBtn = $("login-btn");
const formAlert = $("form-alert");

let mode = "login"; // "login" or "signup"

if (!isConfigured) $("config-alert").hidden = false;

// Keep users signed in after the browser is closed (this is Firebase's default,
// set explicitly here so the behaviour is clear). Accounts themselves live in
// Firebase Authentication, so they also survive logging out.
try { await setPersistence(auth, browserLocalPersistence); } catch (err) { console.error(err); }

const reason = new URLSearchParams(location.search).get("reason");
if (reason === "noprofile") {
  showAlert("Your account exists but has no Language Hub profile yet. Please contact your professor.");
}

/* ---------- Small helpers ---------- */

function showAlert(message, kind = "error") {
  formAlert.textContent = message;
  formAlert.className = "alert alert-" + kind;
  formAlert.hidden = false;
}

function setError(id, message) {
  $(id).textContent = message;
}

function clearErrors() {
  formAlert.hidden = true;
  ["name-error", "email-error", "password-error", "confirm-error"].forEach((id) => setError(id, ""));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setBusy(busy, label) {
  submitBtn.disabled = busy;
  submitBtn.textContent = busy ? label : (mode === "signup" ? "Create account" : "Sign in");
}

/* ---------- Switch between "Sign in" and "Create account" ---------- */

function setMode(next) {
  mode = next;
  clearErrors();
  const signup = mode === "signup";
  $("name-field").hidden = !signup;
  $("confirm-field").hidden = !signup;
  $("forgot-btn").hidden = signup;
  $("form-title").textContent = signup ? "Create your account" : "Sign in";
  $("form-intro").textContent = signup
    ? "New accounts start as student accounts. Your professor will enrol you in your language course(s) afterwards."
    : "Sign in with the email and password you registered with.";
  $("mode-btn").textContent = signup ? "Already have an account? Sign in" : "New here? Create an account";
  passwordInput.autocomplete = signup ? "new-password" : "current-password";
  submitBtn.textContent = signup ? "Create account" : "Sign in";
}

$("mode-btn").addEventListener("click", () => setMode(mode === "login" ? "signup" : "login"));

$("show-password").addEventListener("change", (e) => {
  const type = e.target.checked ? "text" : "password";
  passwordInput.type = type;
  confirmInput.type = type;
});

/* ---------- Friendly error messages ---------- */

function loginError(err) {
  switch (err.code) {
    case "auth/user-not-found":
      return "No account exists for this email. Check the spelling or choose “Create an account”.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again or use “Forgot your password?”.";
    case "auth/invalid-credential":
      // Firebase returns this single code for both "no such account" and "wrong password"
      // when email-enumeration protection is on (the default for new projects).
      return "Incorrect email or password. If you do not have an account yet, choose “Create an account”.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact your professor.";
    default:
      return "Could not sign in. Please try again.";
  }
}

function signupError(err) {
  switch (err.code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Choose “Sign in” instead.";
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/weak-password":
      return "That password is too weak. Use at least 8 characters.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in is not enabled in your Firebase project (Authentication → Sign-in method).";
    case "auth/network-request-failed":
      return "Network problem. Check your internet connection and try again.";
    default:
      return "Could not create the account. Please try again.";
  }
}

/* ---------- Already signed in? Skip the form ---------- */

if (isConfigured) {
  onAuthStateChanged(auth, async (user) => {
    if (!user || reason) return;
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) location.replace(homeFor(snap.data().role));
    } catch (err) { /* stay on the login page */ }
  });
}

/* ---------- Submit: sign in or create account ---------- */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  const signup = mode === "signup";

  let ok = true;
  if (signup && !name) { setError("name-error", "Enter your full name."); ok = false; }
  if (!validEmail(email)) { setError("email-error", "Enter a valid email address."); ok = false; }
  if (signup) {
    if (password.length < 8) { setError("password-error", "Password must be at least 8 characters."); ok = false; }
    else if (password !== confirm) { setError("confirm-error", "The two passwords do not match."); ok = false; }
  } else if (password.length < 6) {
    setError("password-error", "Password must be at least 6 characters."); ok = false;
  }
  if (!ok) return;
  if (!isConfigured) { showAlert("Firebase is not configured yet. See README.md, step 1."); return; }

  if (signup) await createAccount(name, email, password);
  else await signIn(email, password);
});

async function signIn(email, password) {
  setBusy(true, "Signing in…");
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists()) {
      await signOut(auth);
      showAlert("Your account has no Language Hub profile yet. Please contact your professor.");
    } else {
      location.replace(homeFor(snap.data().role));
      return;
    }
  } catch (err) {
    console.error(err);
    showAlert(loginError(err));
  }
  setBusy(false);
}

async function createAccount(name, email, password) {
  setBusy(true, "Creating account…");
  let cred = null;
  try {
    // 1. Create the login in Firebase Authentication.
    cred = await createUserWithEmailAndPassword(auth, email, password);

    // 2. Save the profile. Self-registered accounts are always students with no languages;
    //    the security rules enforce this, so nobody can make themselves a professor.
    await setDoc(doc(db, "users", cred.user.uid), {
      name,
      email,
      role: "student",
      languages: [],
      createdAt: serverTimestamp()
    });

    location.replace(homeFor("student"));
    return;
  } catch (err) {
    console.error(err);
    if (cred) {
      // The login was created but the profile could not be saved: remove the login so the
      // person can simply try again instead of being stuck with a half-made account.
      try { await cred.user.delete(); } catch (e2) { try { await signOut(auth); } catch (e3) { /* ignore */ } }
      showAlert("Your account could not be completed (the profile could not be saved). Please try again. If it keeps failing, check that the latest firestore.rules are published.");
    } else {
      showAlert(signupError(err));
    }
  }
  setBusy(false);
}

/* ---------- Forgot password ---------- */

$("forgot-btn").addEventListener("click", async () => {
  clearErrors();
  const email = emailInput.value.trim();
  if (!validEmail(email)) {
    setError("email-error", "Enter your email above first, then click “Forgot your password?”.");
    return;
  }
  if (!isConfigured) { showAlert("Firebase is not configured yet. See README.md, step 1."); return; }
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    console.error(err);
    if (err.code === "auth/network-request-failed") { showAlert(loginError(err)); return; }
  }
  // Same message either way, so the page does not reveal which emails have accounts.
  showAlert("If an account exists for that email, a password reset link has been sent.", "ok");
});