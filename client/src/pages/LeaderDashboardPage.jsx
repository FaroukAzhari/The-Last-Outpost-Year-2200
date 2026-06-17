import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export function LeaderDashboardPage() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.getReports().then(setReport);
  }, []);

  if (!report) {
    return <div className="notice">Loading Outpost Command...</div>;
  }

  const wardens = report.factions.find((faction) => faction.id === "wardens");
  const foragers = report.factions.find((faction) => faction.id === "foragers");

  return (
    <section className="page-section">
      <p className="eyebrow">Leader Dashboard</p>
      <h1>Outpost Command</h1>
      <div className="stats-grid">
        <article><span>Total Rovers</span><strong>{report.totalRovers}</strong></article>
        <article><span>Unassigned</span><strong>{report.unassignedRovers}</strong></article>
        <article><span>Wardens</span><strong>{wardens?.memberCount ?? 0}/5</strong></article>
        <article><span>Foragers</span><strong>{foragers?.memberCount ?? 0}/5</strong></article>
      </div>
      <div className="quick-grid">
        <Link className="quick-link" to="/leader/rovers">Manage Rovers</Link>
        <Link className="quick-link" to="/leader/rovers">Assign Factions</Link>
        <Link className="quick-link" to="/leader/rovers">Assign Roles</Link>
        <Link className="quick-link" to="/leader/evaluations">Evaluation Board</Link>
        <Link className="quick-link" to="/leader/individual-evaluations">Individual Evaluations</Link>
        <Link className="quick-link" to="/leader/blueprint">Outpost Blueprint</Link>
        <Link className="quick-link" to="/evaluation-history">Evaluation History</Link>
        <Link className="quick-link" to="/individual-evaluation-history">Rover Evaluation History</Link>
        <Link className="quick-link" to="/rules">Survival Laws</Link>
        <Link className="quick-link" to="/briefing">Backstory</Link>
      </div>
    </section>
  );
}
