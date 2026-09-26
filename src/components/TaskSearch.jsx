import { useState } from "react";

export default function TaskSearch({ onSearch }) {
  const [query, setQuery] = useState("");

  function submit() {
    onSearch(query);
  }

  return (
    <div className="searchBox">
      <input
        placeholder="What government task are you trying to complete?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button onClick={submit}>Find My Steps</button>
    </div>
  );
}
