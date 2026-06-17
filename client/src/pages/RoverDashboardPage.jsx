import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getSession, setSession } from "../session";

export function RoverDashboardPage() {
  const session = getSession();
  const [rover, setRover] = useState(null);

  useEffect(() => {
    api.getRover(session.id).then((payload) => {
      setRover(payload);
      setSession({ ...session, ...payload });
    });
  }, [session.id]);

  if (!rover) {
    return <div className="notice">Loading Rover profile...</div>;
  }

  return (
    <section className="page-section">
      <p className="eyebrow">Rover Dashboard</p>
      <h1>Welcome, {rover.displayName}</h1>
      <div className="content-grid">
        <article className="info-card">
          <h2>{rover.faction ? rover.faction.name : "Awaiting assignment by Outpost Command."}</h2>
          <p>{rover.faction ? rover.faction.motto : "A leader will assign your faction and role before camp operations begin."}</p>
        </article>
        <article className="info-card">
          <h2>{rover.roleInfo ? rover.roleInfo.name : "Role Pending"}</h2>
          <p>{rover.roleInfo ? rover.roleInfo.description : "Roles rotate daily during the real camp and cannot be edited by Rovers."}</p>
        </article>
      </div>
      <div className="quick-grid">
        <Link className="quick-link" to="/rules">Survival Laws</Link>
        <Link className="quick-link" to="/briefing">A.R.K. Briefing</Link>
        <Link className="quick-link" to="/evaluation-system">Human Override Index</Link>
        <Link className="quick-link" to="/scoreboard">Faction Board</Link>
        <Link className="quick-link" to="/evaluation-history">Evaluation History</Link>
        <Link className="quick-link" to="/individual-evaluation-history">Rover Evaluation History</Link>
        <Link className="quick-link" to="/outpost-blueprint">Outpost Blueprint</Link>
        <Link className="quick-link" to="/missions">Daily Missions</Link>
      </div>
    </section>
  );
}
