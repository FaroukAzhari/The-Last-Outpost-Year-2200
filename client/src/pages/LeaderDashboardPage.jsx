import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export function LeaderDashboardPage() {
  const [crews, setCrews] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function refreshCrews() {
    api.getCrews()
      .then(setCrews)
      .catch((requestError) => setError(requestError.message));
  }

  useEffect(() => {
    refreshCrews();
  }, []);

  async function mutateCrew(action) {
    try {
      await action();
      refreshCrews();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function updateDraft(id, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [id]: {
        ...(currentDrafts[id] ?? {}),
        [field]: value
      }
    }));
  }

  return (
    <section className="stack">
      <article className="panel">
        <div className="split-header">
          <div>
            <p className="eyebrow">Admin Overview</p>
            <h2>Leader Dashboard</h2>
          </div>
          <div className="button-row">
            <Link className="button secondary" to="/leader/evaluations">Member Evaluations</Link>
            <Link className="button secondary" to="/leader/reports">Reports & Awards</Link>
            <button
              className="button danger"
              onClick={() => {
                localStorage.removeItem("havenwood-leader-auth");
                navigate("/leader-login");
              }}
              type="button"
            >
              Log Out
            </button>
          </div>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </article>

      <div className="crew-card-grid">
        {crews.map((crew) => (
          <article key={crew.id} className="panel crew-card">
            <p className="eyebrow">{crew.code}</p>
            <h3>{crew.name}</h3>
            <p>{crew.description}</p>
            <div className="inline-stats">
              <span>Light: {crew.lightTokens}</span>
              <span>Shadow: {crew.shadowMarks}</span>
              <span>Mission: {crew.missionScore}</span>
              <span>Recovery: {crew.recoveryBonus}</span>
              <span>Gate: {crew.gateStabilityLevel}</span>
              <span>Total: {crew.totalScore}</span>
            </div>
            <div className="button-row">
              <button className="button" onClick={() => mutateCrew(() => api.updateCrewLight(crew.id, 1))} type="button">+ Light</button>
              <button className="button secondary" onClick={() => mutateCrew(() => api.updateCrewLight(crew.id, -1))} type="button">- Light</button>
              <button className="button danger" onClick={() => mutateCrew(() => api.updateCrewShadow(crew.id, 1))} type="button">+ Shadow</button>
              <button className="button secondary" onClick={() => mutateCrew(() => api.updateCrewShadow(crew.id, -1))} type="button">- Shadow</button>
            </div>
            <div className="stack compact">
              <label className="field">
                <span>Recovery Bonus</span>
                <input
                  type="number"
                  value={drafts[crew.id]?.recoveryBonus ?? ""}
                  onChange={(event) => updateDraft(crew.id, "recoveryBonus", event.target.value)}
                />
              </label>
              <button
                className="button"
                onClick={() => mutateCrew(() => api.updateCrewRecovery(crew.id, Number(drafts[crew.id]?.recoveryBonus || 0)))}
                type="button"
              >
                Add Recovery Bonus
              </button>
              <label className="field">
                <span>Leader Note</span>
                <textarea
                  rows="3"
                  value={drafts[crew.id]?.note ?? crew.leaderNote ?? ""}
                  onChange={(event) => updateDraft(crew.id, "note", event.target.value)}
                />
              </label>
              <button
                className="button secondary"
                onClick={() => mutateCrew(() => api.updateCrewNote(crew.id, drafts[crew.id]?.note ?? ""))}
                type="button"
              >
                Save Leader Note
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
