export function StatGrid({ stats }) {
  return (
    <div className="stat-grid">
      {stats.map((stat) => (
        <article key={stat.label} className="panel stat-card">
          <p className="stat-label">{stat.label}</p>
          <p className="stat-value">{stat.value}</p>
          <div className="stat-card__glow" aria-hidden="true" />
        </article>
      ))}
    </div>
  );
}
