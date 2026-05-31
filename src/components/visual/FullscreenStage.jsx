import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function FullscreenStage({
  title = "Memory Stage",
  subtitle = "Expanded visualization",
  triggerLabel = "Expand Memory",
  children,
  legend = [],
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-[0.58rem] font-medium uppercase tracking-[0.16em] text-white/78 transition duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white"
      >
        {triggerLabel}
      </button>

      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[999] bg-[#030406]/96 text-white backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(139,163,255,0.14),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(255,204,130,0.08),transparent_30%)]" />

            <div className="relative z-10 flex h-screen flex-col p-4 md:p-6">
              <div className="mb-4 flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.035] px-5 py-4 backdrop-blur-2xl">
                <div>
                  <p className="mono-font text-[0.5rem] uppercase tracking-[0.2em] text-dim">
                    Expanded Memory Stage
                  </p>

                  <h2 className="system-title mt-1 text-[clamp(1.5rem,2.5vw,2.7rem)]">
                    {title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <p className="hidden max-w-[320px] text-right text-xs leading-6 text-muted md:block">
                    {subtitle}
                  </p>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.045] text-lg text-white/78 transition duration-300 hover:bg-white hover:text-black"
                    aria-label="Close fullscreen visualization"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_320px]">
                <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_0_160px_rgba(139,163,255,0.14)]">
                  {children}

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.04)_48%,rgba(3,4,6,0.72)_100%)]" />
                </div>

                <aside className="hidden min-h-0 overflow-y-auto rounded-[2rem] border border-white/10 bg-white/[0.035] backdrop-blur-2xl lg:block">
                  <div className="border-b border-white/10 p-5">
                    <p className="mono-font text-[0.5rem] uppercase tracking-[0.2em] text-dim">
                      Signal Legend
                    </p>

                    <p className="mt-3 text-sm leading-7 text-muted">
                      The expanded stage allows the visual memory to be read as a
                      system, not only as an artwork.
                    </p>
                  </div>

                  <div className="grid gap-px bg-white/10 pb-4">
                    {legend.length > 0 ? (
                      legend.map((item) => (
                        <div key={item.label} className="bg-black/35 p-5">
                          <p className="mono-font text-[0.48rem] uppercase tracking-[0.16em] text-dim">
                            {item.label}
                          </p>

                          <h3 className="system-title mt-2 text-xl">
                            {item.value}
                          </h3>

                          {item.text && (
                            <p className="mt-3 text-xs leading-6 text-muted">
                              {item.text}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-black/35 p-5">
                        <p className="text-sm leading-7 text-muted">
                          No legend has been attached to this memory stage yet.
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}