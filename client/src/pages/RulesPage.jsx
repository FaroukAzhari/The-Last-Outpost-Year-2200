const rules = [
  "No one gets left behind.",
  "Respect time and formations.",
  "Keep the Safe Zone clean.",
  "No unsafe behavior during night missions.",
  "Phones are used only for missions, photos, and communication when allowed.",
  "Respect leaders and crew members.",
  "Protect equipment and nature.",
  "Every mission requires teamwork."
];

export function RulesPage() {
  return (
    <section className="stack">
      <article className="panel">
        <p className="eyebrow">Mission Protocol</p>
        <h2>Camp Rules</h2>
        <div className="rule-list">
          {rules.map((rule) => (
            <div key={rule} className="rule-item">
              <span>0{rules.indexOf(rule) + 1}</span>
              <p>{rule}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
