import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const scoreFields = [
  ["survivalSkill", "Survival Skill"],
  ["security", "Security"],
  ["resources", "Resources"],
  ["morale", "Morale"],
  ["humanity", "Humanity"]
];

const days = ["All Days", "Day 1", "Day 2", "Day 3", "Day 4"];

export function EvaluationHistoryPage() {
  const [summary, setSummary] = useState(null);
  const [dayFilter, setDayFilter] = useState("All Days");
  const [factionFilter, setFactionFilter] = useState("all");

  useEffect(() => {
    api.getEvaluations().then(setSummary);
  }, []);

  const factions = useMemo(() => {
    if (!summary) {
      return [];
    }

    return summary.cumulative.map((entry) => entry.faction);
  }, [summary]);

  const rows = useMemo(() => {
    if (!summary) {
      return [];
    }

    return summary.rows
      .filter((row) => dayFilter === "All Days" || row.day === dayFilter)
      .filter((row) => factionFilter === "all" || row.factionId === factionFilter)
      .sort((left, right) => `${left.day}-${left.factionId}`.localeCompare(`${right.day}-${right.factionId}`));
  }, [dayFilter, factionFilter, summary]);

  if (!summary) {
    return <div className="notice">Loading evaluation history...</div>;
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Evaluation History</p>
      <h1>Saved Human Override Records</h1>
      <p className="lead">Read-only history of saved daily evaluations, breach alerts, repair missions, notes, and totals.</p>

      <div className="filter-bar">
        <label className="field">
          <span>Day</span>
          <select value={dayFilter} onChange={(event) => setDayFilter(event.target.value)}>
            {days.map((day) => <option key={day} value={day}>{day}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Faction</span>
          <select value={factionFilter} onChange={(event) => setFactionFilter(event.target.value)}>
            <option value="all">All Factions</option>
            {factions.map((faction) => (
              <option key={faction.id} value={faction.id}>{faction.name}</option>
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
                  <h2>{evaluation.faction?.name || evaluation.factionId}</h2>
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

              {evaluation.breachAlerts?.length ? (
                <div className="history-block">
                  <strong>Breach Alerts</strong>
                  <p>{evaluation.breachAlerts.join(", ")}</p>
                </div>
              ) : null}

              {evaluation.repairMissions?.length ? (
                <div className="history-block">
                  <strong>Repair Missions</strong>
                  <p>{evaluation.repairMissions.join(", ")}</p>
                </div>
              ) : null}

              <small>Updated: {new Date(evaluation.updatedAt).toLocaleString()}</small>
            </article>
          ))}
        </div>
      ) : (
        <article className="info-card">
          <h2>No saved evaluations found</h2>
          <p>Saved evaluations will appear here after a leader records scores for a faction and day.</p>
        </article>
      )}
    </section>
  );
}
