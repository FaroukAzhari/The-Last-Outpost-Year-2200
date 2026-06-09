import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { StatGrid } from "../components/StatGrid";
import { MissionCard } from "../components/MissionCard";

export function CrewDashboardPage() {
  const { crewId } = useParams();
  const [crew, setCrew] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getCrew(crewId)
      .then(setCrew)
      .catch((requestError) => setError(requestError.message));
  }, [crewId]);

  if (error) {
    return <div className="panel error-panel">{error}</div>;
  }

  if (!crew) {
    return <div className="panel">Loading crew dashboard...</div>;
  }

  const stats = [
    { label: "Light Tokens", value: crew.lightTokens },
    { label: "Shadow Marks", value: crew.shadowMarks },
    { label: "Mission Score", value: crew.missionScore },
    { label: "Recovery Bonus", value: crew.recoveryBonus },
    { label: "Gate Stability", value: crew.gateStabilityLevel }
  ];

  return (
    <section className="stack">
      <article className="panel">
        <p className="eyebrow">Crew File //</p>
        <h2>{crew.name}</h2>
        <p className="motto">{crew.motto}</p>
        <p>{crew.description}</p>
        <StatGrid stats={stats} />
        <div className="transmission-box">
          <span>Latest Transmission</span>
          <strong>{crew.latestTransmission}</strong>
        </div>
        <div className="button-row">
          <Link className="button" to={`/missions?crew=${crew.id}`}>Mission Archive</Link>
        </div>
      </article>
      <article className="panel">
        <h3>Active Missions</h3>
        <div className="mission-list">
          {crew.activeMissions.length ? crew.activeMissions.map((mission) => (
            <MissionCard key={mission.id} mission={{ ...mission, status: "active" }} crewId={crew.id} />
          )) : <p>No active missions are broadcasting right now.</p>}
        </div>
      </article>
      <article className="panel">
        <h3>Completed Missions</h3>
        <div className="mission-list">
          {crew.completedMissions.length ? crew.completedMissions.map((mission) => (
            <MissionCard key={mission.id} mission={{ ...mission, status: "completed" }} crewId={crew.id} />
          )) : <p>No completed missions logged yet.</p>}
        </div>
      </article>
    </section>
  );
}
