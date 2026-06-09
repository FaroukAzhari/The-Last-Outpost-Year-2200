import { useEffect, useState } from "react";
import { api } from "../api";

const finalTitles = [
  "The Spark",
  "The Compass",
  "The Shield",
  "The Signal",
  "The Mind",
  "The Anchor",
  "The Flame",
  "The Breaker"
];

function getInitialDraft(member) {
  return member.evaluation ?? {
    courage: 5,
    loyalty: 5,
    intelligence: 5,
    discipline: 5,
    spirit: 5,
    leaderNote: "",
    finalTitle: finalTitles[0]
  };
}

export function EvaluationsPage() {
  const [members, setMembers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getMembers().then((payload) => {
      setMembers(payload);
      const nextDrafts = {};
      payload.forEach((member) => {
        nextDrafts[member.id] = getInitialDraft(member);
      });
      setDrafts(nextDrafts);
    });
  }, []);

  function updateDraft(memberId, field, value) {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [memberId]: {
        ...currentDrafts[memberId],
        [field]: value
      }
    }));
  }

  async function saveEvaluation(memberId) {
    const draft = drafts[memberId];
    const payload = {
      courage: Number(draft.courage),
      loyalty: Number(draft.loyalty),
      intelligence: Number(draft.intelligence),
      discipline: Number(draft.discipline),
      spirit: Number(draft.spirit),
      leaderNote: draft.leaderNote,
      finalTitle: draft.finalTitle
    };

    await api.evaluateMember(memberId, payload);
    setMessage("Evaluation saved.");
  }

  return (
    <section className="stack">
      <article className="panel">
        <p className="eyebrow">Leader Ratings</p>
        <h2>Individual Evaluation Board</h2>
        {message ? <p className="success-text">{message}</p> : null}
      </article>
      {members.map((member) => (
        <article key={member.id} className="panel">
          <div className="split-header">
            <div>
              <h3>{member.name}</h3>
              <p>{member.crewName}</p>
            </div>
            <span className="status-pill active">Member File</span>
          </div>
          <div className="trait-grid">
            {["courage", "loyalty", "intelligence", "discipline", "spirit"].map((trait) => (
              <label key={trait} className="field">
                <span>{trait.charAt(0).toUpperCase() + trait.slice(1)} /10</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={drafts[member.id]?.[trait] ?? 5}
                  onChange={(event) => updateDraft(member.id, trait, event.target.value)}
                />
              </label>
            ))}
          </div>
          <label className="field">
            <span>Leader Note</span>
            <textarea
              rows="3"
              value={drafts[member.id]?.leaderNote ?? ""}
              onChange={(event) => updateDraft(member.id, "leaderNote", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Final Title</span>
            <select
              value={drafts[member.id]?.finalTitle ?? finalTitles[0]}
              onChange={(event) => updateDraft(member.id, "finalTitle", event.target.value)}
            >
              {finalTitles.map((title) => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </label>
          <button className="button" onClick={() => saveEvaluation(member.id)} type="button">
            Save Evaluation
          </button>
        </article>
      ))}
    </section>
  );
}
