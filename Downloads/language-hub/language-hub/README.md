# Language Hub — setup guide

A language-class management site for one professor (German, Spanish, Japanese) and their students.
Plain HTML + CSS + JavaScript, with Firebase Authentication, Cloud Firestore and Cloud Storage.
No build step and no frameworks.

> The site only works once you connect it to **your own Firebase project**. Until you do that, the login page shows a "Firebase is not configured yet" warning and nothing can be saved.

## What's in the folder

```
language-hub/
├── index.html                 redirects to login or the right dashboard
├── login.html
├── professor-dashboard.html
├── student-dashboard.html
├── language.html              language chooser, and details page (?lang=german)
├── attendance.html
├── materials.html
├── students.html              professor only
├── profile.html
├── css/                       base.css (shared) + one CSS file per page
├── js/                        firebase-config.js, common.js (shared helpers) + one JS file per page
├── firestore.rules            Firestore security rules
├── storage.rules              Storage security rules
├── firebase.json              only needed if you deploy rules with the Firebase CLI
└── cors.json                  optional, for direct file downloads (step 8)
```

## Data model

| Where | Contents |
|---|---|
| Firestore `users/{uid}` | `name`, `email`, `role` (`"professor"` or `"student"`), `languages` (array such as `["german","japanese"]`), `createdAt` |
| Firestore `attendance/{language}_{studentUid}_{YYYY-MM-DD}` | `studentId`, `language`, `date`, `status` (`present` / `absent` / `leave`), `markedBy`, `updatedAt` |
| Firestore `materials/{autoId}` | `title`, `description`, `language`, `category`, `fileName`, `fileType`, `fileSize`, `storagePath`, `downloadURL`, `uploadedAt`, `uploadedBy`, optional `deadline` (`YYYY-MM-DD`) |
| Storage `materials/{language}/{timestamp}_{filename}` | The uploaded files |

The attendance document ID is built from language + student + date. That is how duplicates are prevented: saving the same student on the same date again edits the same record. The security rules also check that the ID matches.

You do not need to create these collections by hand (except the first professor profile, step 5). Firestore creates them when the app first writes to them.

## Setup

### 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Give it a name (for example `language-hub`). Google Analytics is not needed.

### 2. Register a web app and copy the config
1. In the project, click the **`</>` (Web)** icon on the project overview page and register an app.
2. Firebase shows a `firebaseConfig` object. Open **`js/firebase-config.js`** and replace these six values with yours:

| Value in the file | Where to find it |
|---|---|
| `apiKey` | `firebaseConfig.apiKey` |
| `authDomain` | `firebaseConfig.authDomain` |
| `projectId` | `firebaseConfig.projectId` |
| `storageBucket` | `firebaseConfig.storageBucket` (shown after Storage is created, or in Project settings) |
| `messagingSenderId` | `firebaseConfig.messagingSenderId` |
| `appId` | `firebaseConfig.appId` |

These values identify your project; they are not secrets. What protects the data is the security rules (step 6) and the login.

### 3. Turn on Authentication
**Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**

### 4. Create Firestore and Storage
- **Build → Firestore Database → Create database.** Pick a location and start in **production mode** (the rules in step 6 replace the defaults).
- **Build → Storage → Get started.** Use the same location.
  Firebase may ask you to upgrade the project to the pay-as-you-go (Blaze) plan before it creates a Storage bucket. Check the current terms in the console; there is a free monthly usage allowance, and a class-sized project normally stays well inside it, but that is for you to confirm.

### 5. Create the professor account (done once, by you)
The professor account is **not** created from the website. That is deliberate: if the site could create professors, anyone could make themselves one.

1. **Authentication → Users → Add user.** Enter the professor's email and a strong password.
2. Copy the new user's **User UID**.
3. **Firestore Database → Start collection**, collection ID `users`.
   Document ID: **paste the UID**. Add these fields:

| Field | Type | Value |
|---|---|---|
| `name` | string | the professor's name |
| `email` | string | the professor's email |
| `role` | string | `professor` |
| `languages` | array | leave empty |
| `createdAt` | timestamp | now |

Only someone with access to your Firebase console can do this, which is what makes it secure.

### 6. Deploy the security rules
Easiest way (copy and paste):
- **Firestore Database → Rules** → paste the contents of `firestore.rules` → **Publish**.
- **Storage → Rules** → paste the contents of `storage.rules` → **Publish**. The Storage rules look up the user's role in Firestore, so the console may ask you to allow cross-service access; accept it.

Alternative with the Firebase CLI (`npm install -g firebase-tools`):
```
firebase login
firebase use --add          # choose your project
firebase deploy --only firestore:rules,storage
```

### 7. Run it locally
The site uses JavaScript modules, which browsers will not load from a `file://` address, so serve the folder:
```
cd language-hub
python3 -m http.server 8000
```
then open <http://localhost:8000>. (In VS Code, the "Live Server" extension also works.) `localhost` is already an authorised domain for Firebase Auth. When you host it somewhere else, add that domain under **Authentication → Settings → Authorized domains**.

### 8. Optional: CORS, so "Download" saves the file directly
Without this, **Download** opens the file in a new tab instead (the file still opens fine). To enable direct downloads, install the Google Cloud CLI and run, using your bucket name from `storageBucket`:
```
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
```

## Creating test accounts
1. Sign in as the professor (step 5).
2. Open **Students → Register a new student**, fill in a name, email, temporary password (8+ characters) and tick one or more languages. Repeat for a couple of test students.
3. Mark attendance and upload a file as the professor, then sign out and sign in as a student to see their view.

There is no built-in sample data, so nothing on screen is faked: everything you see comes from your Firebase project.

## How students are registered and enrolled
- Only the professor registers students (Students page). The site creates the login with Firebase Authentication and saves a profile with `role: "student"` and the chosen languages.
- The professor can change a student's languages later with **Edit enrolment**.
- Students sign in with the email and temporary password they were given and can reset it with **Forgot your password?** or the Profile page.
- There is no public sign-up page, so strangers cannot create accounts.

## How security works
- **Roles** come from `users/{uid}.role` in Firestore, never from the browser. The rules only allow creating profiles with `role == "student"` and only allow changing a student's `languages`, so a student cannot make themselves a professor.
- **Attendance:** only the professor can create, edit or delete records. A student can read only records whose `studentId` is their own UID.
- **Materials:** only the professor can create, edit or delete them. A student can read only materials for languages they are enrolled in, both in Firestore and in Storage.
- **Storage uploads:** professor only, PDF/Word/PowerPoint/Excel/TXT/PNG/JPG/MP3, up to 20 MB.
- Hiding buttons in the page is only for convenience; the rules above are what actually enforce access.
- No passwords or secret keys are stored in the code.

Things to know:
- Each file has a download link that contains a long random token. Anyone who has that exact link can open the file, but the links are only stored in Firestore, which students can read only for their own languages. Treat the links like private links.
- Deleting a student's login must be done in the Firebase console (**Authentication**), because the browser is not allowed to delete other users' accounts. Remove their `users/{uid}` document there too.
- Registering a student uses a short-lived second Firebase app inside the page so the professor is not signed out. See the comment at the top of `js/students.js`.

## Attendance maths
`Attendance % = Present ÷ (Present + Absent) × 100`, worked out separately per language.
- Leave records are shown but are not part of the percentage.
- A class date only counts if a record exists for that student. Dates with no record never count.
- If there are no Present/Absent records yet, the site shows "No attendance recorded yet" instead of a percentage.

## Explaining it in a presentation
- **common.js** is the heart of the app: the login check (`requireUser`), the sidebar, and the attendance maths all live there.
- Every page follows the same three steps: check who is logged in → load data from Firestore → draw it into the page.
- The three Firebase services map to three jobs: **Auth** = who you are, **Firestore** = the records (users, attendance, file details), **Storage** = the files themselves.
