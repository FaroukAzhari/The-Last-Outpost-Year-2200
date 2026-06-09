import { useState } from "react";
import { useNavigate } from "react-router-dom";

const crewCodes = {
  SIGNAL: "signalers",
  LIGHT: "lanterns",
  GATE: "gatekeepers",
  TRACK: "trackers"
};

export function CrewAccessPage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    const crewId = crewCodes[normalizedCode];

    if (!crewId) {
      setError("Signal rejected. Check the crew access code.");
      return;
    }

    setError("");
    navigate(`/crew/${crewId}`);
  }

  return (
    <section className="stack">
      <article className="panel narrow-panel">
        <p className="eyebrow">Crew Authentication</p>
        <h2>Enter Access Code</h2>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Crew Code</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="SIGNAL / LIGHT / GATE / TRACK"
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button" type="submit">Open Dashboard</button>
        </form>
      </article>
    </section>
  );
}
