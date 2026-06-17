import { useEffect, useState } from "react";
import { api } from "../api";

const days = ["Day 1", "Day 2", "Day 3", "Day 4"];
const individualFields = [
  ["readiness", "Outpost Readiness"],
  ["discipline", "Discipline"],
  ["resourcefulness", "Resourcefulness"],
  ["teamwork", "Teamwork"],
  ["humanity", "Humanity"]
];

const initialForm = {
  day: "Day 1",
  roverId: "",
  readiness: 0,
  discipline: 0,
  resourcefulness: 0,
  teamwork: 0,
  humanity: 0,
  notes: "",
  growthMission: ""
};

export function LeaderIndividualEvaluationPage() {
  const [rovers, setRovers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");

  function refresh() {
    Promise.all([api.getRovers(), api.getIndividualEvaluations()]).then(([nextRovers, nextSummary]) => {
      setRovers(nextRovers);
      setSummary(nextSummary);
      setForm((current) => ({
        ...current,
        roverId: current.roverId || nextRovers[0]?.id || ""
      }));
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!summary || !form.roverId) {
      return;
    }

    const existing = summary.rows.find((row) => row.day === form.day && row.roverId === form.roverId);
    if (existing) {
      setForm((current) => ({
        ...current,
        ...Object.fromEntries(individualFields.map(([field]) => [field, existing[field]])),
        notes: existing.notes || "",
        growthMission: existing.growthMission || ""
      }));
    } else {
      setForm((current) => ({
        ...current,
        ...Object.fromEntries(individualFields.map(([field]) => [field, 0])),
        notes: "",
        growthMission: ""
      }));
    }
  }, [form.day, form.roverId, summary]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await api.saveIndividualEvaluation(form);
    setMessage("Individual evaluation saved.");
    refresh();
  }

  const total = individualFields.reduce((sum, [field]) => sum + Number(form[field] || 0), 0);

  return (
    <section className="page-section">
      <p className="eyebrow">Individual Evaluation</p>
      <h1>Rover Human Override Record</h1>
      <p className="lead">Evaluate each Rover on common camp traits adapted to the A.R.K. survival theme.</p>

      {rovers.length ? (
        <form className="form-card wide" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Day</span>
              <select value={form.day} onChange={(event) => update("day", event.target.value)}>
                {days.map((day) => <option key={day}>{day}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Rover</span>
              <select value={form.roverId} onChange={(event) => update("roverId", event.target.value)}>
                {rovers.map((rover) => <option key={rover.id} value={rover.id}>{rover.displayName}</option>)}
              </select>
            </label>
          </div>

          <div className="form-grid">
            {individualFields.map(([field, label]) => (
              <label className="field" key={field}>
                <span>{label} /20</span>
                <input min="0" max="20" type="number" value={form[field]} onChange={(event) => update(field, event.target.value)} />
              </label>
            ))}
          </div>

          <strong className="total-line">Daily individual total: {total}/100</strong>
          <label className="field"><span>Leader notes</span><textarea rows="3" value={form.notes} onChange={(event) => update("notes", event.target.value)} /></label>
          <label className="field"><span>Growth mission optional</span><textarea rows="3" value={form.growthMission} onChange={(event) => update("growthMission", event.target.value)} /></label>
          {message ? <p className="success-text">{message}</p> : null}
          <button className="button warning" type="submit">Save Individual Evaluation</button>
        </form>
      ) : (
        <article className="info-card">
          <h2>No Rovers yet</h2>
          <p>Individual evaluations become available after Rovers sign up.</p>
        </article>
      )}
    </section>
  );
}
