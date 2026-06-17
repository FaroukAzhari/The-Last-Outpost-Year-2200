import { Link } from "react-router-dom";

const rules = [
  "No one gets left behind.",
  "Respect time, formations, and leader instructions.",
  "Phones are used only for camp-related access, missions, scoring, and approved communication.",
  "No unsafe behavior during night missions.",
  "Stay inside assigned boundaries.",
  "Protect equipment, tools, water, food, and nature.",
  "Keep faction areas and common areas clean.",
  "Every Rover must participate.",
  "Competition must remain respectful.",
  "Win with honor or do not win at all.",
  "Report injuries, fatigue, conflicts, or safety risks immediately.",
  "Leave the Outpost better than you found it."
];

export function RulesPage() {
  return (
    <section className="page-section">
      <p className="eyebrow">Survival Laws</p>
      <h1>Outpost Code</h1>
      <div className="button-row">
        <Link className="button quiet" to="/outpost-blueprint">View Outpost Layout</Link>
      </div>
      <div className="rule-list">
        {rules.map((rule, index) => (
          <article className="rule-item" key={rule}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{rule}</p>
          </article>
        ))}
      </div>
      <article className="info-card">
        <p className="eyebrow">Emergency Information</p>
        <h2>Emergency Assembly Point</h2>
        <p>Use the Outpost Blueprint to locate the assembly point near the Flag Pole and central courtyard during a Breach Alert, drill, evacuation, or headcount.</p>
      </article>
    </section>
  );
}
