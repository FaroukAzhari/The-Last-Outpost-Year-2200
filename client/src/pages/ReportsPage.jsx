import { useEffect, useState } from "react";
import { api } from "../api";

export function ReportsPage() {
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  function refresh() {
    api.getReports().then(setReport);
  }

  useEffect(() => {
    refresh();
  }, []);

  function exportJson() {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "havenwood-reports.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleMostImprovedChange(event) {
    await api.setMostImproved(event.target.value || null);
    setMessage("Most Improved selection saved.");
    refresh();
  }

  if (!report) {
    return <div className="panel">Compiling final report...</div>;
  }

  return (
    <section className="stack print-surface">
      <article className="panel">
        <div className="split-header">
          <div>
            <p className="eyebrow">Final Debrief</p>
            <h2>Reports & Awards</h2>
          </div>
          <div className="button-row">
            <button className="button" onClick={exportJson} type="button">Export JSON</button>
            <button className="button secondary" onClick={() => window.print()} type="button">Print View</button>
          </div>
        </div>
        {message ? <p className="success-text">{message}</p> : null}
      </article>

      <article className="panel award-grid">
        <div>
          <p className="eyebrow">Best Team</p>
          <h3>{report.bestTeam?.name || "Pending"}</h3>
          <p>{report.bestTeam?.totalScore ?? 0} points</p>
        </div>
        <div>
          <p className="eyebrow">Best Member</p>
          <h3>{report.bestMember?.name || "Pending"}</h3>
          <p>{report.bestMember ? `${report.bestMember.averageScore.toFixed(1)} average` : "No evaluations yet"}</p>
        </div>
        <div>
          <p className="eyebrow">Most Improved</p>
          <h3>{report.mostImproved?.name || "Manual Selection Needed"}</h3>
          <p>{report.mostImproved ? "Selection stored in mission records." : "Choose a member below to save the award."}</p>
        </div>
      </article>

      <article className="panel">
        <h3>Most Improved Selection</h3>
        <MostImprovedSelector currentId={report.mostImproved?.id} onChange={handleMostImprovedChange} />
      </article>

      <article className="panel">
        <h3>Final Standings</h3>
        <div className="standings-table">
          <div className="standings-row headings">
            <span>Crew</span>
            <span>Light</span>
            <span>Shadow</span>
            <span>Mission</span>
            <span>Recovery</span>
            <span>Total</span>
          </div>
          {report.standings.map((crew) => (
            <div key={crew.id} className="standings-row">
              <span>{crew.name}</span>
              <span>{crew.lightTokens}</span>
              <span>{crew.shadowMarks}</span>
              <span>{crew.missionScore}</span>
              <span>{crew.recoveryBonus}</span>
              <span>{crew.totalScore}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function MostImprovedSelector({ currentId, onChange }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    api.getMembers().then(setMembers);
  }, []);

  return (
    <label className="field">
      <span>Member</span>
      <select value={currentId || ""} onChange={onChange}>
        <option value="">None selected</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name} - {member.crewName}
          </option>
        ))}
      </select>
    </label>
  );
}
