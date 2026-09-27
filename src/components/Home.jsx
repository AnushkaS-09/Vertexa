import TaskSearch from "./TaskSearch.jsx";

const HOW_IT_WORKS = [
  "Describe your task",
  "Answer a few questions",
  "See your personalized roadmap",
  "Follow dependencies",
  "Open official government sources",
  "Track your progress"
];

export default function Home({ exampleKeys, taskLabel, onSearch, onPickExample }) {
  return (
    <>
      <div className="hero">
        <h1>Navigate government tasks without the confusion.</h1>
        <p>Turn complicated government procedures into a clear, step-by-step roadmap.</p>
        <TaskSearch onSearch={onSearch} />
        <div className="examples">
          {exampleKeys.map((key) => (
            <span key={key} className="exChip" onClick={() => onPickExample(key)}>
              {taskLabel(key)}
            </span>
          ))}
        </div>
      </div>

      <div className="section" id="how">
        <h2>How It Works</h2>
        <div className="howGrid">
          {HOW_IT_WORKS.map((text, i) => (
            <div key={text} className="howCard">
              <div className="n">STEP {i + 1}</div>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <p className="finePrint">
          This tool organizes publicly available information to help you plan. It is not a replacement for
          official government instructions and is not legal advice.
        </p>
      </div>

      <div className="section" id="about">
        <h2>About</h2>
        <p className="finePrint">
          Civic Task Navigator maps citizen tasks to the regulatory steps, dependencies, and official sources
          involved, so you always know what comes next and where to go for the real requirements.
        </p>
      </div>
    </>
  );
}
