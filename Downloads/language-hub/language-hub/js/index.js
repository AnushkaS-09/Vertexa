// index.js — sends visitors to the login page or to the right dashboard.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { homeFor } from "./common.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.replace("login.html");
    return;
  }
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    location.replace(snap.exists() ? homeFor(snap.data().role) : "login.html");
  } catch (err) {
    location.replace("login.html");
  }
});
