import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api";

export function MissionDetailPage() {
  const { missionId } = useParams();
  const [searchParams] = useSearchParams();
  const crewId = searchParams.get("crew");
  const [mission, setMission] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api.getMission(missionId, crewId)
      .then(setMission)
      .catch((requestError) => setError(requestError.message));
  }, [missionId, crewId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!crewId) {
      setFeedback("Crew identity missing. Return through crew access.");
      return;
    }

    try {
      const result = await api.submitMission(missionId, crewId, answer);
      setFeedback(result.message);
      setMission((currentMission) => ({
        ...currentMission,
        status: result.status
      }));
    } catch (requestError) {
      setFeedback(requestError.message);
    }
  }

  if (error) {
    return <div className="panel error-panel">{error}</div>;
  }

  if (!mission) {
    return <div className="panel">Opening classified file...</div>;
  }

  return (
    <section className="stack">
      <article className="panel">
        <div className="mission-header">
          <div>
            <p className="eyebrow">{mission.day}</p>
            <h2>{mission.title}</h2>
          </div>
          <span className={`status-pill ${mission.status}`}>{mission.status}</span>
        </div>
        <p>{mission.storyIntro}</p>
        <div className="detail-grid">
          <div>
            <h3>Objective</h3>
            <p>{mission.objective}</p>
          </div>
          <div>
            <h3>Clue</h3>
            <p>{mission.clueText}</p>
          </div>
        </div>
        <div className="detail-grid">
          <div>
            <h3>Rules</h3>
            <ul className="plain-list">
              {mission.rules.map((rule) => <li key={rule}>{rule}</li>)}
            </ul>
          </div>
          <div>
            <h3>Materials</h3>
            <ul className="plain-list">
              {mission.materials.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </article>

      {mission.hasAnswer ? (
        <article className="panel narrow-panel">
          <h3>Answer Submission</h3>
          <form className="stack" onSubmit={handleSubmit}>
            <label className="field">
              <span>Decoded Answer</span>
              <input value={answer} onChange={(event) => setAnswer(event.target.value)} />
            </label>
            <button className="button" type="submit">Transmit Answer</button>
            {feedback ? (
              <p className={feedback === "ACCESS GRANTED" ? "success-text" : "error-text"}>
                {feedback}
              </p>
            ) : null}
          </form>
        </article>
      ) : (
        <article className="panel narrow-panel">
          <h3>Leader Verification Required</h3>
          <p>This field mission must be completed on site and verified by leaders.</p>
        </article>
      )}
    </section>
  );
}
