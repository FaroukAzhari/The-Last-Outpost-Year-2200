import { Link } from "react-router-dom";

export function MissionCard({ mission, crewId }) {
  const detailLink = crewId
    ? `/missions/${mission.id}?crew=${crewId}`
    : `/missions/${mission.id}`;

  return (
    <article className={`panel mission-card status-${mission.status}`}>
      <div className="mission-header">
        <div>
          <p className="eyebrow">{mission.day}</p>
          <h3>{mission.title}</h3>
        </div>
        <span className={`status-pill ${mission.status}`}>{mission.status}</span>
      </div>
      <p>{mission.storyIntro}</p>
      <div className="mission-meta">
        <span className="meta-chip">{mission.points} pts</span>
        <span className="meta-chip">{mission.hasAnswer ? "Answer required" : "Leader verification"}</span>
      </div>
      <Link className="button secondary" to={detailLink}>
        Open File
      </Link>
    </article>
  );
}
