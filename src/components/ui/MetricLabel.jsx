export default function MetricLabel({
  label,
  value,
  helper,
  progress = 0,
  tone = "blue",
}) {
  const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));

  return (
    <div className={`metric-label metric-label-${tone}`}>
      <div className="metric-label-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>

      <div className="metric-track">
        <div style={{ width: `${safeProgress}%` }} />
      </div>

      {helper && <p>{helper}</p>}
    </div>
  );
}