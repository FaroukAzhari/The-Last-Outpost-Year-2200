import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const scoreFields = [
  ["readiness", "Outpost Readiness"],
  ["discipline", "Discipline"],
  ["resourcefulness", "Resourcefulness"],
  ["teamwork", "Teamwork"],
  ["humanity", "Humanity"]
];

const days = ["All Days", "Day 1", "Day 2", "Day 3", "Day 4"];

export function IndividualEvaluationHistoryPage() {
  const [summary, setSummary] = useState(null);
  const [dayFilter, setDayFilter] = useState("All Days");
  const [roverFilter, setRoverFilter] = useState("all");

  useEffect(() => {
    api.getIndividualEvaluations().then(setSummary);
  }, []);

  const rovers = useMemo(() => {
    if (!summary) {
      return [];
    }

    return summary.cumulative.map((entry) => entry.rover);
  }, [summary]);

  const rows = useMemo(() => {
    if (!summary) {
      return [];
    }

    return summary.rows
      .filter((row) => dayFilter === "All Days" || row.day === dayFilter)
      .filter((row) => roverFilter === "all" || row.roverId === roverFilter)
      .sort((left, right) => `${left.day}-${left.rover?.displayName}`.localeCompare(`${right.day}-${right.rover?.displayName}`));
  }, [dayFilter, roverFilter, summary]);

  if (!summary) {
    return <div className="notice">Loading individual evaluations...</div>;
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Individual Evaluation History</p>
      <h1>Rover Human Override Records</h1>
      <p className="lead">Read-only daily Rover evaluations based on readiness, discipline, resourcefulness, teamwork, and humanity.</p>

      <div className="filter-bar">
        <label className="field">
          <span>Day</span>
          <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
            {days.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Rover</span>
          <select value={roverFilter} onChange={(event) => setRoverFilter(event.target.value)}>
            <option value="all">All Rovers</option>
            {rovers.map((rover) => (
              <option key={rover.id} value={rover.id}>{rover.displayName}</option>
            ))}
          </select>
        </label>
      </div>

      {rows.length ? (
        <div className="history-grid">
          {rows.map((evaluation) => (
            <article className="history-card" key={evaluation.id}>
              <div className="history-card__header">
                <div>
                  <span>{evaluation.day}</span>
                  <h2>{evaluation.rover?.displayName || evaluation.roverId}</h2>
                  <p>{evaluation.rover?.faction?.name || "Unassigned"} · {evaluation.rover?.roleInfo?.name || "Role pending"}</p>
                </div>
                <strong>{evaluation.total}/100</strong>
              </div>

              <div className="mini-score-grid">
                {scoreFields.map(([field, label]) => (
                  <span key={field}>{label}: {evaluation[field]}/20</span>
                ))}
              </div>

              {evaluation.notes ? (
                <div className="history-block">
                  <strong>Leader Notes</strong>
                  <p>{evaluation.notes}</p>
                </div>
              ) : null}

              {evaluation.growthMission ? (
                <div className="history-block">
                  <strong>Growth Mission</strong>
                  <p>{evaluation.growthMission}</p>
                </div>
              ) : null}

              <small>Updated: {new Date(evaluation.updatedAt).toLocaleString()}</small>
            </article>
          ))}
        </div>
      ) : (
        <article className="info-card">
          <h2>No individual evaluations found</h2>
          <p>Saved Rover evaluations will appear here after a leader records them.</p>
        </article>
      )}
    </section>
  );
}
