# Civic Task Navigator

A React app that turns a citizen's government task into a visual dependency
graph of steps — with mandatory/conditional/informational labeling, locked/
ready/completed status, progress tracking, and links to official sources.

## Running it locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

To build a production bundle:

```bash
npm run build
npm run preview
```

## Project structure

```
src/
  data/tasks.js         Task + step data, kept separate from the UI
  utils/graph.js         Dependency-graph layout + status logic
  components/
    Navbar.jsx
    Home.jsx            Hero, search, examples, How It Works, About
    TaskSearch.jsx
    TaskQuestions.jsx    Clarifying questions before building a roadmap
    TaskSummary.jsx
    ProgressBar.jsx
    Legend.jsx
    TaskGraph.jsx        SVG connectors + StepCard nodes
    StepCard.jsx         A single node in the graph
    StepDetails.jsx      Detail panel for the selected step
  App.jsx                Top-level state and page routing
  App.css                Blue-and-white civic-tech styling
```

Plain `useState` is used throughout — no Redux or other state library.

## Included demo tasks

- **Open a Cloud Kitchen (Mumbai)** — the most detailed example, with
  clarifying questions (business structure, premises) that change which
  steps apply.
- Register a Small Business
- Apply for a Driving Licence
- Obtain a Birth Certificate

These are curated sample datasets, not a live feed from government sites.
Fields are marked `"Verification required"` wherever an exact fee, timeline,
or requirement could not be confirmed — always check the linked official
source before relying on this roadmap. This is not legal advice.

## Future architecture

The data layer (`src/data/tasks.js`) is deliberately separate from every
component. To connect a real backend later, replace `findTaskKey` and
`buildSteps()` with calls to an API that implements:

```
user task → task classification → government source discovery
→ information extraction → requirement verification
→ dependency generation → JSON matching the current step shape
```

No component would need to change — they all just consume the `steps` array
that's returned today by `task.buildSteps(answers)`.
