import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { MissionCard } from "../components/MissionCard";

export function MissionsPage() {
  const [searchParams] = useSearchParams();
  const crewId = searchParams.get("crew");
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMissions(crewId)
      .then(setGroups)
      .catch((requestError) => setError(requestError.message));
  }, [crewId]);

  if (error) {
    return <div className="panel error-panel">{error}</div>;
  }

  if (!groups.length) {
    return <div className="panel">Loading mission archive...</div>;
  }

  return (
    <section className="stack">
      {groups.map((group) => (
        <article key={group.day} className="panel">
          <p className="eyebrow">Timeline</p>
          <h2>{group.day}</h2>
          <div className="mission-list">
            {group.missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} crewId={crewId} />
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}
