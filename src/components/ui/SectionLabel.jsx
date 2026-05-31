export default function SectionLabel({ children, index = "01", tone = "gold" }) {
  return (
    <div className={`section-label section-label-${tone}`}>
      <span>{index}</span>
      <p>{children}</p>
    </div>
  );
}