import { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Home from "./components/Home.jsx";
import TaskQuestions from "./components/TaskQuestions.jsx";
import TaskSummary from "./components/TaskSummary.jsx";
import ProgressBar from "./components/ProgressBar.jsx";
import Legend from "./components/Legend.jsx";
import TaskGraph from "./components/TaskGraph.jsx";
import StepDetails from "./components/StepDetails.jsx";
import { tasks, findTaskKey } from "./data/tasks.js";
import { statusOf } from "./utils/graph.js";

export default function App() {
  const [page, setPage] = useState("home"); // home | notfound | result
  const [taskKey, setTaskKey] = useState(null);
  const [answers, setAnswers] = useState({});
  const [answered, setAnswered] = useState(false);
  const [completed, setCompleted] = useState(() => new Set());
  const [selectedId, setSelectedId] = useState(null);

  function openTask(key) {
    setTaskKey(key);
    setAnswers({});
    setAnswered(tasks[key].questions.length === 0);
    setCompleted(new Set());
    setSelectedId(null);
    setPage("result");
  }

  function handleSearch(query) {
    const key = findTaskKey(query);
    if (!key) {
      setPage("notfound");
      return;
    }
    openTask(key);
  }

  function goHome(section) {
    setPage("home");
    if (section && section !== "home") {
      // Scroll to the How It Works / About section after the home page renders.
      setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }

  const task = taskKey ? tasks[taskKey] : null;
  const steps = task && answered ? task.buildSteps(answers) : [];
  const selectedStep = steps.find((s) => s.id === selectedId) || null;

  function markComplete() {
    if (!selectedStep) return;
    setCompleted((prev) => new Set(prev).add(selectedStep.id));
  }

  return (
    <>
      <Navbar onNavigate={goHome} />
      <div className="wrap">
        {page === "home" && (
          <Home
            exampleKeys={Object.keys(tasks)}
            taskLabel={(key) => tasks[key].label}
            onSearch={handleSearch}
            onPickExample={openTask}
          />
        )}

        {page === "notfound" && (
          <>
            <button className="backBtn" onClick={() => setPage("home")}>
              ← Back
            </button>
            <div className="notice">
              We need a little more information to build your roadmap. Try one of the example tasks, or
              rephrase with the task, location, and category (e.g. "register a business", "driving licence").
            </div>
            <div className="examples" style={{ marginTop: 14 }}>
              {Object.keys(tasks).map((key) => (
                <span key={key} className="exChip" onClick={() => openTask(key)}>
                  {tasks[key].label}
                </span>
              ))}
            </div>
          </>
        )}

        {page === "result" && task && (
          <>
            <button className="backBtn" onClick={() => setPage("home")}>
              ← New Search
            </button>

            {!answered && (
              <TaskQuestions
                questions={task.questions}
                answers={answers}
                onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
                onSubmit={() => setAnswered(true)}
              />
            )}

            {answered && (
              <>
                <TaskSummary task={task} />
                <ProgressBar steps={steps} completed={completed} />
                <Legend />
                <TaskGraph steps={steps} completed={completed} selectedId={selectedId} onSelect={setSelectedId} />
                <StepDetails
                  step={selectedStep}
                  status={selectedStep ? statusOf(selectedStep, completed) : null}
                  onComplete={markComplete}
                />
              </>
            )}
          </>
        )}

        <footer>
          Sources are linked to official government domains where identifiable. Fees, timelines and exact
          requirements change — always confirm on the official source before relying on this roadmap. This is
          not legal advice.
        </footer>
      </div>
    </>
  );
}
