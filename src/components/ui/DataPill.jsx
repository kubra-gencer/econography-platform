export default function DataPill({ label, value, tone = "neutral" }) {
  return (
    <div className={`data-pill data-pill-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}