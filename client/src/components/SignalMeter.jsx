export function SignalMeter({ label, value, tone = "cyan" }) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  return (
    <article className={`signal-meter tone-${tone}`}>
      <div className="signal-meter__head">
        <span>{label}</span>
        <strong>{normalizedValue}%</strong>
      </div>
      <div className="signal-meter__track">
        <div className="signal-meter__fill" style={{ width: `${normalizedValue}%` }} />
      </div>
    </article>
  );
}
