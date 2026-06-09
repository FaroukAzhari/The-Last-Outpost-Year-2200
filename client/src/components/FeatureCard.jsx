export function FeatureCard({ eyebrow, title, body, accent = "blue" }) {
  return (
    <article className={`feature-card accent-${accent}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
