export default function TaskQuestions({ questions, answers, onAnswer, onSubmit }) {
  return (
    <div className="qCard">
      <h3>A couple of quick questions</h3>
      {questions.map((q) => (
        <div key={q.id} className="qRow">
          <label>{q.prompt}</label>
          <div className="qOpts">
            {q.options.map(([value, label]) => (
              <button
                key={value}
                className={"qOpt" + (answers[q.id] === value ? " active" : "")}
                onClick={() => onAnswer(q.id, value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="contBtn" onClick={onSubmit}>
        Build My Roadmap
      </button>
    </div>
  );
}
