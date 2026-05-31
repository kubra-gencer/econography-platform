export default function PrimaryLink({
  children,
  onClick,
  variant = "primary",
  icon = "→",
}) {
  return (
    <button
      type="button"
      className={`primary-link primary-link-${variant}`}
      onClick={onClick}
    >
      <span>{children}</span>
      <em>{icon}</em>
    </button>
  );
}