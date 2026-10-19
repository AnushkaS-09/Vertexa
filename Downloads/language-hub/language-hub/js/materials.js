import {
  requireUser, renderSidebar, getMaterials, getAllMaterials, materialCardHTML,
  attachMaterialActions, showToast, showFatal, LANGUAGES, LANGUAGE_KEYS, CATEGORIES
} from "./common.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const { profile } = await requireUser(["professor", "student"]);
renderSidebar(profile, "materials");

const isProf = profile.role === "professor";
const $ = (id) => document.getElementById(id);

const visibleLanguages = isProf ? LANGUAGE_KEYS : profile.languages.filter((k) => LANGUAGES[k]);
const params = new URLSearchParams(location.search);
let materials = [];

// Setup filters
$("filter-language").innerHTML = `<option value="">All languages</option>` + visibleLanguages.map((k) => `<option value="${k}">${LANGUAGES[k].name}</option>`).join("");
$("filter-category").innerHTML = `<option value="">All categories</option>` + CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
if (visibleLanguages.includes(params.get("lang"))) $("filter-language").value = params.get("lang");

if (isProf) {
  $("upload").hidden = false;
  $("language").innerHTML = `<option value="">Choose a language</option>` + LANGUAGE_KEYS.map((k) => `<option value="${k}">${LANGUAGES[k].name}</option>`).join("");
  $("category").innerHTML = `<option value="">Choose a category</option>` + CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("");
  if (LANGUAGES[params.get("lang")]) $("language").value = params.get("lang");
  $("page-sub").textContent = "Upload and manage notes, worksheets, assignments and tests for each language.";
} else {
  $("page-sub").textContent = "Notes, worksheets, assignments and tests for the languages you are enrolled in.";
}

async function loadMaterials() {
  try {
    materials = isProf ? await getAllMaterials() : (visibleLanguages.length ? await getMaterials(visibleLanguages) : []);
  } catch (err) {
    console.error(err);
    showFatal("Could not load materials. Check your connection and the Firebase setup, then refresh.");
    return;
  }
  render();
}

function render() {
  const lang = $("filter-language").value;
  const cat = $("filter-category").value;
  const text = $("filter-search").value.trim().toLowerCase();
  const list = materials.filter((m) =>
    (!lang || m.language === lang) &&
    (!cat || m.category === cat) &&
    (!text || m.title.toLowerCase().includes(text))
  );

  const box = $("materials-list");
  if (list.length) {
    box.innerHTML = list.map((m) => materialCardHTML(m, { canDelete: isProf })).join("");
  } else if (!isProf && !visibleLanguages.length) {
    box.innerHTML = `<div class="card empty" style="grid-column:1/-1"><h3>You are not enrolled in a language yet</h3></div>`;
  } else if (!materials.length) {
    box.innerHTML = `<div class="card empty" style="grid-column:1/-1"><h3>No materials yet</h3></div>`;
  } else {
    box.innerHTML = `<div class="card empty" style="grid-column:1/-1"><h3>No matching materials</h3></div>`;
  }
}

["filter-language", "filter-category"].forEach((id) => $(id).addEventListener("change", render));
$("filter-search").addEventListener("input", render);
attachMaterialActions($("materials-list"), () => materials, (gone) => {
  materials = materials.filter((m) => m.id !== gone.id);
  render();
});

function uploadError(message) {
  $("upload-error").textContent = message;
  $("upload-error").hidden = !message;
}

if (isProf) {
  $("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadError("");

    const title = $("title").value.trim();
    const description = $("description").value.trim();
    const language = $("language").value;
    const category = $("category").value;
    const deadline = $("deadline") ? $("deadline").value : "";
    const link = $("material-url").value.trim();

    if (!title) return uploadError("Please enter a title.");
    if (!language) return uploadError("Please choose a language.");
    if (!category) return uploadError("Please choose a category.");
    if (!link) return uploadError("Please enter a valid document link.");

    const btn = $("upload-btn");
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      const data = {
        title,
        description,
        language,
        category,
        downloadURL: link,
        fileName: title + " (Link)",
        fileType: "application/pdf",
        uploadedAt: serverTimestamp(),
        uploadedBy: profile.uid
      };

      if (deadline) data.deadline = deadline;

      await addDoc(collection(db, "materials"), data);
      showToast("Material link added successfully!", "success");

      $("upload-form").reset();
      if (LANGUAGES[params.get("lang")]) $("language").value = params.get("lang");
      await loadMaterials();

      btn.disabled = false;
      btn.textContent = "Upload";
    } catch (err) {
      console.error(err);
      uploadError("Could not save material link: " + err.message);
      btn.disabled = false;
      btn.textContent = "Upload";
    }
  });
}

loadMaterials();