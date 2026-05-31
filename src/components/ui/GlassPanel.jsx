export default function GlassPanel({
  children,
  className = "",
  variant = "default",
  as: Component = "div",
}) {
  return (
    <Component className={`glass-panel glass-panel-${variant} ${className}`}>
      {children}
    </Component>
  );
}