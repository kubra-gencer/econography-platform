import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import SignalSimulator from "../visualization/SignalSimulator";
import FullscreenStage from "../components/visual/FullscreenStage";

export default function VisualLabPage() {
  const [volatility, setVolatility] = useState(68);
  const [liquidity, setLiquidity] = useState(82);
  const [risk, setRisk] = useState(34);
  const [density, setDensity] = useState(76);

  const entity = useMemo(() => {
    let mood = "stable";

    if (risk > 68 || volatility > 76) {
      mood = "volatile";
    } else if (liquidity > 74) {
      mood = "liquid";
    } else if (density > 72) {
      mood = "dense";
    }

    return {
      mood,
      volatility,
      liquidity,
      risk,
      density,
      volume: density,
      health: Math.max(20, Math.round(100 - risk * 0.45 + liquidity * 0.22)),
    };
  }, [volatility, liquidity, risk, density]);

  const labLegend = useMemo(
    () => [
      {
        label: "Volatility",
        value: "Turbulence",
        text: "Higher volatility bends motion and makes the simulated memory field unstable.",
      },
      {
        label: "Liquidity",
        value: "Continuity",
        text: "Higher liquidity creates smoother flow and stronger visual coherence.",
      },
      {
        label: "Risk",
        value: "Fracture",
        text: "Risk introduces red pressure, distortion and broken movement in the field.",
      },
      {
        label: "Density",
        value: "Particle Pressure",
        text: "Density increases particle concentration and compresses the memory structure.",
      },
    ],
    []
  );

  return (
    <div className="relative overflow-hidden bg-[var(--bg)] pt-28 text-white">
      <div className="absolute inset-0 hero-atmosphere opacity-70" />

      <section className="page-padding relative z-10">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-6 pb-20">
          {/* TOP INFORMATION */}
          <div className="grid gap-8 pt-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            >
              <p className="label">Visual Intelligence Lab</p>

              <h1 className="page-title mt-6 max-w-4xl text-[clamp(2.2rem,4.1vw,4.7rem)]">
                Control the signals. Watch the memory change.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.12,
                duration: 0.9,
                ease: [0.76, 0, 0.24, 1],
              }}
              className="lg:pb-4"
            >
              <p className="max-w-2xl text-[0.98rem] leading-8 text-muted">
                The lab exposes the translation layer of Econography. Adjust
                volatility, liquidity, risk and density to see how financial
                behavior becomes visual form.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <ControlCard
                  label="Volatility"
                  value={volatility}
                  onChange={setVolatility}
                  meaning="Higher volatility increases turbulence and unstable motion."
                />

                <ControlCard
                  label="Liquidity"
                  value={liquidity}
                  onChange={setLiquidity}
                  meaning="Higher liquidity creates smoother and more coherent flow."
                />

                <ControlCard
                  label="Risk"
                  value={risk}
                  onChange={setRisk}
                  meaning="Higher risk introduces fracture, distortion and asymmetry."
                />

                <ControlCard
                  label="Density"
                  value={density}
                  onChange={setDensity}
                  meaning="Higher density increases particle pressure and concentration."
                />
              </div>
            </motion.div>
          </div>

          {/* VISUAL STAGE */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: 0.22,
              duration: 1.05,
              ease: [0.76, 0, 0.24, 1],
            }}
            className="relative h-[clamp(620px,68vh,780px)] overflow-hidden rounded-[2.4rem] border border-white/10 bg-black glow-blue"
          >
            <SignalSimulator entity={entity} />

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(3,4,6,0.04)_46%,rgba(3,4,6,0.72)_100%)]" />

            {/* STAGE TOP BAR */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-white/10 bg-black/24 px-6 py-3 backdrop-blur-2xl">
              <div>
                <p className="mono-font text-[0.48rem] uppercase tracking-[0.18em] text-dim">
                  Generated Memory State
                </p>

                <h2 className="system-title mt-1 text-[clamp(1.45rem,2.3vw,2.35rem)] capitalize">
                  {entity.mood} memory
                </h2>
              </div>

              <div className="hidden items-center gap-6 text-right md:flex">
                <StageInfo label="Volatility" value={`${volatility}%`} />
                <StageInfo label="Liquidity" value={`${liquidity}%`} />
                <StageInfo label="Risk" value={`${risk}%`} />
                <StageInfo label="Density" value={`${density}%`} />

                <FullscreenStage
                  title="Signal Simulator"
                  subtitle="Adjustable visual translation layer for Econography signals."
                  triggerLabel="Expand Lab"
                  legend={labLegend}
                >
                  <SignalSimulator entity={entity} />
                </FullscreenStage>
              </div>
            </div>

            {/* STAGE BOTTOM BAR */}
            <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/34 backdrop-blur-2xl">
              <div className="grid gap-px bg-white/10 md:grid-cols-4">
                <Reading
                  label="Volatility"
                  value="Turbulence"
                  text="Higher volatility bends motion and makes the memory unstable."
                />
                <Reading
                  label="Liquidity"
                  value="Continuity"
                  text="Liquidity creates smoother flow and coherent movement."
                />
                <Reading
                  label="Risk"
                  value="Fracture"
                  text="Risk appears as distortion, red pressure and broken flow."
                />
                <Reading
                  label="Density"
                  value="Pressure"
                  text="Transaction activity compresses particles into denser clusters."
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function ControlCard({ label, value, onChange, meaning }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.028] p-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
          {label}
        </p>

        <p className="text-sm font-medium text-white">{value}%</p>
      </div>

      <input
        className="mt-4 w-full"
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />

      <p className="mt-3 text-xs leading-6 text-muted">{meaning}</p>
    </div>
  );
}

function StageInfo({ label, value }) {
  return (
    <div>
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>

      <p className="mt-1.5 text-sm text-white/78">{value}</p>
    </div>
  );
}

function Reading({ label, value, text }) {
  return (
    <div className="bg-black/42 p-4">
      <p className="mono-font text-[0.46rem] uppercase tracking-[0.16em] text-dim">
        {label}
      </p>

      <h3 className="system-title mt-2 text-lg">{value}</h3>

      <p className="mt-2 text-xs leading-6 text-muted">{text}</p>
    </div>
  );
}