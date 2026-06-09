import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LEADER_PASSWORD = "close-the-gate";

export function LeaderLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    if (password !== LEADER_PASSWORD) {
      setError("Access denied.");
      return;
    }

    localStorage.setItem("havenwood-leader-auth", "true");
    navigate("/leader");
  }

  return (
    <section className="stack">
      <article className="panel narrow-panel">
        <p className="eyebrow">Leader Console</p>
        <h2>Authenticate</h2>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="close-the-gate"
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button className="button danger" type="submit">Open Leader Dashboard</button>
        </form>
      </article>
    </section>
  );
}
